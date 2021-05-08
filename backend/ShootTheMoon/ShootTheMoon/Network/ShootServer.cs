using System.Collections.Generic;
using System.Threading.Tasks;

using Grpc.Core;
using ShootTheMoon.Game;
using ShootTheMoon.Utils;
using ShootTheMoon.Network.Proto;

namespace ShootTheMoon.Network
{
    class ShootServerImpl : ShootServer.ShootServerBase
    {

        class RpcClient
        {

            public IServerStreamWriter<Notification> Stream { get; }

            public Client Client { get; }

            public Game.Game Game { get; }

            public RpcClient(IServerStreamWriter<Notification> stream, Client client, Game.Game game)
            {
                Stream = stream;
                Client = client;
                Game = game;
            }

            public async Task SendCurrentState() {
                // TODO: Add other clients from this game.  -- Tim 2021-05-08
                Dictionary<string, RpcClient> clientList = new Dictionary<string, RpcClient>();
                clientList.Add(this.Client.Token, this);

                // Update The Seat List
                await SendSeatsList(Game, clientList);

                // Update Scores
                await SendScore(Game, clientList);

                // Update Tricks
                await SendTricks(Game, clientList);

                // Based On State, may need to send:
                //   * Bid Request
                //   * Bid List
                //   * Transfer Request
                //   * Transfer
                //   * Throwaway Request
                //   * Play Card Request
                //   * Update Timeout
                //   * Played Cards
            }

        }

        Dictionary<string, Game.Game> games = new Dictionary<string, Game.Game>();
        Dictionary<string, RpcClient> clients = new Dictionary<string, RpcClient>();

        private readonly object idLock = new object();

        public override Task<CreateGameResponse> CreateGame(CreateGameRequest request, ServerCallContext context) {

            Game.Game game;

            GameSettings settings = GameSettings.GamePresets["SIXPLAYER"];
            switch (request.Seats) {
                case 4:
                    settings = GameSettings.GamePresets["FOURPLAYER"];
                    break;
                case 6:
                default:
                    settings = GameSettings.GamePresets["SIXPLAYER"];
                    break;

            }

            game = new Game.Game(settings);

            // We can generate the first id outside the locked loop because the check is
            // the part where we care about ensuring sequential access.
            string id = IdGenerator.NewId();
            lock(idLock) {
                while (games.ContainsKey(id)) {
                    id = IdGenerator.NewId();
                }

                game.Name = id;
                games.Add(id, game);
            }
            if (Program.Verbose) System.Console.WriteLine("New game generated: " + id);

            CreateGameResponse response = new CreateGameResponse();
            response.Uuid = id;
            return Task.FromResult(response);
        }

        public override async Task JoinGame(JoinGameRequest request, IServerStreamWriter<Notification> responseStream, ServerCallContext context)
        {
            Game.Game game;
            Notification n = new Notification();

            try
            {
                game = games[request.Uuid];
            }
            catch (KeyNotFoundException)
            {
                if (Program.Verbose) System.Console.WriteLine("Join failed -- game " + request.Uuid + " not found");

                // The game key doesn't exist, so try to add the game
                //game = new Game.Game(GameSettings.GamePresets["SIXPLAYER"]);
                //games.Add(request.Uuid, game);  //TODO: Change This To Handle The Generated UUIDS (this should be a failure case normally)
                
                n.Status = new StatusResponse();
                n.Status.Success = false;
                n.Status.ErrorNum = 3;  //TODO: Error Enum
                n.Status.ErrorText = "No Game Exists";
                await responseStream.WriteAsync(n);
                return;
            }

            context.UserState.Add("gameId", request.Uuid);

            Client c = new Client();
            c.Name = request.Name;

            RpcClient client = new RpcClient(responseStream, c, game);
            game.Clients.Add(c);
            clients.Add(c.Token, client);

            // Send A Join Game Response
            JoinGameResponse jgr = new JoinGameResponse();
            jgr.Token = c.Token;
            n.JoinResponse = jgr;
            await responseStream.WriteAsync(n);

            // Call The Send Initial State Function To The Client
            // This should either send basic stuff or 
            await client.SendCurrentState();

            try
            {
                await Task.Delay(-1, context.CancellationToken);
            }
            catch (TaskCanceledException)
            {
                if (Program.Verbose) System.Console.WriteLine("Task cancelled with client token " + c.Token);
                // Task Cancelled, Do Any Disconnection Stuff
                clients.Remove(c.Token);
                game.Clients.Remove(c);
            }

        }

        private static async Task BroadcastNotification(Notification notification, Game.Game game, Dictionary<string, RpcClient> clients) {
            List<Task> tasks = new List<Task>();
            
            foreach (Client c in game.Clients)
            {
                try
                {
                    RpcClient rpcClient = clients[c.Token];
                    tasks.Add(rpcClient.Stream.WriteAsync(notification));
                    if (Program.Verbose) System.Console.WriteLine("Broadcast complete to " + c.Token);
                }
                catch (KeyNotFoundException)
                {
                    if (Program.Verbose) System.Console.WriteLine("Couldn't broadcast: client key not found.");
                }
            }

            await Task.WhenAll(tasks);
            if (Program.Verbose) System.Console.WriteLine("Broadcast complete for game " + game.Name);
        }

        private static async Task SendSeatsList(Game.Game game, Dictionary<string, RpcClient> clients)
        {
            SeatsList sl = new SeatsList();
            for (int i = 0; i < game.NumPlayers; i++)
            {
                Client c = game.Players[i];
                SeatDetails details = new SeatDetails();
                details.Seat = (uint)i;
                details.Ready = false;
                details.Empty = (c == null);
                details.Human = (c == null) ? false : c.Human;
                details.Name = (c == null) ? "" : c.Name;
                sl.Seats.Add(details);
            }

            Notification n = new Notification();
            n.SeatList = sl;

            await BroadcastNotification(n, game, clients);
        }

        private static async Task SendScore(Game.Game game, Dictionary<string, RpcClient> clients) {
            Scores scores = new Scores();
            scores.Team1 = (uint)game.Score[0];
            scores.Team2 = (uint)game.Score[1];

            Notification n = new Notification();
            n.Scores = scores;

            await BroadcastNotification(n, game, clients);
        }

        private static async Task SendTricks(Game.Game game, Dictionary<string, RpcClient> clients) {
            Tricks tricks = new Tricks();
            tricks.Team1 = (uint)game.Tricks[0];
            tricks.Team2 = (uint)game.Tricks[1];

            Notification n = new Notification();
            n.Tricks = tricks;

            await BroadcastNotification(n, game, clients);
        }

        public override async Task<StatusResponse> TakeSeat(TakeSeatRequest request, ServerCallContext context)
        {
            string uuid = context.RequestHeaders.GetValue("x-game-id");
            string clientToken = context.RequestHeaders.GetValue("x-game-token");

            StatusResponse r = new StatusResponse();
            Game.Game game;

            try
            {
                game = games[uuid];
            }
            catch (KeyNotFoundException)
            {
                r.Success = false;
                r.ErrorNum = 1; // TODO: Error Enum
                r.ErrorText = "Game Not Found";
                return r;
            }

            // Try To Take The Seat Request
            Client seatClient = game.Players[request.Seat];
            if (seatClient != null)
            {
                r.Success = false;
                r.ErrorNum = 2; // TODO: Error Enum
                r.ErrorText = "Seat In Use";
                return r;
            }
            else
            {
                RpcClient client = clients[clientToken];
                game.Players[request.Seat] = client.Client;
            }

            r.Success = true;
            r.ErrorNum = 0;
            r.ErrorText = "";

            await SendSeatsList(game, clients);

            return r;
        }


    }
}
using System.Collections.Generic;
using System.Threading.Tasks;

using Grpc.Core;
using ShootTheMoon.Game;
using ShootTheMoon.Utils;
using ShootTheMoon.Network.Proto;
using Serilog;

namespace ShootTheMoon.Network
{
    class ShootServerImpl : ShootServer.ShootServerBase
    {

        class RpcClient : Game.Client
        {

            public IServerStreamWriter<Notification> Stream { get; }

            public RpcClient(IServerStreamWriter<Notification> stream, string name)
            {
                Stream = stream;
                Name = name;                
            }

        }

        Dictionary<string, Game.Game> games = new Dictionary<string, Game.Game>();

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
            Log.Debug("New game generated: " + id);

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
                Log.Debug("Join failed -- game " + request.Uuid + " not found");

                // The game key doesn't exist, so send an error
                n.Status = new StatusResponse();
                n.Status.Success = false;
                n.Status.ErrorNum = 3;  //TODO: Error Enum
                n.Status.ErrorText = "No Game Exists";
                await responseStream.WriteAsync(n);
                return;
            }

            context.UserState.Add("gameId", request.Uuid);

            RpcClient client = new RpcClient(responseStream, request.Name);
            game.Clients.Add(client);

            // Send A Join Game Response
            JoinGameResponse jgr = new JoinGameResponse();
            jgr.Token = client.Token;
            n.JoinResponse = jgr;
            await responseStream.WriteAsync(n);

            // Call The Send Initial State Function To The Client 
            await SendCurrentState(game);

            try
            {
                await Task.Delay(-1, context.CancellationToken);
            }
            catch (TaskCanceledException)
            {
                // Task Cancelled, Do Any Disconnection Stuff
                Log.Debug("Client Disconnected, Task Cancelled " + client.Token);
                
                // Handle Removing The Client From The Seat, and if needed replacing them with a bot
                for(int i = 0; i < game.Players.Length; i++) {
                    if (client.Equals(game.Players[i])) {
                        game.Players[i] = null;
                    }
                }
                game.Clients.Remove(client);

                // TODO: Replace The Player With A Bot If The Game Is In Progress

                // Update All The Clients
                if (game.Clients.Count > 0) {
                    await SendCurrentState(game);
                }
            }

        }

        private static async Task BroadcastNotification(Notification notification, Game.Game game) {
            List<Task> tasks = new List<Task>();

            foreach (Client c in game.Clients)
            {
                if (c is RpcClient)
                {
                    RpcClient rpcClient = (RpcClient)c;
                    tasks.Add(rpcClient.Stream.WriteAsync(notification));
                }
            }

            await Task.WhenAll(tasks);
            Log.Debug("Broadcast complete for game " + game.Name);
        }

        private static async Task SendSeatsList(Game.Game game)
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

            await BroadcastNotification(n, game);
        }
        private static async Task SendScore(Game.Game game) {
            Scores scores = new Scores();
            scores.Team1 = (uint)game.Score[0];
            scores.Team2 = (uint)game.Score[1];

            Notification n = new Notification();
            n.Scores = scores;

            await BroadcastNotification(n, game);
        }

        private static async Task SendTricks(Game.Game game) {
            Tricks tricks = new Tricks();
            tricks.Team1 = (uint)game.Tricks[0];
            tricks.Team2 = (uint)game.Tricks[1];

            Notification n = new Notification();
            n.Tricks = tricks;

            await BroadcastNotification(n, game);
        }


        public async Task SendCurrentState(Game.Game game) {
            // Update The Seat List
            await SendSeatsList(game);

            // Update Scores
            await SendScore(game);

            // Update Tricks
            await SendTricks(game);

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

        private RpcClient FindClient(Game.Game game, string token) {
            foreach (Client c in game.Clients) {
                if (c is not RpcClient)
                    continue;

                RpcClient client = (RpcClient)c;
                if (c.Token.Equals(token)) {
                    return client;
                }
            }
            throw new KeyNotFoundException();
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
                try {
                    RpcClient client = FindClient(game, clientToken);
                    game.Players[request.Seat] = client;
                }
                catch (KeyNotFoundException) {
                    r.Success = false;
                    r.ErrorNum = 3; // TODO: Error Enum
                    r.ErrorText = "Client Not Found";
                    return r;
                }

                
            }

            r.Success = true;
            r.ErrorNum = 0;
            r.ErrorText = "";

            await SendSeatsList(game);
            return r;
        }


    }
}
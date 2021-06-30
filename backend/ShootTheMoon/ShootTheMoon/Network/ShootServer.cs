using System;
using System.Collections.Generic;
using System.Threading.Tasks;

using Grpc.Core;
using ShootTheMoon.Game;
using ShootTheMoon.Utils;
using ShootTheMoon.Network.Proto;
using Serilog;

namespace ShootTheMoon.Network
{
    class ShootServerImpl : ShootServer.ShootServerBase, IObserver<GameEvent>
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

        enum ErrorCode : int {
            SUCCESS = 0,
            GAME_NOT_FOUND = 1,
            SEAT_IN_USE = 2,
            CLIENT_NOT_FOUND = 3
        }

        Dictionary<string, Game.Game> games = new Dictionary<string, Game.Game>();

        private readonly object idLock = new object();
        private const string GAME_ID = "x-game-id";
        private const string CLIENT_TOKEN = "x-game-token";

        public virtual void OnCompleted() {
            // Nothing To Do Here
        }

        public virtual void OnError(Exception e)
        {
            // No implementation.
        }

        public virtual async void OnNext(GameEvent info)
        {

            Console.Out.Write("Game Event: {0}", info);

            Game.Game game = info.Game;

            // Process Client Update
            if ((info.Type & GameEventType.ClientUpdate) == GameEventType.ClientUpdate) {
                // Update List Of Clients
            }

            // Progress Score Update
            if ((info.Type & GameEventType.ScoreUpdate) == GameEventType.ScoreUpdate) {
                await ScoreUpdate(game);
            }

            // Progress Tricks Update
            if ((info.Type & GameEventType.TricksUpdate) == GameEventType.TricksUpdate) {
                await TricksUpdate(game);
            }

            // Process A Seat List Update
            if ((info.Type & GameEventType.SeatListUpdate) == GameEventType.SeatListUpdate) {

                await SeatListUpdate(game);
            }

            // Process Start Game
            if ((info.Type & GameEventType.StartGame) == GameEventType.StartGame) {
                // Handle Start Game
            }

            if ((info.Type & GameEventType.DealCards) == GameEventType.DealCards) {
                // Handle Card Dealing
            }

        }


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
                game.Subscribe(this);
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
                n.Status.ErrorNum = (int)ErrorCode.GAME_NOT_FOUND;
                n.Status.ErrorText = "No Game Exists";
                await responseStream.WriteAsync(n);
                return;
            }

            context.UserState.Add("gameId", request.Uuid);

            RpcClient client = new RpcClient(responseStream, request.Name);
            game.AddClient(client);
            //game.Clients.Add(client);

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

        public async Task SeatListUpdate(Game.Game game) {
            SeatsList sl = new SeatsList();
            for (int i = 0; i < game.NumPlayers; i++)
            {
                Client c = game.Players[i];
                SeatDetails details = new SeatDetails();
                details.Seat = (uint)i;
                details.Ready = (c == null) ? false : c.Ready;
                details.Empty = (c == null);
                details.Human = (c == null) ? false : c.Human;
                details.Name = (c == null) ? "" : c.Name;
                sl.Seats.Add(details);
            }

            Notification n = new Notification();
            n.SeatList = sl;

            await BroadcastNotification(n, game);
        }

        public async Task ScoreUpdate(Game.Game game) {
            Scores scores = new Scores();
            scores.Team1 = (uint)game.Score[0];
            scores.Team2 = (uint)game.Score[1];

            Notification n = new Notification();
            n.Scores = scores;

            await BroadcastNotification(n, game);
        }

        public async Task TricksUpdate(Game.Game game) {
            Tricks tricks = new Tricks();
            tricks.Team1 = (uint)game.Tricks[0];
            tricks.Team2 = (uint)game.Tricks[1];

            Notification n = new Notification();
            n.Tricks = tricks;

            await BroadcastNotification(n, game);
        }

        private static Dictionary<Game.Suit, Proto.Card.Types.Suit> GameSuitToProtoSuite = new Dictionary<Suit, Proto.Card.Types.Suit>() 
        {
            {Game.Suit.Clubs, Proto.Card.Types.Suit.Clubs},
            {Game.Suit.Diamonds, Proto.Card.Types.Suit.Diamonds},
            {Game.Suit.Hearts, Proto.Card.Types.Suit.Hearts},
            {Game.Suit.Spades, Proto.Card.Types.Suit.Spades}
        };

        private static Dictionary<Game.Rank, Proto.Card.Types.Rank> GameRankToProtoRank = new Dictionary<Rank, Proto.Card.Types.Rank>()
        {
            {Game.Rank.Nine, Proto.Card.Types.Rank.Nine},
            {Game.Rank.Ten, Proto.Card.Types.Rank.Ten},
            {Game.Rank.Jack, Proto.Card.Types.Rank.Jack},
            {Game.Rank.Queen, Proto.Card.Types.Rank.Queen},
            {Game.Rank.King, Proto.Card.Types.Rank.King},
            {Game.Rank.Ace, Proto.Card.Types.Rank.Ace}
        };

        // Converts a Game.Card to a Proto.Card
        /// <summary>
        /// Converts a Game.Card to a Proto.Card
        /// </summary>
        /// <param name="card">the card to convert</param>
        /// <returns>
        /// The equvalent Proto.Card representation of the passed Game.Card
        /// </returns>
        private static Proto.Card GameCardToProtoCard(Game.Card card) {
            Proto.Card returnCard = new Proto.Card();
            returnCard.Suit = GameSuitToProtoSuite[card.Suit];
            returnCard.Rank = GameRankToProtoRank[card.Rank];
            return returnCard;
        }

        public async Task DealUpdate(Game.Game game) {
            List<Task> tasks = new List<Task>();

            foreach (Client client in game.Players) {
                if (client is RpcClient)
                {
                    RpcClient rpcClient = (RpcClient)client;

                    Hand hand = new Hand();
                    hand.Dealer = (uint)game.Dealer;
                    hand.Hand_.Clear();

                    foreach (Game.Card card in client.Hand) {
                        hand.Hand_.Add(GameCardToProtoCard(card));
                    }

                    Notification n = new Notification();
                    n.Hand = hand;
                    tasks.Add(rpcClient.Stream.WriteAsync(n));
                }
            }

            await Task.WhenAll(tasks);
            Log.Debug("Deal Notification complete for game " + game.Name);
        }

        public async Task SendCurrentState(Game.Game game) {
            // Update The Seat List
            //await SendSeatsList(game);
            await SeatListUpdate(game);

            // Update Scores
            //await SendScore(game);
            await ScoreUpdate(game);

            // Update Tricks
            //await SendTricks(game);
            await TricksUpdate(game);

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
            string uuid = context.RequestHeaders.GetValue(GAME_ID);
            string clientToken = context.RequestHeaders.GetValue(CLIENT_TOKEN);

            StatusResponse r = new StatusResponse();
            Game.Game game;

            try
            {
                game = games[uuid];
            }
            catch (KeyNotFoundException)
            {
                r.Success = false;
                r.ErrorNum = (int)ErrorCode.GAME_NOT_FOUND; 
                r.ErrorText = "Game Not Found";
                return r;
            }

            // Try To Take The Seat Request
            Client seatClient = game.Players[request.Seat];
            if (seatClient != null && !seatClient.Token.Equals(clientToken))
            {
                r.Success = false;
                r.ErrorNum = (int)ErrorCode.SEAT_IN_USE;
                r.ErrorText = "Seat In Use";
                return r;
            }
            else
            {
                try {
                    RpcClient client = FindClient(game, clientToken);
                    game.TakeSeat(request.Seat, client);
                }
                catch (KeyNotFoundException) {
                    r.Success = false;
                    r.ErrorNum = (int)ErrorCode.CLIENT_NOT_FOUND;
                    r.ErrorText = "Client Not Found";
                    return r;
                }
            }

            r.Success = true;
            r.ErrorNum = (int)ErrorCode.SUCCESS;
            r.ErrorText = "";

            return r;
        }

        public override async Task<StatusResponse> SetReadyStatus(SetReadyStatusRequest request, ServerCallContext context) {
            string uuid = context.RequestHeaders.GetValue(GAME_ID);
            string clientToken = context.RequestHeaders.GetValue(CLIENT_TOKEN);

            StatusResponse r = new StatusResponse();
            Game.Game game;

            try {
                game = games[uuid];
            }
            catch (KeyNotFoundException) {
                r.Success = false;
                r.ErrorNum = (int)ErrorCode.GAME_NOT_FOUND;
                r.ErrorText = "Game Not Found";
                return r;
            }

            try {
                RpcClient client = FindClient(game, clientToken);
                client.Ready = request.Ready;
            }
            catch (KeyNotFoundException) {
                r.Success = false;
                r.ErrorNum = (int)ErrorCode.CLIENT_NOT_FOUND;
                r.ErrorText = "Client Not Found";
                return r;
            }

            r.Success = true;
            r.ErrorNum = (int)ErrorCode.SUCCESS;
            r.ErrorText = "";

            //await SendSeatsList(game);

            //if (game.StartGame()) {
                // Game Can Only Start If All Players Ready

            //}

            return r;
        }
    }
}
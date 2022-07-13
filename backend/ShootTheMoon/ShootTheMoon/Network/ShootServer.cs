using System;
using System.Collections.Generic;
using System.Threading;
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
            private UInt32 sequence;
            private SemaphoreSlim semaphore;
            private IServerStreamWriter<Notification> Stream { get; }
            private Object sequenceLock = new Object();

            public bool Connected { get; set; }

            public RpcClient(IServerStreamWriter<Notification> stream, string name)
            {
                sequence = 0;
                Stream = stream;
                _name = name;   
                semaphore = new SemaphoreSlim(1, 1);
                Connected = true;
            }

            public uint getNextSequence() {
                lock(sequenceLock) {return this.sequence++;}
            }

            public async Task WriteAsync(Notification message) {
                await semaphore.WaitAsync();
                try {
                    if (Connected) {
                        await Stream.WriteAsync(message);
                    } else {
                        Log.Debug("Dropping message as client is not connected");
                    }
                } catch {
                    Log.Debug("Write failed.  Releasing semaphore");
                } finally {
                    semaphore.Release();
                }
            }

        }

        enum ErrorCode : int {
            SUCCESS = 0,
            GAME_NOT_FOUND = 1,
            SEAT_IN_USE = 2,
            CLIENT_NOT_FOUND = 3,
            INVALID_BID = 4,
            INVALID_CARD_PLAYED = 5,
            PLAYER_NOT_TRANSFERRING = 6
            
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
            Game.Game game = info.Game;

            // Process Client Update
            if ((info.Type & GameEventType.ClientUpdate) == GameEventType.ClientUpdate) {
                // Update List Of Clients
            }

            // Process A Seat List Update
            if ((info.Type & GameEventType.SeatListUpdate) == GameEventType.SeatListUpdate) {

                await SeatListUpdate(game);
            }

            // Process Start Game
            if ((info.Type & GameEventType.StartGame) == GameEventType.StartGame) {
                // Handle Start Game
                await StartGameUpdate(game);
            }

            if ((info.Type & GameEventType.DealCards) == GameEventType.DealCards) {
                // Handle Card Dealing
                await DealUpdate(game);
            }

            if ((info.Type & GameEventType.RequestBid) == GameEventType.RequestBid) {
                // Request A Bit From The Client Specified In info.Client
                if (info.AdditionalData is Client) {
                    await RequestBid(game, (Client)info.AdditionalData);
                }
            }

            if ((info.Type & GameEventType.TransferRequest) == GameEventType.TransferRequest) {
                // Request A Transfer From The List Of Clients Specified in the AdditionalInfo
                if (info.AdditionalData is List<Client>) {
                    await TransferCardRequest(game, (List<Client>)info.AdditionalData);
                }
            }

            if ((info.Type & GameEventType.BidUpdate) == GameEventType.BidUpdate) {
                // Send A Bit List Update To All Players
                await BidListUpdate(game);
            }

            if ((info.Type & GameEventType.TrumpUpdate) == GameEventType.TrumpUpdate) {
                // Send A Trump Update
                await TrumpUpdate(game);
            }            

            // Need to notify the client about the played cards before asking it to play any cards.
            if ((info.Type & GameEventType.PlayedCards) == GameEventType.PlayedCards) {
                // Send A Played Cards Event
                await PlayedCardsUpdate(game);
            }

            if ((info.Type & GameEventType.PlayCardRequest) == GameEventType.PlayCardRequest) {
                // Send A Play Card Request To The Client Specified in info.Client
                if (info.AdditionalData is Client) {
                    await PlayCardRequest(game, (Client)info.AdditionalData);
                }
            }

            // Progress Tricks Update
            if ((info.Type & GameEventType.TricksUpdate) == GameEventType.TricksUpdate) {
                await TricksUpdate(game);
            }

            // Progress Score Update
            if ((info.Type & GameEventType.ScoreUpdate) == GameEventType.ScoreUpdate) {
                await ScoreUpdate(game);
            }
        }

        private static async Task SendNotification(RpcClient client, Notification notification) {
            bool sent = false;
            const int MAX_RETRIES = 10;
            int retriesAttempted = 0;

            notification.Sequence = client.getNextSequence();

            while (!sent)
            {
                try {
                    Log.Debug("{0}-{1}-{2}:{3}", client.Name, notification.Sequence, retriesAttempted, notification.ToString());
                    await client.WriteAsync(notification);
                    sent = true;
                }
                catch (InvalidOperationException e) {
                    Log.Debug(e.ToString());
                    if (retriesAttempted > MAX_RETRIES) return;
                    retriesAttempted++;
                    await Task.Delay(100);
                    Log.Debug("{0}-{1}-{2}: Send failed.  Retrying.", client.Name, notification.Sequence, retriesAttempted);
                }
            }
        }

        public override Task<CreateGameResponse> CreateGame(CreateGameRequest request, ServerCallContext context) {

            Game.Game game;

            GameSettings settings = GameSettings.GamePresets["SIXPLAYER"];
            switch (request.Seats) {
                #if DEBUG
                case 2:
                    settings = GameSettings.GamePresets["TWOPLAYER"];
                    break;
                #endif
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
            RpcClient client = new RpcClient(responseStream, request.Name);

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
                await SendNotification(client, n);
                return;
            }

            context.UserState.Add("gameId", request.Uuid);

            await game.AddClient(client);

            // Send A Join Game Response
            JoinGameResponse jgr = new JoinGameResponse();
            jgr.Token = client.Token;
            jgr.Seats = (uint)game.NumPlayers;
            n.JoinResponse = jgr;
            await SendNotification(client, n);


            // Call The Send Initial State Function To The Client 
            await SendCurrentState(game);

            try
            {
                await Task.Delay(-1, context.CancellationToken);
            }
            catch (TaskCanceledException)
            {
                // Task Cancelled, Do Any Disconnection Stuff
                client.Connected = false;
                Log.Debug("{2}: Client Disconnected, Task Cancelled: Token: {0}, Name: {1} ", client.Token, client.Name, game.Name);
                
                // Handle Removing The Client From The Seat, and if needed replacing them with a bot
                for(int i = 0; i < game.Players.Length; i++) {
                    if (client.Equals(game.Players[i])) {
                        game.Players[i] = null;
                    }
                }
                await game.RemoveClient(client);

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
                    tasks.Add(SendNotification(rpcClient, notification.Clone()));
                }
            }

            await Task.WhenAll(tasks);
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
            int tricksPlayed = game.Tricks[0] + game.Tricks[1];
            int tricksRemaining = game.GameSettings.TricksPerHand - tricksPlayed;

            Tricks tricks = new Tricks();
            tricks.Team1 = (uint)game.Tricks[0];
            tricks.Team2 = (uint)game.Tricks[1];
            tricks.TricksRemainingInHand = (uint)tricksRemaining;

            Notification n = new Notification();
            n.Tricks = tricks;

            await BroadcastNotification(n, game);
        }

        public async Task BidListUpdate(Game.Game game) {
            BidList bidList = new BidList();
            bidList.Bids.Clear();

            foreach (Game.Bid bid in game.Bids) {
                Proto.Bid b = new Proto.Bid();
                b.Seat = bid.Seat;
                b.ShootNum = bid.ShootNumber;
                b.Tricks = bid.Number;                
                if (b.Tricks > 0 || b.ShootNum > 0) {
                    b.Trump = GameTrumpToProtoTrump[bid.Trump];
                }
                bidList.Bids.Add(b);
            }

            for (uint i = 0; i < game.NumPlayers; i++)
            {
                Client c = game.Players[i];
                if (game.CurrentPlayer == c && game.State == GameState.AWAITING_BIDS) {
                    bidList.CurrentBidder = i;
                }
            }
            
            Notification n = new Notification();
            n.BidList = bidList;

            await BroadcastNotification(n, game);
        }

        public async Task TrumpUpdate(Game.Game game) {
            TrumpUpdate trumpUpdate = new TrumpUpdate();
            
            trumpUpdate.Tricks = game.CurrentBid.Number;
            trumpUpdate.ShootNum = game.CurrentBid.ShootNumber;
            trumpUpdate.Trump = GameTrumpToProtoTrump[game.CurrentBid.Trump];
            trumpUpdate.Seat = game.CurrentBid.Seat;
            
            Notification n = new Notification();
            n.TrumpUpdate = trumpUpdate;

            await BroadcastNotification(n, game);
        }

        public async Task StartGameUpdate(Game.Game game) {
            Notification n = new Notification();
            n.StartGame = new StartGame();
            await BroadcastNotification(n, game);
        }

        private static Dictionary<Game.Trump, Proto.Trump> GameTrumpToProtoTrump = new Dictionary<Game.Trump, Proto.Trump>()
        {
            {Game.Trump.Clubs, Proto.Trump.Clubs},
            {Game.Trump.Diamonds, Proto.Trump.Diamonds},
            {Game.Trump.Hearts, Proto.Trump.Hearts},
            {Game.Trump.Spades, Proto.Trump.Spades},
            {Game.Trump.High, Proto.Trump.High},
            {Game.Trump.Low, Proto.Trump.Low}
        };

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
                    tasks.Add(SendNotification(rpcClient, n));
                }
            }

            await Task.WhenAll(tasks);
            Log.Debug("{0}: Deal Notification complete", game.Name);
        }

        public async Task RequestBid(Game.Game game, Client bidder) {
            if (bidder is RpcClient) {
                RpcClient rpcClient = (RpcClient)bidder;

                Notification n = new Notification();
                n.BidRequest = new BidRequest();
                await SendNotification(rpcClient, n);
                Log.Debug("{0}: Request Bid Notification complete", game.Name);
            }
        }   

        public async Task TransferCardRequest(Game.Game game, List<Client> transferFrom) {
            List<Task> tasks = new List<Task>();

            foreach (Client bidder in transferFrom) {
                if (bidder is RpcClient) {
                    RpcClient rpcClient = (RpcClient)bidder;

                    TransferRequest tr = new TransferRequest();
                    tr.ToSeat = game.FindSeat(game.CurrentPlayer);
                    tr.FromSeat = game.FindSeat(bidder);

                    Notification n = new Notification();
                    n.TransferRequest = tr;

                    tasks.Add(SendNotification(rpcClient, n));
                    Log.Debug("{0}: Transfer Card Request From {1} To {2}", game.Name, bidder.Name, game.CurrentPlayer.Name);
                }
            }

            await Task.WhenAll(tasks);
        }

        public async Task PlayCardRequest(Game.Game game, Client currentPlayer) {
            Notification n = new Notification();
            n.PlayCardRequest = new PlayCardRequest();

            // Figure Out How To Indicate The Seat
            n.PlayCardRequest.Seat = game.FindSeat(currentPlayer);
            n.PlayCardRequest.Timeout = 30000;  // Just Hard Code 30 seconds

            await BroadcastNotification(n, game);
        }

        public async Task PlayedCardsUpdate(Game.Game game) {
            PlayedCards playedCards = new PlayedCards();
            playedCards.Cards.Clear();

            Game.PlayedCard[] cards = game.PlayedCards.ToArray();
            foreach (Game.PlayedCard card in cards) {
                Proto.PlayedCard pc = new Proto.PlayedCard();
                Proto.Card c = new Proto.Card();
                c.Rank = GameRankToProtoRank[card.Card.Rank];
                c.Suit = GameSuitToProtoSuite[card.Card.Suit];
                pc.Card = c;
                pc.Order = card.Order;
                pc.Seat = card.Seat;
                
                playedCards.Cards.Add(pc);
            }

            //TODO: Handle Current Winner
            
            Notification n = new Notification();
            n.PlayedCards = playedCards;

            await BroadcastNotification(n, game);
            Log.Debug("{0}: Played Cards Notification complete", game.Name);
        }     

        public async Task SendCurrentState(Game.Game game) {
            // Update The Seat List
            await SeatListUpdate(game);

            // Update Scores
            await ScoreUpdate(game);

            // Update Tricks
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

        private Task<RpcClient> FindClient(Game.Game game, string token) {
            foreach (Client c in game.Clients) {
                if (c is not RpcClient)
                    continue;

                RpcClient client = (RpcClient)c;
                if (c.Token.Equals(token)) {
                    return Task.FromResult(client);
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
                    RpcClient client = await FindClient(game, clientToken);
                    await game.TakeSeat(request.Seat, client);
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
                RpcClient client = await FindClient(game, clientToken);
                await client.SetReady(request.Ready);
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

            return r;
        }

        public override async Task<StatusResponse> CreateBid(Proto.Bid request, ServerCallContext context) {
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

            bool result = false;
            try {
                RpcClient client = await FindClient(game, clientToken);
                Log.Debug("{4}: Received a bid of (tricks: {0}, suit: {1}, shoot: {2}) by {3}", request.Tricks, request.Trump, request.ShootNum, client.Name, game.Name);
                
                Game.Trump trump = null;
                foreach (KeyValuePair<Game.Trump, Proto.Trump> t in GameTrumpToProtoTrump) {
                    if (t.Value == request.Trump) {
                        trump = t.Key;
                        break;
                    }
                }
                
                bool pass = (request.ShootNum == 0) && (request.Tricks == 0);
                result = await game.MakeBid(request.Tricks, trump, request.ShootNum, pass, client);
            }
            catch (KeyNotFoundException) {
                r.Success = false;
                r.ErrorNum = (int)ErrorCode.CLIENT_NOT_FOUND;
                r.ErrorText = "Client Not Found";
                return r;
            }

            r.Success = result;
            if (result) {
                r.ErrorNum = (int)ErrorCode.SUCCESS;
                r.ErrorText = "";
            } else {
                r.ErrorNum = (int)ErrorCode.INVALID_BID;
                r.ErrorText = "Invalid Bid";
            }

            return r;
        }

        public override async Task<StatusResponse> TransferCard(Proto.Transfer request, ServerCallContext context)
        {
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

            bool result = false;
            try {
                RpcClient client = await FindClient(game, clientToken);
                Log.Debug("{3}: Received a card of (suit: {0}, rank: {1}) from {2}", request.Card.Suit, request.Card.Rank, client.Name, game.Name);

                //result = await game.MakeBid(request.Tricks, trump, request.ShootNum, pass, client);
            }
            catch (KeyNotFoundException) {
                r.Success = false;
                r.ErrorNum = (int)ErrorCode.CLIENT_NOT_FOUND;
                r.ErrorText = "Client Not Found";
                return r;
            }

            r.Success = result;
            if (result) {
                r.ErrorNum = (int)ErrorCode.SUCCESS;
                r.ErrorText = "";
            } else {
                r.ErrorNum = (int)ErrorCode.PLAYER_NOT_TRANSFERRING;
                r.ErrorText = "Invalid Bid";
            }

            return r;
        }

        /*
        public virtual global::System.Threading.Tasks.Task<global::ShootTheMoon.Network.Proto.ThrowawayResponse> ThrowawayCard(global::ShootTheMoon.Network.Proto.Card request, grpc::ServerCallContext context)
        {
            throw new grpc::RpcException(new grpc::Status(grpc::StatusCode.Unimplemented, ""));
        }
        */

        public override async Task<StatusResponse> PlayCard(Proto.Card request, ServerCallContext context)
        {
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

            Boolean result = false;
            try {
                RpcClient client = await FindClient(game, clientToken);
                Log.Debug("{3}: Received a card of (suit: {0}, rank: {1}) from {2}", request.Suit, request.Rank, client.Name, game.Name);
                
                result = await game.PlayCard(GameSuitFromProto(request.Suit), GameRankFromProto(request.Rank), client);
            }
            catch (KeyNotFoundException) {
                r.Success = false;
                r.ErrorNum = (int)ErrorCode.CLIENT_NOT_FOUND;
                r.ErrorText = "Client Not Found";
                return r;
            }

            r.Success = result;
            if (result) {
                r.ErrorNum = (int)ErrorCode.SUCCESS;
                r.ErrorText = "";
            } else {
                r.ErrorNum = (int)ErrorCode.INVALID_CARD_PLAYED;
                r.ErrorText = "Card Played Was Invalid";
            }

            return r;
        }

        /*
        public virtual global::System.Threading.Tasks.Task<global::ShootTheMoon.Network.Proto.StatusResponse> LeaveGame(global::ShootTheMoon.Network.Proto.LeaveGameRequest request, grpc::ServerCallContext context)
        {
            throw new grpc::RpcException(new grpc::Status(grpc::StatusCode.Unimplemented, ""));
        }
        */

        private Game.Suit GameSuitFromProto(Proto.Card.Types.Suit suit) {
            Game.Suit gameSuit = null;
            foreach (KeyValuePair<Game.Suit, Proto.Card.Types.Suit> t in GameSuitToProtoSuite) {
                if (t.Value == suit) {
                    gameSuit = t.Key;
                    break;
                }
            }
            return gameSuit;
        }


        private Game.Rank GameRankFromProto(Proto.Card.Types.Rank rank) {
            Game.Rank gameRank = null;
            foreach (KeyValuePair<Game.Rank, Proto.Card.Types.Rank> t in GameRankToProtoRank) {
                if (t.Value == rank) {
                    gameRank = t.Key;
                    break;
                }
            }
            return gameRank;
        }

    }
}

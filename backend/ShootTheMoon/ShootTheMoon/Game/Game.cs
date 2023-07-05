using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using Serilog;

namespace ShootTheMoon.Game
{
    public enum GameState {
        AWAITING_PLAYERS,
        DEALING,
        AWAITING_BIDS,
        AWAITING_TRANSFER,
        AWAITING_DISCARD,
        NEW_TRICK,
        PLAYING_HAND, 
        TRICK_COMPLETE,
        HAND_COMPLETE,
        GAME_COMPLETE
    }

    internal class Unsubscriber<T> : IDisposable {
        private List<IObserver<T>> _observers;
        private IObserver<T> _observer;

        internal Unsubscriber(List<IObserver<T>> observers, IObserver<T> observer)
        {
            this._observers = observers;
            this._observer = observer;
        }

        public void Dispose()
        {
            if (_observers.Contains(_observer))
                _observers.Remove(_observer);
        }

    }

    public class Game : IObservable<GameEvent>, IObserver<Client>
    {
        private DeckFactory DeckFactory { get; set; }

        private List<IObserver<GameEvent>> observers;

        public GameSettings GameSettings { get; set; }
        public string Uuid { get; set; }
        public string Name { get; set; }
        public int NumPlayers { get { return Players.Length; } }
        //public int InProgress { get; set; }
        public ImmutableList<Client> Clients { get; private set; }
        public Client[] Players { get; private set; }

        public bool AllPlayersReady { get { return Array.TrueForAll(Players, value => { return value != null && value.Ready; }); } }

        public List<int> Score { get; set; }
        public int Dealer { get; set; }
        public Client CurrentPlayer { get; set; }
        public List<uint> SkipSeats {get; set;}
        public int NextShootNum { get; set; }
        public List<Bid> Bids { get; set; }

        public List<Client> OutstandingTransfers { get; private set; }

        public Bid CurrentBid { get; set; }

        public Trump CurrentTrump { get; set; }
        public int RequiredTricks { get; set; }
        public int CallingTeam { get; set; }
        public int[] Tricks { get; set; }
        public List<PlayedCard> PlayedCards { get; set; }
        public PlayedCard HighCard { get; set; }
        public PlayedCard LeadCard { get; set; }

        public GameState State { get; private set; }

        public Game(GameSettings gameSettings, int aDealer = -1)
        {
            Uuid = Guid.NewGuid().ToString();
            DeckFactory = new RandomDeckFactory();
            Clients = ImmutableList<Client>.Empty;
            var numPlayers = gameSettings.NumPlayersPerTeam * 2;
            Players = new Client[numPlayers];
            Score = new List<int> { 0, 0 };
            Tricks = new int[] { 0, 0 };
            State = GameState.AWAITING_PLAYERS;
            GameSettings = gameSettings;
            Bids = new List<Bid>();
            OutstandingTransfers = new List<Client>();
            PlayedCards = new List<PlayedCard>();
            SkipSeats = new List<uint>();

            if (aDealer < 0 || aDealer >= Players.Length)
            {
                Random r = new Random();
                Dealer = r.Next(Players.Length);
            }
            else
            {

            }
            Log.Debug("{0} player game created with UUID {1}, Dealer is {2}", NumPlayers, Uuid, Dealer);

            observers = new List<IObserver<GameEvent>>();
        }

        public IDisposable Subscribe(IObserver<GameEvent> observer) 
        {
            // Check whether observer is already registered. If not, add it
            if (! observers.Contains(observer)) {
                observers.Add(observer);
                // Provide observer with existing data.
                //foreach (var item in flights)
                //    observer.OnNext(item);
            }
            return new Unsubscriber<GameEvent>(observers, observer);
        }

        public virtual void OnCompleted() {
            
        }

        public virtual void OnError(Exception exception) {

        }

        public async virtual void OnNext(Client client) {

            GameState startState = State;
            await Tick();
            if (startState == State) {
                // If the Tick causes a change in the state, then the update isn't needed.
                if (Players.Contains(client)) {
                    await PublishEvent(new GameEvent(GameEventType.ClientUpdate | GameEventType.SeatListUpdate, this));
                } else {
                    await PublishEvent(new GameEvent(GameEventType.ClientUpdate, this));
                }
            }

        }

        private async Task Tick() {

            // Implements The Game State Machine
            switch (State) {
                case GameState.AWAITING_PLAYERS:
                    if (AllPlayersReady) {
                        await EnterState(GameState.DEALING);
                    }
                    break;
                case GameState.AWAITING_BIDS:
                    await EnterState(GameState.AWAITING_BIDS);
                    break;
                case GameState.PLAYING_HAND:
                    await EnterState(GameState.PLAYING_HAND);
                    break;
            }

        }

        private async Task EnterState(GameState newState) {
        
            GameState previousState = State;
            State = newState;

            Log.Debug("{2}: {0} => {1}", previousState, newState, Name);

            if (State == GameState.DEALING) {
                await EnterDealing(previousState);
            } else if (State == GameState.AWAITING_BIDS) {
                await EnterAwaitingBids(previousState);
            } else if (State == GameState.AWAITING_TRANSFER) {
                await EnterAwaitingTransfer(previousState);
            } else if (State == GameState.AWAITING_DISCARD) {
                // Need To Do Something
                await EnterAwaitingDiscard(previousState);
            } else if (State == GameState.NEW_TRICK) {
                await EnterNewTrick(previousState);
            } else if (State == GameState.PLAYING_HAND) {
                // All That Updates Here Is The Cards Played and Who IS Playing
                GameEvent ge = new GameEvent( GameEventType.PlayCardRequest | GameEventType.PlayedCards, this, CurrentPlayer);
                await PublishEvent(ge);
            } else if (State == GameState.TRICK_COMPLETE) {
                await EnterTrickComplete();
            } else if (State == GameState.HAND_COMPLETE) {
                await EnterHandComplete();
            } else if (State == GameState.GAME_COMPLETE) {
                GameEvent ge = new GameEvent( GameEventType.TricksUpdate | GameEventType.ScoreUpdate, this);
                await PublishEvent(ge);
            }

        }

        protected async Task EnterDealing(GameState previousState) {
            GameEventType eventType = GameEventType.None;

            if (previousState == GameState.AWAITING_PLAYERS) {
                eventType |= (GameEventType.StartGame | GameEventType.ClientUpdate | GameEventType.SeatListUpdate);
            }

            ResetHand();
            await Deal();
            eventType |= GameEventType.DealCards | GameEventType.TricksUpdate | GameEventType.ScoreUpdate;

            await PublishEvent(new GameEvent(eventType, this));
            await EnterState(GameState.AWAITING_BIDS);
        }

        protected async Task EnterAwaitingBids(GameState previousState) {
            // If we're transitioning into awaiting bids, send an update
            if (previousState != GameState.AWAITING_BIDS) {
                CurrentBid = null;
                Bids.Clear();
                CurrentPlayer = Players[(Dealer + 1) % NumPlayers];
            }

            GameEvent ge = new GameEvent(GameEventType.BidUpdate | GameEventType.RequestBid, this, CurrentPlayer);
            await PublishEvent(ge);
        }

        protected async Task EnterAwaitingTransfer(GameState previousState) {
            GameEvent ge = new GameEvent( GameEventType.BidUpdate | GameEventType.TrumpUpdate, this);
            await PublishEvent(ge);

            if (previousState == GameState.AWAITING_BIDS) {
                // Request From The 
                //List<Client> transferFrom = new List<Client>();
                OutstandingTransfers.Clear();
                            
                int currentPlayerIndex = -1;
                for (int index = 0; index < NumPlayers; index++) {
                    int player = index % NumPlayers;
                    if (Players[player] == CurrentPlayer) {
                        currentPlayerIndex = player;
                        break;
                    }
                }

                if (currentPlayerIndex >= 0) {
                    for (int index = currentPlayerIndex + 2; index < currentPlayerIndex + NumPlayers; index += 2) {
                        //transferFrom.Add(Players[index % NumPlayers]);
                        OutstandingTransfers.Add(Players[index % NumPlayers]);
                    }
                }
            
                // Need To Pass Which Seat It's Coming From and Which Seat It's Going To
                GameEvent transferEvent = new GameEvent( GameEventType.TransferRequest, this, OutstandingTransfers);
                await PublishEvent(transferEvent);
            }
        }

        protected async Task EnterAwaitingDiscard(GameState previousState) {
            GameEvent ge = new GameEvent( GameEventType.ThrowawayRequest, this, CurrentPlayer);
            await PublishEvent(ge);
        }

        protected async Task EnterNewTrick(GameState previousState) {
            // Clear Out The Current 
            ResetTrick();

            if (previousState == GameState.AWAITING_BIDS) {
                GameEvent ge = new GameEvent( GameEventType.BidUpdate | GameEventType.TrumpUpdate, this, CurrentPlayer);
                await PublishEvent(ge);
            }

            await EnterState(GameState.PLAYING_HAND);
        }

        protected async Task EnterTrickComplete() {
            // Figure Out The Winner
            Log.Debug("Lead Card: {0}, High Card: {1}, TricksPerHand: {2}", LeadCard, HighCard, GameSettings.TricksPerHand);
            uint winningTeam = (HighCard.Seat % 2);
            Log.Debug("Trick Winner: {0}, Team: {1}", HighCard.Seat, winningTeam);

            // Send Played Card Update

            // Send Tricks Update
            Tricks[winningTeam]++;

            // Move To Playing Hand
            GameEvent ge = new GameEvent( GameEventType.PlayedCards | GameEventType.TricksUpdate, this, CurrentPlayer);
            await PublishEvent(ge);

            // This Could Also Need To Move To Hand Complete
            int tricksPlayed = Tricks[0] + Tricks[1];
            if (tricksPlayed >= GameSettings.TricksPerHand) {
                await EnterState(GameState.HAND_COMPLETE);
            } else {
                CurrentPlayer = Players[HighCard.Seat];
                await EnterState(GameState.NEW_TRICK);
            }
        }

        protected async Task EnterHandComplete() {
            // Leech Limit Is:
            //   - half the max number of tricks from winning subtracted from score
            // Winner is determined based on the winning bid (eg, if the winning bidder's team makes their )
            uint handWinner = 0;

            // Update The Score
            Score[0] += (Tricks[0] < GameSettings.LeechLimit || handWinner == 0) ? Tricks[0] : 0;
            Score[1] += (Tricks[1] < GameSettings.LeechLimit || handWinner == 1) ? Tricks[1] : 0;

            // Update The Current Dealer To The Next Player
            Dealer = (Dealer + 1) % Players.Length;

            // Check If Game Over
            if (Score[0] >= GameSettings.ScoreNeededToWin || Score[1] >= GameSettings.ScoreNeededToWin) {
                await EnterState(GameState.GAME_COMPLETE);
            } else {
                await EnterState(GameState.DEALING);
            }
        }

        private void ResetTrick() {
            PlayedCards.Clear();
            LeadCard = null;
            HighCard = null;
        }

        private void ResetHand() {
            ResetTrick();
            Tricks[0] = 0;
            Tricks[1] = 0;
            CurrentTrump = null;
            SkipSeats.Clear();
        }

        private async Task Deal() {
            // TODO: Get The Deck Somehow So It Can Be Injected
            //var deck = new Deck(GameSettings.NumDuplicateCards);
            var deck = DeckFactory.BuildDeck(GameSettings.NumDuplicateCards);
            await deck.Shuffle();

            int dealTo = (Dealer + 1) % NumPlayers;

            foreach(var player in Players)
                player.Hand.Clear();

            // Deal Until There Are No More Cards
            while (deck.Cards.Count > 0) {
                Client player = Players[dealTo];
                Card dealtCard = deck.Draw();
                player.Hand.Add(dealtCard);
                dealTo = (dealTo + 1) % NumPlayers;
            }

            ResetHand();
        }

        public async Task AddClient(Client client) {
            if (Clients.Contains(client))
                return; // Already Exists

            Clients = Clients.Add(client);
            await client.Subscribe(this);

            return;
        }

        public async Task RemoveClient(Client client) {

            //TODO: If game is in progress, do we replace the player with a bot?

            if (Clients.Contains(client)) {
                Clients = Clients.Remove(client);
                client.Unsubscribe(this);
                await PublishEvent(new GameEvent(GameEventType.ClientUpdate, this));
            }
        }
        public async Task<bool> TakeSeat(uint? seat, Client client) {
            bool changed = false;
            bool success = false;

            for (int index = 0; index < Players.Length; index++) {
                if (Players[index] != null && Players[index].Equals(client) && index != seat) {
                    Players[index] = null;  // Remove Player
                    changed = true;
                }
            }

            if (seat.HasValue && seat.Value < NumPlayers) {
                // Try To Take Seat
                if (Players[seat.Value] == null) {
                    Players[seat.Value] = client;
                    success = true;
                    changed = true;
                }
            } else {
                // Already Removed From Unoccupied Seat
                success = true;
            }

            if (changed) {
                GameEvent seatTaken = new GameEvent(GameEventType.SeatListUpdate, this);
                await PublishEvent(seatTaken);
            }

            return success;
        }

        public async Task<bool> MakeBid(uint tricks, Trump trump, uint shoot, bool pass, Client client) {
            if (client != CurrentPlayer) {
                return false;
            }

            uint seat = FindSeat(client);
            if (seat >= NumPlayers) {
                return false;
            }

            Bid b;
            if (pass) {
                b = Bid.makePassBid(seat);
            } else if (shoot == 0) {
                b = Bid.makeNormalBid(seat, tricks, trump);
            } else {
                b = Bid.makeShootBid(seat, shoot, trump);
            }

            if (CurrentBid != null && !b.isBetterThan(CurrentBid) && !b.isPass()) {
                return false;   // This Is A Bad Bid
            }

            Bids.Add(b);
            if (CurrentBid == null || !b.isPass()) {
                CurrentBid = b; // This Bid Replaces The Existing Bid
            }
            
            // Find Next Player
            int nextPlayer = int.MinValue;
            for (int index = Dealer+1; index < Dealer + NumPlayers; index++) {
                int player = index % NumPlayers;
                if (player == Dealer) {
                    break;  // We've reached the end of the list
                } else if (Players[player] == CurrentPlayer) {
                    // Add One And Exit
                    nextPlayer = (player + 1) % NumPlayers;
                }
            }

            Log.Debug("Game {0} has nextPlayer of {1}, dealer: {3} and minValue of {2}, {4}", Name, nextPlayer, int.MinValue, Dealer, nextPlayer == int.MinValue);

            //TODO: Work On Actually Handling The Bidding
            if (nextPlayer == int.MinValue) {
                // We're Done Bidding
                CurrentPlayer = Players[CurrentBid.Seat];
                CurrentTrump = CurrentBid.Trump;

                if (CurrentBid.isShoot()) {
                    // Handle A Shoot Bid
                    Log.Debug("Game {0} received a Shoot Bid with {1} shoots", Name, CurrentBid.ShootNumber);
                    uint skippedSeatCount = ((uint)NumPlayers / 2) - 1;
                    for (uint i = 0; i < skippedSeatCount; i++) {
                        uint skip_seat = (CurrentBid.Seat + (2 * (i + 1))) % (uint)NumPlayers;
                        SkipSeats.Add(skip_seat);
                    }
                    Log.Debug("Game {0} skip seats are {1}", Name, SkipSeats);
                    await EnterState(GameState.AWAITING_TRANSFER);
                } else {
                    // Handle A Normal Bid
                    Log.Debug("Game {0} received a normal bid with {1} {2}", Name, CurrentBid.Number, CurrentBid.ShootNumber);
                    await EnterState(GameState.NEW_TRICK);
                }
            } else {
                // Trigger Next Bid
                CurrentPlayer = Players[nextPlayer];
                await Tick();        
            }
            return true;
        }

        public async Task<bool> TransferCard(Suit suit, Rank rank, uint from, uint to, Client client) {
            if (State != GameState.AWAITING_TRANSFER) {
                Log.Debug("{0}: {1} sent transfer while not awaiting card", Name, client.Name);
                return false;
            }

            uint fromSeat = FindSeat(client);
            if (fromSeat != from) {
                Log.Debug("{0}: {1} attempting a transfer for a seat that they do not occupy", Name, client.Name);
                return false;
            }

            if (!OutstandingTransfers.Contains(client)) {
                Log.Debug("{0}: {1} attempted to transfer a card while no transfer expected", Name, client.Name);
                return false;
            }

            uint currentPlayerSeat = FindSeat(CurrentPlayer);
            if (currentPlayerSeat != to) {
                Log.Debug("{0}: {1} attempted to transfer a card to someone other than the bid winner", Name, client.Name);
                return false;
            }

            Log.Debug("{0}: Request Transfer of ({1} of {2}) from {3} => {4}", Name, rank, suit, client.Name, CurrentPlayer.Name);

            Card card = new Card(suit, rank);
            if (!client.Hand.Contains(card)) {
                Log.Debug("{0}: {1} attempted to transfer a card they did not have", Name, client.Name);
                return false;
            }



            // Remove The Player From The Players Awaiting Transfer
            OutstandingTransfers.Remove(client);

            // Remove Card From Transferring Player's Hand
            client.Hand.Remove(card);

            // Add Card To Current Player's Hand
            CurrentPlayer.Hand.Add(card);

            // Notify The Source & Recipient as well as everyone else
            PlayedCard playedCard = new PlayedCard(card, 0, from);
            GameEvent ge = new GameEvent( GameEventType.TransferCard, this, playedCard);
            await PublishEvent(ge);

            // If Empty, Wait On Discard From CurrentPlayer
            if (OutstandingTransfers.Count == 0) {
                // Transition State
                await EnterState(GameState.AWAITING_DISCARD);
            }

            return true;
        }


        public async Task<bool> ThrowawayCard(Suit suit, Rank rank, Client client) {
            if (State != GameState.AWAITING_DISCARD) {
                Log.Debug("{0}: {1} send throwaway card wile not awaiting card", Name, client.Name);
                return false;
            }

            uint fromSeat = FindSeat(client);
            uint currentPlayerSeat = FindSeat(CurrentPlayer);
            if (fromSeat != currentPlayerSeat) {
                Log.Debug("{0}: {1} attempted to throw away card while not their turn", Name, client.Name);
                return false;
            }

            if (client.Hand.Count <= GameSettings.TricksPerHand) {
                Log.Debug("{0}: {1} attempted to throw away a card when they are already at the proper number", Name, client.Name);
                await EnterState(GameState.PLAYING_HAND);
                return false;
            }

            Log.Debug("{0}: Throw Away Request of ({1} of {2}) by {3}", Name, rank, suit, CurrentPlayer.Name);

            Card card = new Card(suit, rank);
            if (!client.Hand.Contains(card)) {
                Log.Debug("{0}: {1} attempted to throw away a card they did not have", Name, client.Name);
                return false;
            }

            client.Hand.Remove(card);

            if (client.Hand.Count > GameSettings.TricksPerHand) {
                GameEvent ge = new GameEvent(GameEventType.ThrowawayRequest, this, client);
                await PublishEvent(ge);
            } else {
                await EnterState(GameState.PLAYING_HAND);
            }

            return true;
        }

        public async Task<bool> PlayCard(Suit suit, Rank rank, Client client) {
            if (State != GameState.PLAYING_HAND) {
                Log.Debug("{0}: {1} sent card when not playing hand", Name, client.Name);
                return false;
            }

            if (client != CurrentPlayer) {
                // Only Accept A Play From The Current Player
                Log.Debug("{0}: {1} sent card out of turn", Name, client.Name);
                return false;
            }

            uint seat = FindSeat(client);
            if (seat >= NumPlayers) {
                Log.Debug("{0}: {1} is in seat {2} which is invalid for {3} players", Name, client.Name, seat, NumPlayers);
                return false;
            }

            Card card = new Card(suit, rank);

            PlayedCard playedCard = new PlayedCard(card, Convert.ToUInt16(PlayedCards.Count), seat);

            // Validate Card Is Valid For The Player
            Suit leadSuit = (LeadCard != null) ? LeadCard.Card.Suit : null;
            if (!playedCard.isValidWithHand(CurrentPlayer.Hand, leadSuit, CurrentTrump)) {
                Log.Debug("{0}: {1} played a card that is invalid", Name, client.Name);
                return false;
            }
            
            // Remove From Player's Hand Or Mark As Played
            CurrentPlayer.Hand.Remove(card);

            PlayedCards.Add(playedCard);
            if (LeadCard == null) {
                LeadCard = playedCard;
            }

            bool winner = playedCard.winsAgainst(HighCard, LeadCard.Card.Suit, CurrentTrump);
            Log.Debug("{5}: {0} {1} {2} (lead: {3}, current trump: {4})", card, (winner ? "beats" : "is beaten by"), (HighCard == null) ? "null" : HighCard.Card, LeadCard.Card.Suit.LongName, CurrentTrump.Name, Name);

            if (HighCard == null || winner) {
                // Check If This Card Is Higher Than The High Card
                // ie, is this a higher face value or is it higher trump
                HighCard = playedCard;
            }

            int handPlayers = NumPlayers;
            if (CurrentBid.isShoot()) {
                handPlayers = (NumPlayers / 2) + 1;
            }

            if (PlayedCards.Count < handPlayers) {
                // Find Next Player
                int nextPlayer = int.MinValue;
                for (int index = Dealer+1; index <= Dealer + NumPlayers; index++) {
                    int player = index % NumPlayers;
                    if (Players[player] == CurrentPlayer) {
                        // Add One And Exit
                        nextPlayer = (player + 1) % NumPlayers;
                        if (SkipSeats.Contains((uint)nextPlayer)) {
                            nextPlayer = (nextPlayer + 1) % NumPlayers; // Skip Again
                        }
                        break;
                    }
                }
                CurrentPlayer = Players[nextPlayer];
                await Tick();
            } else {
                // Trick Played Out
                await EnterState(GameState.TRICK_COMPLETE);
            }

            return true;
        }


        private async Task PublishEvent(GameEvent gameEvent) {
            foreach (var observer in observers)
                await Task.Run(() => observer.OnNext(gameEvent));
        }

        public uint FindSeat(Client client ) {
            for (uint idx = 0; idx < NumPlayers; idx++) {
                if (Players[idx] == client) {
                    return idx;
                }
            }
            return uint.MaxValue;
        }
    }
}

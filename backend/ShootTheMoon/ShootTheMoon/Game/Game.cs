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
        PLAYING_HAND
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
        public int NextShootNum { get; set; }
        public List<Bid> Bids { get; set; }

        public Bid CurrentBid { get; set; }

        public Trump CurrentTrump { get; set; }
        public int RequiredTricks { get; set; }
        public int CallingTeam { get; set; }
        public int[] Tricks { get; set; }
        public List<Card> PlayedCards { get; set; }
        public Card HighCard { get; set; }
        public Card LeadCard { get; set; }

        public GameState State { get; private set; }

        public Game(GameSettings gameSettings)
        {
            Uuid = Guid.NewGuid().ToString();
            Clients = ImmutableList<Client>.Empty;
            var numPlayers = gameSettings.NumPlayersPerTeam * 2;
            Players = new Client[numPlayers];
            Score = new List<int> { 0, 0 };
            Tricks = new int[] { 0, 0 };
            State = GameState.AWAITING_PLAYERS;
            GameSettings = gameSettings;
            Bids = new List<Bid>();
            PlayedCards = new List<Card>();

            Random r = new Random();
            Dealer = r.Next(Players.Length);

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

        public virtual void OnNext(Client client) {

            GameState startState = State;
            Task.Run(Tick);
            if (startState == State) {
                // If the Tick causes a change in the state, then the update isn't needed.
                if (Players.Contains(client)) {
                    Task.Run(() => PublishEvent(new GameEvent(GameEventType.ClientUpdate | GameEventType.SeatListUpdate, this)));
                } else {
                    Task.Run(() => PublishEvent(new GameEvent(GameEventType.ClientUpdate, this)));
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
            }

        }

        private async Task EnterState(GameState newState) {
        
            GameState previousState = State;
            State = newState;

            Log.Debug("{0} => {1}", previousState, newState);

            if (State == GameState.DEALING) {
                GameEventType eventType = GameEventType.None;

                if (previousState == GameState.AWAITING_PLAYERS) {
                    eventType |= (GameEventType.StartGame | GameEventType.ClientUpdate | GameEventType.SeatListUpdate);
                }

                await Deal();
                eventType |= GameEventType.DealCards;

                await PublishEvent(new GameEvent(eventType, this));
                await EnterState(GameState.AWAITING_BIDS);
            } else if (State == GameState.AWAITING_BIDS) {

                // If we're transitioning into awaiting bids, send an update
                if (previousState != GameState.AWAITING_BIDS) {
                    CurrentBid = null;
                    Bids.Clear();
                    CurrentPlayer = Players[(Dealer + 1) % NumPlayers];
                }

                GameEvent ge = new GameEvent(GameEventType.BidUpdate | GameEventType.RequestBid, this, CurrentPlayer);
                await PublishEvent(ge);
            } else if (State == GameState.PLAYING_HAND) {
                GameEvent ge = new GameEvent(GameEventType.BidUpdate | GameEventType.TrumpUpdate | GameEventType.PlayCardRequest, this, CurrentPlayer);
                await PublishEvent(ge);
            }

        }

        private void ResetHand() {
            PlayedCards.Clear();
        }

        private async Task Deal() {
            // TODO: Get The Deck Somehow So It Can Be Injected
            var deck = new Deck(GameSettings.NumDuplicateCards);
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

        public Task AddClient(Client client) {
            if (Clients.Contains(client))
                return Task.CompletedTask; // Already Exists

            Clients = Clients.Add(client);
            client.Subscribe(this);

            return Task.CompletedTask;
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

            if (CurrentBid != null && (!b.isBetterThan(CurrentBid) || b.isPass())) {
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
                if (CurrentBid.isShoot()) {
                    // Handle A Shoot Bid
                    Log.Debug("Game {0} received a Shoot Bid with {1} shoots", Name, CurrentBid.ShootNumber);
                } else {
                    // Handle A Normal Bid
                    Log.Debug("Game {0} received a normal bid with {1} {2}", Name, CurrentBid.Number, CurrentBid.ShootNumber);
                }
                Log.Debug("Before Set Current Player");
                CurrentPlayer = Players[CurrentBid.Seat];
                await EnterState(GameState.PLAYING_HAND);
            } else {
                // Trigger Next Bid
                CurrentPlayer = Players[nextPlayer];
                await Tick();        
            }
            return true;
        }

        public bool PlayCard(Suit suit, Rank rank, Client client) {
            if (client != CurrentPlayer) {
                // Only Accept A Play From The Current Player
                return false;
            }

            uint seat = FindSeat(client);
            if (seat >= NumPlayers) {
                return false;
            }

            Card playedCard = new Card();
            playedCard.Suit = suit;
            playedCard.Rank = rank;

            // TODO: Validate Card Is Valid For The Player

            PlayedCards.Add(playedCard);

            if (PlayedCards.Count < NumPlayers) {
                // Find Next Player
                int nextPlayer = int.MinValue;
                for (int index = Dealer+1; index < Dealer + NumPlayers; index++) {
                    int player = index % NumPlayers;
                    if (Players[player] == CurrentPlayer) {
                        // Add One And Exit
                        nextPlayer = (player + 1) % NumPlayers;
                        break;
                    }
                }
                CurrentPlayer = Players[nextPlayer];
                Tick();
            } else {
                // Trick Played Out
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

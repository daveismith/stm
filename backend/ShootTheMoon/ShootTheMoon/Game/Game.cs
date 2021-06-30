using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public enum GameState {
        AWAITING_PLAYERS,
        DEALING,
        AWAITING_BIDS
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

            Random r = new Random();
            Dealer = r.Next(Players.Length);

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
            Tick();
            if (startState == State) {
                // If the Tick causes a change in the state, then the update isn't needed.
                if (Players.Contains(client)) {
                    PublishEvent(new GameEvent(GameEventType.ClientUpdate | GameEventType.SeatListUpdate, this));
                } else {
                    PublishEvent(new GameEvent(GameEventType.ClientUpdate, this));
                }
            }

        }

        private void Tick() {

            // Implements The Game State Machine
            switch (State) {
                case GameState.AWAITING_PLAYERS:
                    if (AllPlayersReady) {
                        EnterState(GameState.DEALING);
                    }
                    break;
            }

        }

        private void EnterState(GameState newState) {
        
            GameState previousState = State;
            State = newState;

            if (State == GameState.DEALING) {
                GameEventType eventType = GameEventType.None;

                if (previousState == GameState.AWAITING_PLAYERS) {
                    eventType |= (GameEventType.StartGame | GameEventType.ClientUpdate | GameEventType.SeatListUpdate);
                }

                Deal();
                eventType |= GameEventType.DealCards;

                PublishEvent(new GameEvent(eventType, this));
                EnterState(GameState.AWAITING_BIDS);
            }

        }

        private void Deal() {
            // TODO: Get The Deck Somehow So It Can Be Injected
            var deck = new Deck(GameSettings.NumDuplicateCards);
            deck.Shuffle();

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
        }

        public void AddClient(Client client) {
            if (Clients.Contains(client))
                return; // Already Exists

            Clients = Clients.Add(client);
            client.Subscribe(this);
        }

        public void RemoveClient(Client client) {
            if (Clients.Contains(client)) {
                Clients = Clients.Remove(client);
                client.Unsubscribe(this);
                PublishEvent(new GameEvent(GameEventType.ClientUpdate, this));
            }
        }
        public bool TakeSeat(uint? seat, Client client) {
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
                PublishEvent(seatTaken);
            }

            return success;
        }

        private void PublishEvent(GameEvent gameEvent) {
            foreach (var observer in observers)
                observer.OnNext(gameEvent);
        }

    }
}

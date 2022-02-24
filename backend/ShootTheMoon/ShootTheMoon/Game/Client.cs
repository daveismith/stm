using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{

    public class Client
    {
        private List<IObserver<Client>> observers;

        public string Token { get; }

        protected string _name;

        public string Name { get { return _name; } }

        private bool _ready;
        public bool Ready { get { return _ready; } }

        private bool _human;
        public bool Human { get { return _human; } }

        public List<Card> Hand { get; set; }

        public Client() {
            Token = Guid.NewGuid().ToString();
            _name = Token;
            _human = false;
            _ready = false;
            observers = new List<IObserver<Client>>();
            Hand = new List<Card>();
        }

        public async Task SetName(string name) { _name = name; await PublishChange(); }

        public async Task SetReady(bool ready) { _ready = ready; await PublishChange(); }

        public async Task SetHuman(bool human) { _human = human; await PublishChange(); }

        public async Task<IDisposable> Subscribe(IObserver<Client> observer) 
        {
            // Check whether observer is already registered. If not, add it
            if (! observers.Contains(observer)) {
                observers.Add(observer);
                await Task.Run(() => observer.OnNext(this));
            }
            return new Unsubscriber<Client>(observers, observer);
        }

        internal void Unsubscribe(IObserver<Client> observer) {
            if (observers.Contains(observer))
                observers.Remove(observer);
        }

        protected async Task PublishChange() {
            if (observers != null) {
                foreach (var observer in observers)
                    await Task.Run(() => observer.OnNext(this));
            }
        }

    }
}

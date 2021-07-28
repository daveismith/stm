using System;
using System.Collections.Generic;

namespace ShootTheMoon.Game
{

    public class Client
    {
        private List<IObserver<Client>> observers;

        public string Token { get; }

        private string _name;

        public string Name { get { return _name; } set { _name = value; PublishChange(); } }

        private bool _ready;
        public bool Ready { get { return _ready; } set { _ready = value; PublishChange(); } }

        private bool _human;
        public bool Human { get { return _human; } set { _human = value; PublishChange(); } }

        public List<Card> Hand { get; set; }

        public Client() {
            Token = Guid.NewGuid().ToString();
            Name = Token;
            Human = false;
            Ready = false;
            observers = new List<IObserver<Client>>();
            Hand = new List<Card>();
        }

        public IDisposable Subscribe(IObserver<Client> observer) 
        {
            // Check whether observer is already registered. If not, add it
            if (! observers.Contains(observer)) {
                observers.Add(observer);
                observer.OnNext(this);
            }
            return new Unsubscriber<Client>(observers, observer);
        }

        internal void Unsubscribe(IObserver<Client> observer) {
            if (observers.Contains(observer))
                observers.Remove(observer);
        }

        protected void PublishChange() {
            if (observers != null) {
                foreach (var observer in observers)
                    observer.OnNext(this);
            }
        }

    }
}

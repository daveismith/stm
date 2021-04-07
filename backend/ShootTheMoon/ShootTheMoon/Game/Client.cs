using System;

namespace ShootTheMoon.Game
{

    public class Client
    {
        public string Token { get; }

        public string Name { get; set; }

        public bool Human { get; set; }

        public Client() {
            Token = Guid.NewGuid().ToString();
            Name = Token;
            Human = false;
        }

    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class PlayedCard
    {
        public Card Card { get; set; }

        public uint Order { get; set; }

        public uint Seat { get; set; }

    }
}

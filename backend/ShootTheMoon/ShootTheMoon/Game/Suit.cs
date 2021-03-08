using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class Suit
    {
        public static readonly List<Suit> Suits = new List<Suit>
        {
            new Suit {ShortName = "S", LongName = "Spades" },
            new Suit {ShortName = "H", LongName = "Hearts" },
            new Suit {ShortName = "C", LongName = "Clubs" },
            new Suit {ShortName = "D", LongName = "Diamonds" }
        };

        public string ShortName { get; set; }
        public string LongName { get; set; }
    }
}

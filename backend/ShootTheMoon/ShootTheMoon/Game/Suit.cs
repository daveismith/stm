using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class Suit
    {
        public static Suit Spades = new Suit {ShortName = "S", LongName = "Spades" };
        public static Suit Hearts = new Suit {ShortName = "H", LongName = "Hearts" };
        public static Suit Clubs = new Suit {ShortName = "C", LongName = "Clubs" };
        public static Suit Diamonds = new Suit {ShortName = "D", LongName = "Diamonds" };

        public static readonly List<Suit> Suits = new List<Suit>
        {
            Spades,
            Hearts,
            Clubs,
            Diamonds
        };

        public string ShortName { get; set; }
        public string LongName { get; set; }
    }
}

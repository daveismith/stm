using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class Suit
    {
        public static Suit Spades = new Suit {Index = 0, ShortName = "S", LongName = "Spades" };
        public static Suit Hearts = new Suit {Index = 1, ShortName = "H", LongName = "Hearts" };
        public static Suit Clubs = new Suit {Index = 3, ShortName = "C", LongName = "Clubs" };
        public static Suit Diamonds = new Suit {Index = 2, ShortName = "D", LongName = "Diamonds" };

        public static readonly Dictionary<int, Suit> Suits = new Dictionary<int, Suit>
        {
            {0, Spades},
            {1, Hearts},
            {2, Diamonds},
            {3, Clubs}
        };
        public int Index { get; set; }

        public string ShortName { get; set; }
        public string LongName { get; set; }

        public override bool Equals(Object o)
        {
            if (this == o)
            {
                return true;
            }
            if (!(o.GetType() == typeof(Suit)))
            {
                return false;
            }
            Suit s = (Suit)o;
            return ShortName == s.ShortName;
        }

        public override int GetHashCode()
        {
            return ShortName.GetHashCode();
        }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Bot
{
    public class Trump
    {
        
        public static Trump Spades = new Trump {Index = 0, Name = Suit.Spades.LongName, Suit = Suit.Spades, SameColour = Suit.Clubs };
        public static Trump Hearts = new Trump {Index = 1, Name = Suit.Hearts.LongName, Suit = Suit.Hearts, SameColour = Suit.Diamonds };
        public static Trump Clubs = new Trump {Index = 3, Name = Suit.Clubs.LongName, Suit = Suit.Clubs, SameColour = Suit.Spades };
        public static Trump Diamonds = new Trump {Index = 2, Name = Suit.Diamonds.LongName, Suit = Suit.Diamonds, SameColour = Suit.Hearts };
        public static Trump High = new Trump {Index = 5, Name = "High"};
        public static Trump Low = new Trump {Index = 4, Name = "Low"};

        public static readonly Dictionary<int, Trump> Trumps = new Dictionary<int, Trump>{
            {0, Spades},
            {1, Hearts},
            {2, Diamonds},
            {3, Clubs},
            {4, Low},
            {5, High}
        };

        public int Index { get; private set; }

        public string Name { get; private set; }
        public Suit Suit { get; private set; }

        public Suit SameColour { get; private set; }

        public bool isSuit() {
            return Suit != null;
        }

        public static Trump fromProto(ShootTheMoon.Network.Proto.Trump trump)
        {
            return Trumps[(int) trump];
        }

        public static ShootTheMoon.Network.Proto.Trump toProto(Trump trump)
        {
            return (ShootTheMoon.Network.Proto.Trump) trump.Index; 
        }
    }
}

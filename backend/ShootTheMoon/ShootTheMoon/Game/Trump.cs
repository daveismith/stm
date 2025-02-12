using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class Trump
    {
        
        public static Trump Spades = new Trump {Name = Suit.Spades.LongName, Suit = Suit.Spades, SameColour = Suit.Clubs };
        public static Trump Hearts = new Trump {Name = Suit.Hearts.LongName, Suit = Suit.Hearts, SameColour = Suit.Diamonds };
        public static Trump Clubs = new Trump {Name = Suit.Clubs.LongName, Suit = Suit.Clubs, SameColour = Suit.Spades };
        public static Trump Diamonds = new Trump {Name = Suit.Diamonds.LongName, Suit = Suit.Diamonds, SameColour = Suit.Hearts };
        public static Trump High = new Trump {Name = "High"};
        public static Trump Low = new Trump {Name = "Low"};

        public static readonly Dictionary<int, Trump> Trumps = new Dictionary<int, Trump>{
            {0, Spades},
            {1, Hearts},
            {2, Diamonds},
            {3, Clubs},
            {4, Low},
            {5, High}
        };

        public string Name { get; private set; }
        public Suit Suit { get; private set; }

        public Suit SameColour { get; private set; }

        public bool isSuit() {
            return Suit != null;
        }

        public static Trump fromProto(Network.Proto.Trump trump)
        {
            return Trumps[(int) trump];
        }

    }
}

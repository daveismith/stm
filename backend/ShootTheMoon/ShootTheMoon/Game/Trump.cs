using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class Trump
    {
        
        public static Trump Spades = new Trump {Name = Suit.Spades.LongName, Suit = Suit.Spades };
        public static Trump Hearts = new Trump {Name = Suit.Hearts.LongName, Suit = Suit.Hearts };
        public static Trump Clubs = new Trump {Name = Suit.Clubs.LongName, Suit = Suit.Clubs };
        public static Trump Diamonds = new Trump {Name = Suit.Diamonds.LongName, Suit = Suit.Diamonds };
        public static Trump High = new Trump {Name = "High"};
        public static Trump Low = new Trump {Name = "Low"};

        public static readonly List<Trump> Trumps = new List<Trump>{
            Spades,
            Hearts,
            Clubs,
            Diamonds,
            High,
            Low
        };

        public string Name { get; set; }
        public Suit Suit { get; set; }

    }
}

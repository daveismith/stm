using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class Trump
    {
        public static readonly List<Trump> Trumps = new List<Trump>
        {
            new Trump {Name = Deck.Suits[0].LongName, Suit = Deck.Suits[0]},
            new Trump {Name = Deck.Suits[1].LongName, Suit = Deck.Suits[1]},
            new Trump {Name = Deck.Suits[2].LongName, Suit = Deck.Suits[2]},
            new Trump {Name = Deck.Suits[3].LongName, Suit = Deck.Suits[3]},
            new Trump {Name = "High"},
            new Trump {Name = "Low"}
        };
        public string Name { get; set; }
        public Suit Suit { get; set; }

    }
}

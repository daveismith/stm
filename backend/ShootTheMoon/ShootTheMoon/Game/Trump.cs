using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class Trump
    {
        public static readonly Dictionary<string, Trump> Trumps = new Dictionary<string, Trump>
        {
            { Suit.Suits[0].LongName, new Trump {Name = Suit.Suits[0].LongName, Suit = Suit.Suits[0]} },
            { Suit.Suits[1].LongName, new Trump {Name = Suit.Suits[1].LongName, Suit = Suit.Suits[1]} },
            { Suit.Suits[2].LongName, new Trump {Name = Suit.Suits[2].LongName, Suit = Suit.Suits[2]} },
            { Suit.Suits[3].LongName, new Trump {Name = Suit.Suits[3].LongName, Suit = Suit.Suits[3]} },
            { "High",  new Trump {Name = "High"} },
            { "Low",  new Trump {Name = "Low"} }
        };

        public string Name { get; set; }
        public Suit Suit { get; set; }

    }
}

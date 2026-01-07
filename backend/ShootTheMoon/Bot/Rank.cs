using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Bot
{
    public class Rank
    {
        public static Rank Nine = new Rank { Value = 9, ShortName = "9", LongName = "Nine" };
        public static Rank Ten = new Rank { Value = 10, ShortName = "10", LongName = "Ten" };
        public static Rank Jack = new Rank { Value = 11, ShortName = "J", LongName = "Jack" };
        public static Rank Queen = new Rank { Value = 12, ShortName = "Q", LongName = "Queen" };
        public static Rank King = new Rank { Value = 13, ShortName = "K", LongName = "King" };
        public static Rank Ace = new Rank { Value = 14, ShortName = "A", LongName = "Ace" };

        public static readonly Dictionary<int, Rank> Ranks = new Dictionary<int, Rank>
        {
            {9, Nine},
            {10, Ten},
            {11, Jack},
            {12, Queen},
            {13, King},
            {14, Ace}
        };

        public int Value { get; set; }
        public string ShortName { get; set; } = string.Empty;
        public string LongName { get; set; } = string.Empty;
    }
}

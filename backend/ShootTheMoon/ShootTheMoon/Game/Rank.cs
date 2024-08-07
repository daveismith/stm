﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class Rank
    {
        public static Rank Nine = new Rank { Value = 9, ShortName = "9", LongName = "Nine" };
        public static Rank Ten = new Rank { Value = 10, ShortName = "10", LongName = "Ten" };
        public static Rank Jack = new Rank { Value = 11, ShortName = "J", LongName = "Jack" };
        public static Rank Queen = new Rank { Value = 12, ShortName = "Q", LongName = "Queen" };
        public static Rank King = new Rank { Value = 13, ShortName = "K", LongName = "King" };
        public static Rank Ace = new Rank { Value = 14, ShortName = "A", LongName = "Ace" };

        public static readonly List<Rank> Ranks = new List<Rank>
        {
            Nine,
            Ten,
            Jack,
            Queen,
            King,
            Ace
        };

        public int Value { get; set; }
        public string ShortName { get; set; }
        public string LongName { get; set; }
    }
}

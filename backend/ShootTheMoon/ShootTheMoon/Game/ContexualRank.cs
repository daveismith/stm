using System.Collections.Generic;

namespace ShootTheMoon.Game
{
    public class ContextualRank
    {
        // public static readonly List<ContextualRank> ContextualRanks = new List<ContextualRank>
        // {
        //     new ContextualRank {Ranking = 9, Name = "Nine" },
        //     new ContextualRank {Ranking = 10, Name = "Ten" },
        //     new ContextualRank {Ranking = 11, Name = "Jack" },
        //     new ContextualRank {Ranking = 12, Name = "Queen" },
        //     new ContextualRank {Ranking = 13, Name = "King" },
        //     new ContextualRank {Ranking = 14, Name = "Ace" },
        //     new ContextualRank {Ranking = 15, Name = "Left" },
        //     new ContextualRank {Ranking = 16, Name = "Right" }
        // };

        public static readonly ContextualRank NINE = new ContextualRank {Ranking = 9, Name = "Nine" };

        public static readonly ContextualRank TEN = new ContextualRank {Ranking = 10, Name = "Ten" };

        public static readonly ContextualRank JACK = new ContextualRank {Ranking = 11, Name = "Jack" };

        public static readonly ContextualRank QUEEN = new ContextualRank {Ranking = 12, Name = "Queen" };

        public static readonly ContextualRank KING = new ContextualRank {Ranking = 13, Name = "King" };

        public static readonly ContextualRank ACE = new ContextualRank {Ranking = 14, Name = "Ace" };

        public static readonly ContextualRank LEFT = new ContextualRank {Ranking = 15, Name = "Left" };

        public static readonly ContextualRank RIGHT = new ContextualRank {Ranking = 16, Name = "Right" };

        public int Ranking { get; set; }
        public string Name { get; set; }
    }
}

using System.Collections.Generic;

namespace Bot
{
    public class ContextualRank
    {
        public static readonly ContextualRank NINE = new ContextualRank {Ranking = 9, Name = "Nine" };

        public static readonly ContextualRank TEN = new ContextualRank {Ranking = 10, Name = "Ten" };

        public static readonly ContextualRank JACK = new ContextualRank {Ranking = 11, Name = "Jack" };

        public static readonly ContextualRank QUEEN = new ContextualRank {Ranking = 12, Name = "Queen" };

        public static readonly ContextualRank KING = new ContextualRank {Ranking = 13, Name = "King" };

        public static readonly ContextualRank ACE = new ContextualRank {Ranking = 14, Name = "Ace" };

        public static readonly ContextualRank LEFT = new ContextualRank {Ranking = 15, Name = "Left" };

        public static readonly ContextualRank RIGHT = new ContextualRank {Ranking = 16, Name = "Right" };

        public static readonly Dictionary<int, ContextualRank> ContextualRanks = new Dictionary<int, ContextualRank>
        {
            {9, NINE},
            {10, TEN},
            {11, JACK},
            {12, QUEEN},
            {13, KING},
            {14, ACE},
            {15, LEFT},
            {16, RIGHT}
        };

        public int Ranking { get; set; }
        public string Name { get; set; }
    }
}

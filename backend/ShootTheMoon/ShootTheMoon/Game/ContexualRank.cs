using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class ContexualRank
    {
        public static readonly List<ContexualRank> ContextualRanks = new List<ContexualRank>
        {
            new ContexualRank {Ranking = 9, Name = "Nine" },
            new ContexualRank {Ranking = 10, Name = "Ten" },
            new ContexualRank {Ranking = 11, Name = "Jack" },
            new ContexualRank {Ranking = 12, Name = "Queen" },
            new ContexualRank {Ranking = 13, Name = "King" },
            new ContexualRank {Ranking = 14, Name = "Ace" },
            new ContexualRank {Ranking = 15, Name = "Left" },
            new ContexualRank {Ranking = 16, Name = "Right" }
        };

        public int Ranking { get; set; }
        public string Name { get; set; }
    }
}

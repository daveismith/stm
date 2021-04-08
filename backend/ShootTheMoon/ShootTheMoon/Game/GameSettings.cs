using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class GameSettings
    {
        public static readonly Dictionary<string, GameSettings> GamePresets = new Dictionary<string, GameSettings>
        {
            { "FOURPLAYER", new GameSettings {NumPlayersPerTeam = 2, NumDuplicateCards = 1, ScoreNeededToWin = 51} },
            { "SIXPLAYER", new GameSettings {NumPlayersPerTeam = 3, NumDuplicateCards = 2, ScoreNeededToWin = 51} },
            { "EIGHTPLAYER", new GameSettings {NumPlayersPerTeam = 4, NumDuplicateCards = 3, ScoreNeededToWin = 51} }
        };

        public int NumPlayersPerTeam { get; set; }
        public int NumDuplicateCards { get; set; }
        public int ScoreNeededToWin { get; set; }

        public int getDeckSize()
        {
            return Suit.Suits.Count * Rank.Ranks.Count * NumDuplicateCards;
        }
    }
}

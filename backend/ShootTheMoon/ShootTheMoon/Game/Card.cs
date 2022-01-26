using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class Card
    {
        public Suit Suit { get; set; }
        public Rank Rank { get; set; }

        public Suit EffectiveSuit(Trump trump) {
            if (Suit == trump.SameColour && Rank == Rank.Jack) {
                return trump.Suit;
            }
            return Suit;
        }

        public Card(Suit suit, Rank rank) {
            Suit = suit;
            Rank = rank;
        }
    }
}

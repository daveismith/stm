using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class Card : IEquatable<Card>
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

        public override bool Equals(object obj) => this.Equals(obj as Card);

        public bool Equals(Card p)
        {
            if (p is null)
            {
                return false;
            }

            // Optimization for a common success case.
            if (Object.ReferenceEquals(this, p))
            {
                return true;
            }

            // If run-time types are not exactly the same, return false.
            if (this.GetType() != p.GetType())
            {
                return false;
            }

            // Return true if the fields match.
            // Note that the base class is not invoked because it is
            // System.Object, which defines Equals as reference equality.
            return (Suit == p.Suit) && (Rank == p.Rank);
        }

        public override int GetHashCode() => (Suit, Rank).GetHashCode();        
        public static bool operator ==(Card lhs, Card rhs)
        {
            if (lhs is null)
            {
                if (rhs is null)
                {
                    return true;
                }

                // Only the left side is null.
                return false;
            }
            // Equals handles case of null on right side.
            return lhs.Equals(rhs);
        }

        public static bool operator !=(Card lhs, Card rhs) => !(lhs == rhs);        
    }
}

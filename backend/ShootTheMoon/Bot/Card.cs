using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;

namespace Bot
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

        public ContextualRank EffectiveRank(Trump trump) {
            // if trump is a suit and the card is a Jack, we need to check if it's a
            // left or a right
            if (Rank.Equals(Rank.Jack) && trump.isSuit())
            {
                Suit trumpSuit = trump.Suit;

                if (Suit.Equals(trumpSuit))
                {
                    return ContextualRank.RIGHT;
                }
                else if (Suit.Equals(trump.SameColour))
                {
                    return ContextualRank.LEFT;
                }
                else
                {
                    return ContextualRank.JACK;
                }
                // for all other cards we can just return the same rank as the
                // original card
            }
            else
            {
                return ContextualRank.ContextualRanks[Rank.Value];
            }

        }

        public Card(Suit suit, Rank rank) {
            Suit = suit;
            Rank = rank;
        }

        public static Card FromProto(ShootTheMoon.Network.Proto.Card card) {
            return new Card(Suit.Suits[(int) card.Suit], Rank.Ranks[(int) card.Rank]);
        }

        public static ShootTheMoon.Network.Proto.Card ToProto(Card card)
        {
            ShootTheMoon.Network.Proto.Card protoCard = new ShootTheMoon.Network.Proto.Card();
            protoCard.Rank = (ShootTheMoon.Network.Proto.Card.Types.Rank) card.Rank.Index;
            protoCard.Suit = (ShootTheMoon.Network.Proto.Card.Types.Suit) card.Suit.Index;
            return protoCard;
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

        public override string ToString()
        {
            return Rank.LongName + " of " + Suit.LongName;
        }        
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class PlayedCard
    {
        public Card Card { get; set; }

        public uint Order { get; set; }

        public uint Seat { get; set; }

        public PlayedCard(Card card, uint order, uint seat) {
            Card = card;
            Order = order;
            Seat = seat;
        }

        public PlayedCard(Suit suit, Rank rank, uint order, uint seat) {
            Card = new Card(suit, rank);
            Order = order;
            Seat = seat;
        }

        public bool compareOnValue(PlayedCard otherCard) {
            // Check Higher Value, If Equal, first ordered card wins
            if (this.Card.Rank.Value > otherCard.Card.Rank.Value) {
                return true;
            } else if (this.Card.Rank.Value < otherCard.Card.Rank.Value) {
                return false;
            }

            // The cards have the same value, so it comes down to which was played first 
            return this.Order < otherCard.Order;
        }

        public bool winsAgainst(PlayedCard otherCard, Suit lead, Trump trump) {
            if (otherCard == null) {
                return true;
            }
            
            bool thisIsTrump = Card.Suit.Equals(trump.Suit);
            bool thatIsTrump = otherCard.Card.Suit.Equals(trump.Suit);

            if (thisIsTrump && thatIsTrump) {
                return compareOnValue(otherCard);
            } 
            
            
            if (thatIsTrump) {
                // The passed in card is trump, and this one isn't so it always loses
                return false;
            }
            
            if (thisIsTrump) {
                // This card is trump, and the other isn't so this always wins
                return true;
            }

            // Process No Trump Involvement
            bool thisIsLead = this.Card.Suit.Equals(lead);
            bool thatIsLead = otherCard.Card.Suit.Equals(lead);
            if (thisIsLead && thatIsLead) {
                return compareOnValue(otherCard);
            } else if (thisIsLead) {
                return true;
            } else if (thatIsLead) {
                return false;
            }

            // Neither Card Is The Lead Suit or Trump, So Highest Card Wins
            return compareOnValue(otherCard);
        }

    }
}

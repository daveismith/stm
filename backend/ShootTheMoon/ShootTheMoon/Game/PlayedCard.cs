using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class PlayedCard
    {
        private static int TRUMP_OFFSET = 64;
        private static int LEAD_OFFSET = 32;
        private static int RANK_SIZE = 16;
        private static int RIGHT_OFFSET = (Rank.Ace.Value - Rank.Jack.Value) + 2;
        private static int LEFT_OFFSET = (Rank.Ace.Value - Rank.Jack.Value) + 1;

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

        public int cardScore(Suit lead, Trump trump) {
            int score = this.Card.Rank.Value;

            if (trump == Trump.Low) {
                score = RANK_SIZE - score;
            }

            if (this.Card.Suit == trump.Suit) {
                // Anything Trump gets 64 points automatically
                score += TRUMP_OFFSET;
                if (this.Card.Rank == Rank.Jack) {
                    score += RIGHT_OFFSET; // Bump Ahead Of The Ace, Leaving room for the left
                }
            } else if ((this.Card.Suit == trump.SameColour) && (this.Card.Rank == Rank.Jack)) {
                score += TRUMP_OFFSET + LEFT_OFFSET;    // This is actually a trump card and the left
            } else if (this.Card.Suit == lead) {
                score += LEAD_OFFSET;
            }

            return score;
        }

        public bool winsAgainst(PlayedCard otherCard, Suit lead, Trump trump) {
            if (otherCard == null) {
                return true;
            }

            int valueA = this.cardScore(lead, trump);
            int valueB = otherCard.cardScore(lead, trump);

            // Check Higher Value, If Equal, first ordered card wins
            if (valueA > valueB) {
                return true;
            } else if (valueA < valueB) {
                return false;
            }

            // The cards have the same value, so it comes down to which was played first 
            return this.Order < otherCard.Order;
        }

    }
}

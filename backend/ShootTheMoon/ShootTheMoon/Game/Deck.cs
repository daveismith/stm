using System;
using System.Collections.Generic;

namespace ShootTheMoon.Game
{
    public class Deck
    {
        public int NumDuplicateCards { get; set; }
        public IList<Card> Cards { get; set; }
        private static Random random = new Random();
        
        public Deck(int numDuplicateCards = 1, bool shuffle = true)
        {
            NumDuplicateCards = numDuplicateCards;
            Cards = new List<Card>();

            for (int i = 0; i < numDuplicateCards; i++)
            {
                foreach (var suit in Suit.Suits)
                {
                    foreach (var rank in Rank.Ranks)
                    {
                        Cards.Add(new Card { Suit = suit, Rank = rank });
                    }
                }
            }

            if (shuffle) Shuffle();
        }

        public void Shuffle()
        {
            int n = Cards.Count;
            while(n > 1)
            {
                n--;
                int k = random.Next(n + 1);
                Card c = Cards[k];
                Cards[k] = Cards[n];
                Cards[n] = c;
            }
        }

        public Card Draw()
        {
            if (Cards.Count > 0)
            {
                Card card = Cards[0];
                Cards.RemoveAt(0);
                return card;
            }
            return null; 
        }

        public Card Peek()
        {
            if (Cards.Count > 0)
            {
                return Cards[0];
            }
            return null;
        }
    }
}

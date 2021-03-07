using System;
using System.Collections.Generic;

namespace ShootTheMoon.Game
{
    public class Deck
    {
        public static readonly List<Suit> Suits = new List<Suit>
        {
            new Suit {ShortName = "S", LongName = "Spades" },
            new Suit {ShortName = "H", LongName = "Hearts" },
            new Suit {ShortName = "C", LongName = "Clubs" },
            new Suit {ShortName = "D", LongName = "Diamonds" }
        };

        public static readonly List<Rank> Ranks = new List<Rank>
        {
            new Rank { Value = 9, ShortName = "9", LongName = "Nine" },
            new Rank { Value = 10, ShortName = "10", LongName = "Ten" },
            new Rank { Value = 11, ShortName = "J", LongName = "Jack" },
            new Rank { Value = 12, ShortName = "Q", LongName = "Queen" },
            new Rank { Value = 13, ShortName = "K", LongName = "King" },
            new Rank { Value = 14, ShortName = "A", LongName = "Ace" }
        };

        public int Copies { get; set; }
        public IList<Card> Cards { get; set; }
        private static Random random = new Random();
        
        public Deck(int copies = 1, bool shuffle = true)
        {
            Copies = copies;
            Cards = new List<Card>();

            for (int i = 0; i < copies; i++)
            {
                foreach (var suit in Suits)
                {
                    foreach (var rank in Ranks)
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

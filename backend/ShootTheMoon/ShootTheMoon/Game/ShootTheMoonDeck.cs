using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class ShootTheMoonDeck : Deck
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

        public ShootTheMoonDeck(int copies = 1, bool shuffle = true)
        {
            Copies = copies;
            Cards = new List<Card>();

            for(int i = 0; i < copies; i++)
            {
                foreach(var suit in Suits)
                {
                    foreach(var rank in Ranks)
                    {
                        Cards.Add(new Card { Suit = suit, Rank = rank });
                    }
                }
            }

            if (shuffle) Shuffle();
        }
    }
}

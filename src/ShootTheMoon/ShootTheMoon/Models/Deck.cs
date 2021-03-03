using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Models
{
    public class Deck
    {
        public IList<Card> Cards { get; set; }

        private static Random random = new Random();

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
    }
}

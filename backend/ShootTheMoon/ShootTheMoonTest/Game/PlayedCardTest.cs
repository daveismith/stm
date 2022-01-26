using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System;
using ShootTheMoon;
using ShootTheMoon.Game;

namespace ShootTheMoonTest.Game
{

    [TestClass]
    public class PlayedCardTest
    {
        Card nineOfHearts = new Card(Suit.Hearts, Rank.Nine);

        Card jackOfClubs = new Card(Suit.Clubs, Rank.Jack);

        Card nineOfSpades = new Card(Suit.Spades, Rank.Nine);
        Card tenOfSpades = new Card(Suit.Spades, Rank.Ten);
        Card jackOfSpades = new Card(Suit.Spades, Rank.Jack);
        Card queenOfSpades = new Card(Suit.Spades, Rank.Queen);
        Card kingOfSpades = new Card(Suit.Spades, Rank.King);
        Card aceOfSpades = new Card(Suit.Spades, Rank.Ace);
        

        [TestMethod]
        public void TestHigherCardNotLeadNotTrump()
        {
            PlayedCard first = new PlayedCard(nineOfSpades, 0, 0);
            PlayedCard second = new PlayedCard(tenOfSpades, 1, 1);
            Assert.IsTrue(second.winsAgainst(first, Suit.Clubs, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, Suit.Clubs, Trump.Diamonds));

            first = second;
            second = new PlayedCard(jackOfSpades, 2, 2);
            Assert.IsTrue(second.winsAgainst(first, Suit.Clubs, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, Suit.Clubs, Trump.Diamonds));

            first = second;
            second = new PlayedCard(queenOfSpades, 3, 3);
            Assert.IsTrue(second.winsAgainst(first, Suit.Clubs, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, Suit.Clubs, Trump.Diamonds));

            first = second;
            second = new PlayedCard(kingOfSpades, 4, 4);
            Assert.IsTrue(second.winsAgainst(first, Suit.Clubs, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, Suit.Clubs, Trump.Diamonds));

            first = second;
            second = new PlayedCard(aceOfSpades, 5, 5);
            Assert.IsTrue(second.winsAgainst(first, Suit.Clubs, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, Suit.Clubs, Trump.Diamonds));            
        }

        [TestMethod]
        public void TestHigherCardNotLeadLowTrump()
        {
            PlayedCard first = new PlayedCard(nineOfSpades, 0, 0);
            PlayedCard second = new PlayedCard(tenOfSpades, 1, 1);
            Assert.IsFalse(second.winsAgainst(first, Suit.Clubs, Trump.Low));
            Assert.IsTrue(first.winsAgainst(second, Suit.Clubs, Trump.Low));

            first = second;
            second = new PlayedCard(jackOfSpades, 2, 2);
            Assert.IsFalse(second.winsAgainst(first, Suit.Clubs, Trump.Low));
            Assert.IsTrue(first.winsAgainst(second, Suit.Clubs, Trump.Low));

            first = second;
            second = new PlayedCard(queenOfSpades, 3, 3);
            Assert.IsFalse(second.winsAgainst(first, Suit.Clubs, Trump.Low));
            Assert.IsTrue(first.winsAgainst(second, Suit.Clubs, Trump.Low));

            first = second;
            second = new PlayedCard(kingOfSpades, 4, 4);
            Assert.IsFalse(second.winsAgainst(first, Suit.Clubs, Trump.Low));
            Assert.IsTrue(first.winsAgainst(second, Suit.Clubs, Trump.Low));

            first = second;
            second = new PlayedCard(aceOfSpades, 5, 5);
            Assert.IsFalse(second.winsAgainst(first, Suit.Clubs, Trump.Low));
            Assert.IsTrue(first.winsAgainst(second, Suit.Clubs, Trump.Low));            
        }

        [TestMethod]
        public void TestHigherCardBothLeadNotTrump()
        {
            PlayedCard first = new PlayedCard(nineOfSpades, 0, 0);
            PlayedCard second = new PlayedCard(tenOfSpades, 1, 1);
            Assert.IsTrue(second.winsAgainst(first, Suit.Spades, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, Suit.Spades, Trump.Diamonds));

            first = second;
            second = new PlayedCard(jackOfSpades, 2, 2);
            Assert.IsTrue(second.winsAgainst(first, Suit.Spades, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, Suit.Spades, Trump.Diamonds));

            first = second;
            second = new PlayedCard(queenOfSpades, 3, 3);
            Assert.IsTrue(second.winsAgainst(first, Suit.Spades, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, Suit.Spades, Trump.Diamonds));

            first = second;
            second = new PlayedCard(kingOfSpades, 4, 4);
            Assert.IsTrue(second.winsAgainst(first, Suit.Spades, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, Suit.Spades, Trump.Diamonds));

            first = second;
            second = new PlayedCard(aceOfSpades, 5, 5);
            Assert.IsTrue(second.winsAgainst(first, Suit.Spades, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, Suit.Spades, Trump.Diamonds));            
        }

       [TestMethod]
        public void TestLeadWinsOverHigherNonLeadNonTrump()
        {
            PlayedCard lead = new PlayedCard(nineOfHearts, 0, 0);
            PlayedCard other = new PlayedCard(nineOfSpades, 1, 1);
            Assert.IsTrue(lead.winsAgainst(other, Suit.Hearts, Trump.Diamonds));
            Assert.IsFalse(other.winsAgainst(lead, Suit.Hearts, Trump.Diamonds));

            other = new PlayedCard(tenOfSpades, 1, 1);
            Assert.IsTrue(lead.winsAgainst(other, Suit.Hearts, Trump.Diamonds));
            Assert.IsFalse(other.winsAgainst(lead, Suit.Hearts, Trump.Diamonds));

            other = new PlayedCard(jackOfSpades, 1, 1);
            Assert.IsTrue(lead.winsAgainst(other, Suit.Hearts, Trump.Diamonds));
            Assert.IsFalse(other.winsAgainst(lead, Suit.Hearts, Trump.Diamonds));            

            other = new PlayedCard(queenOfSpades, 1, 1);
            Assert.IsTrue(lead.winsAgainst(other, Suit.Hearts, Trump.Diamonds));
            Assert.IsFalse(other.winsAgainst(lead, Suit.Hearts, Trump.Diamonds));            

            other = new PlayedCard(kingOfSpades, 1, 1);
            Assert.IsTrue(lead.winsAgainst(other, Suit.Hearts, Trump.Diamonds));
            Assert.IsFalse(other.winsAgainst(lead, Suit.Hearts, Trump.Diamonds));            

            other = new PlayedCard(aceOfSpades, 1, 1);
            Assert.IsTrue(lead.winsAgainst(other, Suit.Hearts, Trump.Diamonds));
            Assert.IsFalse(other.winsAgainst(lead, Suit.Hearts, Trump.Diamonds));            

        } 


       [TestMethod]
        public void TestTrumpWinsOverNonTrump()
        {
            PlayedCard lead = new PlayedCard(nineOfHearts, 0, 0);
            PlayedCard other = new PlayedCard(nineOfSpades, 1, 1);
            Assert.IsTrue(other.winsAgainst(lead, Suit.Hearts, Trump.Spades));
            Assert.IsFalse(lead.winsAgainst(other, Suit.Hearts, Trump.Spades));

            other = new PlayedCard(tenOfSpades, 1, 1);
            Assert.IsTrue(other.winsAgainst(lead, Suit.Hearts, Trump.Spades));
            Assert.IsFalse(lead.winsAgainst(other, Suit.Hearts, Trump.Spades));

            other = new PlayedCard(jackOfSpades, 1, 1);
            Assert.IsTrue(other.winsAgainst(lead, Suit.Hearts, Trump.Spades));
            Assert.IsFalse(lead.winsAgainst(other, Suit.Hearts, Trump.Spades));

            other = new PlayedCard(queenOfSpades, 1, 1);
            Assert.IsTrue(other.winsAgainst(lead, Suit.Hearts, Trump.Spades));
            Assert.IsFalse(lead.winsAgainst(other, Suit.Hearts, Trump.Spades));

            other = new PlayedCard(kingOfSpades, 1, 1);
            Assert.IsTrue(other.winsAgainst(lead, Suit.Hearts, Trump.Spades));
            Assert.IsFalse(lead.winsAgainst(other, Suit.Hearts, Trump.Spades));

            other = new PlayedCard(aceOfSpades, 1, 1);
            Assert.IsTrue(other.winsAgainst(lead, Suit.Hearts, Trump.Spades));
            Assert.IsFalse(lead.winsAgainst(other, Suit.Hearts, Trump.Spades));

        }  

        [TestMethod]
        public void TestFirstCardWinsWhenEqual()
        {
            PlayedCard first = new PlayedCard(nineOfSpades, 0, 0);
            PlayedCard second = new PlayedCard(nineOfSpades, 1, 1);
            Assert.IsTrue(first.winsAgainst(second, Suit.Clubs, Trump.Diamonds));
            Assert.IsFalse(second.winsAgainst(first, Suit.Clubs, Trump.Diamonds));         

            Assert.IsTrue(first.winsAgainst(second, Suit.Clubs, Trump.Low));
            Assert.IsFalse(second.winsAgainst(first, Suit.Clubs, Trump.Low));  
        }

        [TestMethod]
        public void TestRightBeatsLeft() {
            PlayedCard first = new PlayedCard(jackOfSpades, 0, 0);
            PlayedCard second = new PlayedCard(jackOfClubs, 1, 1);

            Assert.IsTrue(first.winsAgainst(second, Suit.Clubs, Trump.Spades));
            Assert.IsFalse(second.winsAgainst(first, Suit.Clubs, Trump.Spades));

            Assert.IsFalse(first.winsAgainst(second, Suit.Clubs, Trump.Clubs));
            Assert.IsTrue(second.winsAgainst(first, Suit.Clubs, Trump.Clubs));
        }

        [TestMethod]
        public void TestRightBeatAce() {
            PlayedCard first = new PlayedCard(jackOfSpades, 0, 1);
            PlayedCard second = new PlayedCard(aceOfSpades, 1, 1);

            Assert.IsTrue(first.winsAgainst(second, Suit.Spades, Trump.Spades));
            Assert.IsFalse(second.winsAgainst(first, Suit.Spades, Trump.Spades));   
        }

        [TestMethod]
        public void TestLeftBeatAce() {
            PlayedCard first = new PlayedCard(jackOfClubs, 0, 0);
            PlayedCard second = new PlayedCard(aceOfSpades, 1, 1);

            Assert.IsTrue(first.winsAgainst(second, Suit.Spades, Trump.Spades));
            Assert.IsFalse(second.winsAgainst(first, Suit.Spades, Trump.Spades));

            first = new PlayedCard(aceOfSpades, 0, 0);
            second = new PlayedCard(jackOfClubs, 1, 1);

            Assert.IsFalse(first.winsAgainst(second, Suit.Spades, Trump.Spades));
            Assert.IsTrue(second.winsAgainst(first, Suit.Spades, Trump.Spades));               
        }

    }


}
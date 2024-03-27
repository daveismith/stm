using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System;
using System.Collections.Generic;
using ShootTheMoon;
using ShootTheMoon.Game;

namespace ShootTheMoonTest.Game
{

    [TestClass]
    public class PlayedCardTest
    {
        Card nineOfHearts = new Card(Suit.Hearts, Rank.Nine);

        Card nineOfClubs = new Card(Suit.Clubs, Rank.Nine);
        Card jackOfClubs = new Card(Suit.Clubs, Rank.Jack);

        Card nineOfDiamonds = new Card(Suit.Diamonds, Rank.Nine);

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
            Assert.IsTrue(second.winsAgainst(first, first.Card, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, first.Card, Trump.Diamonds));

            first = second;
            second = new PlayedCard(jackOfSpades, 2, 2);
            Assert.IsTrue(second.winsAgainst(first, first.Card, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, first.Card, Trump.Diamonds));

            first = second;
            second = new PlayedCard(queenOfSpades, 3, 3);
            Assert.IsTrue(second.winsAgainst(first, first.Card, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, first.Card, Trump.Diamonds));

            first = second;
            second = new PlayedCard(kingOfSpades, 4, 4);
            Assert.IsTrue(second.winsAgainst(first, first.Card, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, first.Card, Trump.Diamonds));

            first = second;
            second = new PlayedCard(aceOfSpades, 5, 5);
            Assert.IsTrue(second.winsAgainst(first, first.Card, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, first.Card, Trump.Diamonds));            
        }

        [TestMethod]
        public void TestHigherCardNotLeadLowTrump()
        {
            PlayedCard first = new PlayedCard(nineOfSpades, 0, 0);
            PlayedCard second = new PlayedCard(tenOfSpades, 1, 1);
            Assert.IsFalse(second.winsAgainst(first, first.Card, Trump.Low));
            Assert.IsTrue(first.winsAgainst(second, first.Card, Trump.Low));

            first = second;
            second = new PlayedCard(jackOfSpades, 2, 2);
            Assert.IsFalse(second.winsAgainst(first, first.Card, Trump.Low));
            Assert.IsTrue(first.winsAgainst(second, first.Card, Trump.Low));

            first = second;
            second = new PlayedCard(queenOfSpades, 3, 3);
            Assert.IsFalse(second.winsAgainst(first, first.Card, Trump.Low));
            Assert.IsTrue(first.winsAgainst(second, first.Card, Trump.Low));

            first = second;
            second = new PlayedCard(kingOfSpades, 4, 4);
            Assert.IsFalse(second.winsAgainst(first, first.Card, Trump.Low));
            Assert.IsTrue(first.winsAgainst(second, first.Card, Trump.Low));

            first = second;
            second = new PlayedCard(aceOfSpades, 5, 5);
            Assert.IsFalse(second.winsAgainst(first, first.Card, Trump.Low));
            Assert.IsTrue(first.winsAgainst(second, first.Card, Trump.Low));            
        }

        [TestMethod]
        public void TestHigherCardBothLeadNotTrump()
        {
            PlayedCard first = new PlayedCard(nineOfSpades, 0, 0);
            PlayedCard second = new PlayedCard(tenOfSpades, 1, 1);
            Assert.IsTrue(second.winsAgainst(first, first.Card, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, first.Card, Trump.Diamonds));

            first = second;
            second = new PlayedCard(jackOfSpades, 2, 2);
            Assert.IsTrue(second.winsAgainst(first, first.Card, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, first.Card, Trump.Diamonds));

            first = second;
            second = new PlayedCard(queenOfSpades, 3, 3);
            Assert.IsTrue(second.winsAgainst(first, first.Card, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, first.Card, Trump.Diamonds));

            first = second;
            second = new PlayedCard(kingOfSpades, 4, 4);
            Assert.IsTrue(second.winsAgainst(first, first.Card, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, first.Card, Trump.Diamonds));

            first = second;
            second = new PlayedCard(aceOfSpades, 5, 5);
            Assert.IsTrue(second.winsAgainst(first, first.Card, Trump.Diamonds));
            Assert.IsFalse(first.winsAgainst(second, first.Card, Trump.Diamonds));            
        }

        
       [TestMethod]
        public void TestLeadWinsOverHigherNonLeadNonTrump()
        {
            PlayedCard lead = new PlayedCard(nineOfHearts, 0, 0);
            PlayedCard other = new PlayedCard(nineOfSpades, 1, 1);
            Assert.IsTrue(lead.winsAgainst(other, lead.Card, Trump.Diamonds));
            Assert.IsFalse(other.winsAgainst(lead, lead.Card, Trump.Diamonds));

            other = new PlayedCard(tenOfSpades, 1, 1);
            Assert.IsTrue(lead.winsAgainst(other, lead.Card, Trump.Diamonds));
            Assert.IsFalse(other.winsAgainst(lead, lead.Card, Trump.Diamonds));

            other = new PlayedCard(jackOfSpades, 1, 1);
            Assert.IsTrue(lead.winsAgainst(other, lead.Card, Trump.Diamonds));
            Assert.IsFalse(other.winsAgainst(lead, lead.Card, Trump.Diamonds));            

            other = new PlayedCard(queenOfSpades, 1, 1);
            Assert.IsTrue(lead.winsAgainst(other, lead.Card, Trump.Diamonds));
            Assert.IsFalse(other.winsAgainst(lead, lead.Card, Trump.Diamonds));            

            other = new PlayedCard(kingOfSpades, 1, 1);
            Assert.IsTrue(lead.winsAgainst(other, lead.Card, Trump.Diamonds));
            Assert.IsFalse(other.winsAgainst(lead, lead.Card, Trump.Diamonds));            

            other = new PlayedCard(aceOfSpades, 1, 1);
            Assert.IsTrue(lead.winsAgainst(other, lead.Card, Trump.Diamonds));
            Assert.IsFalse(other.winsAgainst(lead, lead.Card, Trump.Diamonds));            
        } 

       [TestMethod]
        public void TestTrumpWinsOverNonTrump()
        {
            PlayedCard lead = new PlayedCard(nineOfHearts, 0, 0);
            PlayedCard other = new PlayedCard(nineOfSpades, 1, 1);
            Assert.IsTrue(other.winsAgainst(lead, lead.Card, Trump.Spades));
            Assert.IsFalse(lead.winsAgainst(other, lead.Card, Trump.Spades));

            other = new PlayedCard(tenOfSpades, 1, 1);
            Assert.IsTrue(other.winsAgainst(lead, lead.Card, Trump.Spades));
            Assert.IsFalse(lead.winsAgainst(other, lead.Card, Trump.Spades));

            other = new PlayedCard(jackOfSpades, 1, 1);
            Assert.IsTrue(other.winsAgainst(lead, lead.Card, Trump.Spades));
            Assert.IsFalse(lead.winsAgainst(other, lead.Card, Trump.Spades));

            other = new PlayedCard(queenOfSpades, 1, 1);
            Assert.IsTrue(other.winsAgainst(lead, lead.Card, Trump.Spades));
            Assert.IsFalse(lead.winsAgainst(other, lead.Card, Trump.Spades));

            other = new PlayedCard(kingOfSpades, 1, 1);
            Assert.IsTrue(other.winsAgainst(lead, lead.Card, Trump.Spades));
            Assert.IsFalse(lead.winsAgainst(other, lead.Card, Trump.Spades));

            other = new PlayedCard(aceOfSpades, 1, 1);
            Assert.IsTrue(other.winsAgainst(lead, lead.Card, Trump.Spades));
            Assert.IsFalse(lead.winsAgainst(other, lead.Card, Trump.Spades));

        }  

        [TestMethod]
        public void TestFirstCardWinsWhenEqual()
        {
            PlayedCard first = new PlayedCard(nineOfSpades, 0, 0);
            PlayedCard second = new PlayedCard(nineOfSpades, 1, 1);
            Assert.IsTrue(first.winsAgainst(second, first.Card, Trump.Diamonds));
            Assert.IsFalse(second.winsAgainst(first, first.Card, Trump.Diamonds));         

            Assert.IsTrue(first.winsAgainst(second, first.Card, Trump.Low));
            Assert.IsFalse(second.winsAgainst(first, first.Card, Trump.Low));  
        }

        [TestMethod]
        public void TestRightBeatsLeft() {
            PlayedCard first = new PlayedCard(jackOfSpades, 0, 0);
            PlayedCard second = new PlayedCard(jackOfClubs, 1, 1);

            Assert.IsTrue(first.winsAgainst(second, first.Card, Trump.Spades));
            Assert.IsFalse(second.winsAgainst(first, first.Card, Trump.Spades));

            Assert.IsFalse(first.winsAgainst(second, first.Card, Trump.Clubs));
            Assert.IsTrue(second.winsAgainst(first, first.Card, Trump.Clubs));
        }

        [TestMethod]
        public void TestRightBeatAce() {
            PlayedCard right = new PlayedCard(jackOfSpades, 0, 1);
            PlayedCard ace = new PlayedCard(aceOfSpades, 1, 1);

            Assert.IsTrue(right.winsAgainst(ace, right.Card, Trump.Spades));
            Assert.IsFalse(ace.winsAgainst(right, right.Card, Trump.Spades));   

            right = new PlayedCard(jackOfSpades, 1, 1);
            ace = new PlayedCard(aceOfSpades, 0, 1);

            Assert.IsTrue(right.winsAgainst(ace, ace.Card, Trump.Spades));
            Assert.IsFalse(ace.winsAgainst(right, ace.Card, Trump.Spades));   
        }


        [TestMethod]
        public void TestLeftBeatAce() {
            PlayedCard left = new PlayedCard(jackOfClubs, 0, 0);
            PlayedCard ace = new PlayedCard(aceOfSpades, 1, 1);

            Assert.IsTrue(left.winsAgainst(ace, left.Card, Trump.Spades));
            Assert.IsFalse(ace.winsAgainst(left, left.Card, Trump.Spades));

            ace = new PlayedCard(aceOfSpades, 0, 0);
            left = new PlayedCard(jackOfClubs, 1, 1);

            Assert.IsFalse(ace.winsAgainst(left, ace.Card, Trump.Spades));
            Assert.IsTrue(left.winsAgainst(ace, ace.Card, Trump.Spades));               
        }

        [TestMethod]
        public void TestPlayingCardNotInHandFails() {
            PlayedCard first = new PlayedCard(jackOfClubs, 1, 0);
            List<Card> hand = new List<Card>();
            hand.Add(nineOfSpades);
            hand.Add(tenOfSpades);
            hand.Add(jackOfSpades);
            hand.Add(queenOfSpades);
            hand.Add(kingOfSpades);
            hand.Add(aceOfSpades);

            Assert.IsFalse(first.isValidWithHand(hand, nineOfClubs, Trump.Clubs));
            Assert.IsFalse(first.isValidWithHand(hand, nineOfSpades, Trump.Clubs));
            Assert.IsFalse(first.isValidWithHand(hand, nineOfHearts, Trump.Clubs));
            Assert.IsFalse(first.isValidWithHand(hand, nineOfDiamonds, Trump.Clubs));
        }

        [TestMethod]
        public void TestNotFollowingLeadRules() {
            PlayedCard first = new PlayedCard(nineOfHearts, 0, 0);
            List<Card> hand = new List<Card>();
            hand.Add(nineOfSpades);
            hand.Add(nineOfClubs);
            hand.Add(nineOfDiamonds);
            hand.Add(nineOfHearts);

            Assert.IsFalse(first.isValidWithHand(hand, nineOfSpades, Trump.Clubs));
            Assert.IsFalse(first.isValidWithHand(hand, nineOfClubs, Trump.Clubs));
            Assert.IsFalse(first.isValidWithHand(hand, nineOfDiamonds, Trump.Clubs));
            Assert.IsTrue(first.isValidWithHand(hand, nineOfHearts, Trump.Clubs));
        }        

        [TestMethod]
        public void TestLeadRulesWithLeft() {
            PlayedCard first = new PlayedCard(jackOfClubs, 0, 0);
            List<Card> hand = new List<Card>();
            hand.Add(nineOfSpades);
            hand.Add(jackOfClubs);
            hand.Add(nineOfDiamonds);
            hand.Add(nineOfHearts);

            Assert.IsTrue(first.isValidWithHand(hand, nineOfSpades, Trump.Spades));  // Right
            Assert.IsTrue(first.isValidWithHand(hand, nineOfClubs, Trump.Spades));   // Left
            Assert.IsFalse(first.isValidWithHand(hand, nineOfDiamonds, Trump.Spades));
            Assert.IsFalse(first.isValidWithHand(hand, nineOfHearts, Trump.Spades));
        }  

        [TestMethod]
        public void TestLead() {
            PlayedCard first = new PlayedCard(jackOfClubs, 0, 0);
            List<Card> hand = new List<Card>();
            hand.Add(nineOfSpades);
            hand.Add(jackOfClubs);
            hand.Add(nineOfDiamonds);
            hand.Add(nineOfHearts);

            Assert.IsTrue(first.isValidWithHand(hand, null, Trump.Spades));  // Right
            Assert.IsTrue(first.isValidWithHand(hand, null, Trump.Clubs));  
            Assert.IsTrue(first.isValidWithHand(hand, null, Trump.Diamonds)); 
            Assert.IsTrue(first.isValidWithHand(hand, null, Trump.Hearts)); 
            Assert.IsTrue(first.isValidWithHand(hand, null, Trump.Low)); 
            Assert.IsTrue(first.isValidWithHand(hand, null, Trump.High)); 
        }  

        [TestMethod]
        public void TestLeadRulesWithRight() {
            PlayedCard first = new PlayedCard(jackOfClubs, 0, 0);
            List<Card> hand = new List<Card>();
            hand.Add(nineOfSpades);
            hand.Add(jackOfClubs);
            hand.Add(nineOfDiamonds);
            hand.Add(nineOfHearts);

            Assert.IsTrue(first.isValidWithHand(hand, nineOfClubs, Trump.Clubs));  // Right
            Assert.IsFalse(first.isValidWithHand(hand, nineOfSpades, Trump.Clubs));
            Assert.IsFalse(first.isValidWithHand(hand, nineOfDiamonds, Trump.Clubs));
            Assert.IsFalse(first.isValidWithHand(hand, nineOfHearts, Trump.Clubs));
        }          


        [TestMethod]
        public void TestLeadRulesOnlyThisCard() {
            PlayedCard first = new PlayedCard(jackOfClubs, 0, 0);
            List<Card> hand = new List<Card>();
            hand.Add(jackOfClubs);
            
            Assert.IsTrue(first.isValidWithHand(hand, nineOfClubs, Trump.Spades));  // Right
            Assert.IsTrue(first.isValidWithHand(hand, nineOfSpades, Trump.Spades));
            Assert.IsTrue(first.isValidWithHand(hand, nineOfDiamonds, Trump.Spades));
            Assert.IsTrue(first.isValidWithHand(hand, nineOfHearts, Trump.Spades));
        }

    }


}
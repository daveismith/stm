using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System;
using System.Collections.Generic;
using ShootTheMoon;
using ShootTheMoon.Game;


namespace ShootTheMoonTest.Game
{

    [TestClass]
    public class BidTest
    {

        [DataRow(0u)]
        [DataRow(1u)]
        [DataRow(2u)]
        [DataRow(3u)]
        [DataRow(4u)]
        [DataRow(5u)]
        [DataTestMethod]
        public void TestNormalBid(uint seat) {
            for (uint number = 1; number < 6; number++)
            {
                Bid b = Bid.makeNormalBid(seat, number, Trump.Clubs);
                Assert.AreEqual(seat, b.Seat);
                Assert.AreEqual(number, b.Number);
                Assert.AreEqual(Trump.Clubs, b.Trump);
                Assert.AreEqual(0u, b.ShootNumber);
                Assert.IsFalse(b.isPass());
                Assert.IsFalse(b.isShoot());
                Assert.IsTrue(b.isNormalBid());
            }
        }

        [DataRow(0u)]
        [DataRow(1u)]
        [DataRow(2u)]
        [DataRow(3u)]
        [DataRow(4u)]
        [DataRow(5u)]
        [DataTestMethod]
        public void TestPassBid(uint seat) {
            Bid b = Bid.makePassBid(seat);
            Assert.AreEqual(seat, b.Seat);
            Assert.AreEqual(0u, b.Number);
            Assert.IsNull(b.Trump);
            Assert.AreEqual(0u, b.ShootNumber);
            Assert.IsTrue(b.isPass());
            Assert.IsFalse(b.isShoot());
            Assert.IsFalse(b.isNormalBid());
        }        

        [DataRow(0u, 1u)]
        [DataRow(1u, 2u)]
        [DataRow(2u, 3u)]
        [DataRow(3u, 4u)]
        [DataRow(4u, 1u)]
        [DataRow(5u, 2u)]
        [DataTestMethod]
        public void TestShootBid(uint seat, uint shootNum) {
            Bid b = Bid.makeShootBid(seat, shootNum, Trump.Hearts);
            Assert.AreEqual(seat, b.Seat);
            Assert.AreEqual(Bid.SHOOT_NUM, b.Number);
            Assert.AreEqual(Trump.Hearts, b.Trump);
            Assert.AreEqual(shootNum, b.ShootNumber);
            Assert.IsFalse(b.isPass());
            Assert.IsTrue(b.isShoot());
            Assert.IsFalse(b.isNormalBid());
        }        

        [TestMethod]
        public void TestBidBeatsPass() {
            Bid a = Bid.makePassBid(1);
            Bid b = Bid.makeNormalBid(2, 1, Trump.High);
            Assert.IsTrue(b.isBetterThan(a));
            Assert.IsFalse(a.isBetterThan(b));
        }

        [TestMethod]
        public void TestShootBeatsPass() {
            Bid a = Bid.makePassBid(1);
            Bid b = Bid.makeShootBid(2, 1, Trump.High);
            Assert.IsTrue(b.isBetterThan(a));
            Assert.IsFalse(a.isBetterThan(b));
        }

        [TestMethod]
        public void TestShootBeatsNormalBid() {
            Bid a = Bid.makeNormalBid(1, 5, Trump.Clubs);
            Bid b = Bid.makeShootBid(2, 1, Trump.High);
            Assert.IsTrue(b.isBetterThan(a));
            Assert.IsFalse(a.isBetterThan(b));
        }

        [TestMethod]
        public void TestTwoPasses() {
            Bid a = Bid.makePassBid(1);
            Bid b = Bid.makePassBid(2);
            Assert.IsFalse(b.isBetterThan(a));
            Assert.IsFalse(a.isBetterThan(b));
        }

        [TestMethod]
        public void TestHigherNormalBidWins() {
            Bid a = Bid.makeNormalBid(1, 3, Trump.Clubs);
            Bid b = Bid.makeNormalBid(2, 4, Trump.Clubs);
            Assert.IsTrue(b.isBetterThan(a));
            Assert.IsFalse(a.isBetterThan(b));
        }

        [TestMethod]
        public void TestHigherShootBidWins() {
            Bid a = Bid.makeShootBid(1, 3, Trump.Clubs);
            Bid b = Bid.makeShootBid(2, 4, Trump.Clubs);
            Assert.IsTrue(b.isBetterThan(a));
            Assert.IsFalse(a.isBetterThan(b));
        }

    }


}
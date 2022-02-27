using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System;
using ShootTheMoon;
using ShootTheMoon.Game;

namespace ShootTheMoonTest.Game
{

    [TestClass]
    public class GameSettingsTest
    {

        #if DEBUG
        [TestMethod]
        public void TestTwoPlayerGame()
        {
            ShootTheMoon.Game.GameSettings settings = GameSettings.GamePresets["TWOPLAYER"];

            Assert.AreEqual(1, settings.NumPlayersPerTeam);
            Assert.AreEqual(1, settings.NumDuplicateCards);
            Assert.AreEqual(51, settings.ScoreNeededToWin);
            Assert.AreEqual(12, settings.TricksPerHand);
            Assert.AreEqual(45, settings.LeechLimit);
        }
        #endif

        [TestMethod]
        public void TestFourPlayerGame()
        {
            ShootTheMoon.Game.GameSettings settings = GameSettings.GamePresets["FOURPLAYER"];

            Assert.AreEqual(2, settings.NumPlayersPerTeam);
            Assert.AreEqual(1, settings.NumDuplicateCards);
            Assert.AreEqual(51, settings.ScoreNeededToWin);
            Assert.AreEqual(6, settings.TricksPerHand);
            Assert.AreEqual(48, settings.LeechLimit);
        }

        [TestMethod]
        public void TestSixPlayerGame() 
        {
            ShootTheMoon.Game.GameSettings settings = GameSettings.GamePresets["SIXPLAYER"];

            Assert.AreEqual(3, settings.NumPlayersPerTeam);
            Assert.AreEqual(2, settings.NumDuplicateCards);
            Assert.AreEqual(51, settings.ScoreNeededToWin);
            Assert.AreEqual(8, settings.TricksPerHand);
            Assert.AreEqual(47, settings.LeechLimit);
        }

        [TestMethod]
        public void TestEightPlayerGame()
        {
            ShootTheMoon.Game.GameSettings settings = GameSettings.GamePresets["EIGHTPLAYER"];

            Assert.AreEqual(4, settings.NumPlayersPerTeam);
            Assert.AreEqual(3, settings.NumDuplicateCards);
            Assert.AreEqual(51, settings.ScoreNeededToWin);
            Assert.AreEqual(9, settings.TricksPerHand);
            Assert.AreEqual(46, settings.LeechLimit);
        }

    }


}
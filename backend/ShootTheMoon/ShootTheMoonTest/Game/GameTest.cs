using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System;
using ShootTheMoon;
using ShootTheMoon.Game;
using System.Threading;
using System.Threading.Tasks;

namespace ShootTheMoonTest.Game
{

    [TestClass]
    public class GameTest
    {
        [TestMethod]
        public void TestFourPlayerGame()
        {
            ShootTheMoon.Game.Game game = new ShootTheMoon.Game.Game(GameSettings.GamePresets["FOURPLAYER"]);

            Assert.AreEqual(4, game.NumPlayers);
            Assert.AreEqual(4, game.Players.Length);
            Assert.AreEqual(0, game.Clients.Count);
            Assert.AreEqual(0, game.Score[0]);
            Assert.AreEqual(0, game.Score[1]);
            Assert.AreEqual(0, game.Tricks[0]);
            Assert.AreEqual(0, game.Tricks[1]);
            Assert.AreEqual(GameState.AWAITING_PLAYERS, game.State);
        }

        [TestMethod]
        public void TestSixPlayerGame()
        {
            ShootTheMoon.Game.Game game = new ShootTheMoon.Game.Game(ShootTheMoon.Game.GameSettings.GamePresets["SIXPLAYER"]);

            Assert.AreEqual(6, game.NumPlayers);
            Assert.AreEqual(6, game.Players.Length);
            Assert.AreEqual(0, game.Clients.Count);
            Assert.AreEqual(0, game.Score[0]);
            Assert.AreEqual(0, game.Score[1]);
            Assert.AreEqual(0, game.Tricks[0]);
            Assert.AreEqual(0, game.Tricks[1]);            
            Assert.AreEqual(GameState.AWAITING_PLAYERS, game.State);
        }        


        [TestMethod]
        public void TestEightPlayerGame()
        {
            ShootTheMoon.Game.Game game = new ShootTheMoon.Game.Game(ShootTheMoon.Game.GameSettings.GamePresets["EIGHTPLAYER"]);

            Assert.AreEqual(8, game.NumPlayers);
            Assert.AreEqual(8, game.Players.Length);
            Assert.AreEqual(0, game.Clients.Count);
            Assert.AreEqual(0, game.Score[0]);
            Assert.AreEqual(0, game.Score[1]);
            Assert.AreEqual(0, game.Tricks[0]);
            Assert.AreEqual(0, game.Tricks[1]);            
            Assert.AreEqual(GameState.AWAITING_PLAYERS, game.State);
        }               

        [TestMethod]
        public async Task TestTakeSeat()
        {
            var observer = new Mock<IObserver<ShootTheMoon.Game.GameEvent>>();
            ShootTheMoon.Game.Game game = new ShootTheMoon.Game.Game(ShootTheMoon.Game.GameSettings.GamePresets["SIXPLAYER"]);
            game.Subscribe(observer.Object);

            Client c = new Client();
            await game.AddClient(c);
            await game.TakeSeat(0, c);

            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == GameEventType.ClientUpdate && p.Game == game)), Times.Once);
            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == GameEventType.SeatListUpdate && p.Game == game)), Times.Once);
            

            c.Ready = true;
            Thread.Sleep(10); // This is needed to allow time for the update to be generated.
            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.ClientUpdate | GameEventType.SeatListUpdate) && p.Game == game)), Times.Once);

            c.Ready = false;
            Thread.Sleep(10); // This is needed to allow time for the update to be generated.
            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.ClientUpdate | GameEventType.SeatListUpdate) && p.Game == game)), Times.Exactly(2));            

            for (int index = 1; index < game.NumPlayers; index++) {
                Client client = new Client();
                client.Ready = true;
                await game.AddClient(client);
                Thread.Sleep(10); // This is needed to allow time for the update to be generated.
                observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == GameEventType.ClientUpdate && p.Game == game)), Times.Exactly(1 + index));
                Assert.AreEqual(index+1, game.Clients.Count);

                await game.TakeSeat((uint)index, client);
                observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == GameEventType.SeatListUpdate && p.Game == game)), Times.Exactly(index+1));
            }

            c.Ready = true;
            Thread.Sleep(10); // This is needed to allow time for the update to be generated.
            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.ClientUpdate | GameEventType.SeatListUpdate |  GameEventType.StartGame | GameEventType.DealCards) && p.Game == game)), Times.Once);

            foreach (var player in game.Players) {
                Assert.AreEqual(8, player.Hand.Count);
            }
        }
    }
}

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
        [DataRow("FOURPLAYER", 4)]
        [DataRow("SIXPLAYER", 6)]
        [DataRow("EIGHTPLAYER", 8)]
        [DataTestMethod]
        public void TestGame(String presetName, int numPlayers)
        {
            ShootTheMoon.Game.Game game = new ShootTheMoon.Game.Game(GameSettings.GamePresets[presetName]);

            Assert.AreEqual(numPlayers, game.NumPlayers);
            Assert.AreEqual(numPlayers, game.Players.Length);
            Assert.AreEqual(0, game.Clients.Count);
            Assert.AreEqual(0, game.Score[0]);
            Assert.AreEqual(0, game.Score[1]);
            Assert.AreEqual(0, game.Tricks[0]);
            Assert.AreEqual(0, game.Tricks[1]);
            Assert.AreEqual(GameState.AWAITING_PLAYERS, game.State);
        }

        [DataRow("FOURPLAYER", 12)]
        [DataRow("SIXPLAYER", 8)]
        [DataRow("EIGHTPLAYER", 6)]
        [DataTestMethod]
        public async Task TestTakeSeat(String presetName, int handCount)
        {
            var observer = new Mock<IObserver<ShootTheMoon.Game.GameEvent>>();
            ShootTheMoon.Game.Game game = new ShootTheMoon.Game.Game(ShootTheMoon.Game.GameSettings.GamePresets["SIXPLAYER"]);
            game.Subscribe(observer.Object);

            Client c = new Client();
            await game.AddClient(c);
            await game.TakeSeat(0, c);

            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == GameEventType.ClientUpdate && p.Game == game)), Times.Once);
            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == GameEventType.SeatListUpdate && p.Game == game)), Times.Once);
            

            await c.SetReady(true);
            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.ClientUpdate | GameEventType.SeatListUpdate) && p.Game == game)), Times.Once);

            await c.SetReady(false);
            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.ClientUpdate | GameEventType.SeatListUpdate) && p.Game == game)), Times.Exactly(2));            

            for (int index = 1; index < game.NumPlayers; index++) {
                // Add Each Player
                Client client = new Client();
                await game.AddClient(client);                
                observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == GameEventType.ClientUpdate && p.Game == game)), Times.Exactly(1 + index));
                Assert.AreEqual(index+1, game.Clients.Count);

                // Have The Player Take A Seat
                await game.TakeSeat((uint)index, client);
                observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == GameEventType.SeatListUpdate && p.Game == game)), Times.Exactly(index+1));
            
                // Indicate that the Player has taken a seat.
                await client.SetReady(true);
                observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.ClientUpdate | GameEventType.SeatListUpdate) && p.Game == game)), Times.Exactly(index+2));
            }

            await c.SetReady(true);
            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => (p.Type == (GameEventType.StartGame | GameEventType.ClientUpdate | GameEventType.SeatListUpdate |  GameEventType.DealCards | GameEventType.TricksUpdate | GameEventType.ScoreUpdate) && p.Game == game))), Times.Once);

            foreach (var player in game.Players) {
                Assert.AreEqual(8, player.Hand.Count);
            }
        }

    }
}

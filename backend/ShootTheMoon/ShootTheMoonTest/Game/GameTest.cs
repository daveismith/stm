using Microsoft.VisualStudio.TestTools.UnitTesting;
using Moq;
using System;
using System.Collections.Generic;
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

        [DataRow("FOURPLAYER", 6)]
        [DataRow("SIXPLAYER", 8)]
        [DataRow("EIGHTPLAYER", 9)]
        [DataTestMethod]
        public async Task TestNormalBids(String presetName, int handCount)
        {
            IDictionary<int, Client> clients = new Dictionary<int, Client>();

            var observer = new Mock<IObserver<ShootTheMoon.Game.GameEvent>>();
            ShootTheMoon.Game.Game game = new ShootTheMoon.Game.Game(ShootTheMoon.Game.GameSettings.GamePresets[presetName]);
            game.Subscribe(observer.Object);

            Client c = new Client();
            await game.AddClient(c);
            await game.TakeSeat(0, c);
            clients.Add(0, c);

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
                clients.Add(index, c);            

                // Indicate that the Player has taken a seat.
                await client.SetReady(true);
                observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.ClientUpdate | GameEventType.SeatListUpdate) && p.Game == game)), Times.Exactly(index+2));
            }

            await c.SetReady(true);
            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => (p.Type == (GameEventType.StartGame | GameEventType.ClientUpdate | GameEventType.SeatListUpdate |  GameEventType.DealCards | GameEventType.TricksUpdate | GameEventType.ScoreUpdate) && p.Game == game))), Times.Once);

            foreach (var player in game.Players) {
                Assert.AreEqual(handCount, player.Hand.Count);
            }

            //Have Everyone Bid
            Client lastClient = null;

            for (int index = 0; index < game.NumPlayers; index++) {
                // Expect A Bid Request For Each Player
                observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.BidUpdate | GameEventType.RequestBid) && p.Game == game)), Times.Exactly(index + 1));

                lastClient = game.CurrentPlayer;
                await game.MakeBid((uint)index+1, Trump.Clubs, 0, false, game.CurrentPlayer);
            }

            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.BidUpdate | GameEventType.RequestBid) && p.Game == game)), Times.Exactly(game.NumPlayers));
            Assert.AreEqual(lastClient, game.CurrentPlayer);

            // Validate that trump is declared
            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.BidUpdate | GameEventType.TrumpUpdate) && p.Game == game)), Times.Exactly(1));

            // Verify First Play Card Request Is Sent
            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.PlayCardRequest | GameEventType.PlayedCards) && p.Game == game)), Times.Exactly(1));

        }

        [DataRow("FOURPLAYER", 6)]
        [DataRow("SIXPLAYER", 8)]
        [DataRow("EIGHTPLAYER", 9)]
        [DataTestMethod]
        public async Task TestShootBids(String presetName, int handCount)
        {
            IDictionary<int, Client> clients = new Dictionary<int, Client>();

            var observer = new Mock<IObserver<ShootTheMoon.Game.GameEvent>>();
            ShootTheMoon.Game.Game game = new ShootTheMoon.Game.Game(ShootTheMoon.Game.GameSettings.GamePresets[presetName]);
            game.Subscribe(observer.Object);

            Client c = new Client();
            await game.AddClient(c);
            await game.TakeSeat(0, c);
            clients.Add(0, c);

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
                clients.Add(index, c);            

                // Indicate that the Player has taken a seat.
                await client.SetReady(true);
                observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.ClientUpdate | GameEventType.SeatListUpdate) && p.Game == game)), Times.Exactly(index+2));
            }

            await c.SetReady(true);
            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => (p.Type == (GameEventType.StartGame | GameEventType.ClientUpdate | GameEventType.SeatListUpdate |  GameEventType.DealCards | GameEventType.TricksUpdate | GameEventType.ScoreUpdate) && p.Game == game))), Times.Once);

            foreach (var player in game.Players) {
                Assert.AreEqual(handCount, player.Hand.Count);
            }

            //Have Everyone Bid
            Client lastClient = null;
            Client shootClient = null;
            LinkedList<Client> partners = new LinkedList<Client>();

            for (int index = 0; index < game.NumPlayers; index++) {
                // Expect A Bid Request For Each Player
                observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.BidUpdate | GameEventType.RequestBid) && p.Game == game)), Times.Exactly(index + 1));

                lastClient = game.CurrentPlayer;
                if (index == 0) {
                    // Shoot
                    shootClient = game.CurrentPlayer;
                    await game.MakeBid(0, Trump.Clubs, 1, false, game.CurrentPlayer);
                } else if (index % 2 == 0) {
                    // partners
                    partners.AddLast(game.CurrentPlayer);
                    await game.MakeBid(0, Trump.Clubs, 0, true, game.CurrentPlayer);
                } else {
                    await game.MakeBid(0, Trump.Clubs, 0, true, game.CurrentPlayer);
                }
            }

            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.BidUpdate | GameEventType.RequestBid) && p.Game == game)), Times.Exactly(game.NumPlayers));
            Assert.AreEqual(shootClient, game.CurrentPlayer);

            // Validate that trump is declared
            // TODO: Check Clients
            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.TransferRequest) && p.Game == game)), Times.Exactly(1));
            CollectionAssert.AreEquivalent(partners, game.OutstandingTransfers);

            // figure out how to do the transfer
            foreach (var player in partners) {
                // figure out the hand
                uint from = game.FindSeat(player);
                uint to = game.FindSeat(shootClient);

                Card pCard = player.Hand[0];
                await game.TransferCard(pCard.Suit, pCard.Rank, from, to, player);
                
                //observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.TransferRequest) && p.Game == game)), Times.Exactly(1));

            }

            //observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.BidUpdate | GameEventType.TrumpUpdate) && p.Game == game)), Times.Exactly(1));
            for (uint i = 0; i < partners.Count; i++) {
                await game.ThrowawayCard(shootClient.Hand[0].Suit, shootClient.Hand[0].Rank, shootClient);
            }

            // Verify First Play Card Request Is Sent
            observer.Verify(x => x.OnNext(It.Is<GameEvent>(p => p.Type == (GameEventType.PlayCardRequest | GameEventType.PlayedCards) && p.Game == game)), Times.Exactly(1));

        }

    }
}

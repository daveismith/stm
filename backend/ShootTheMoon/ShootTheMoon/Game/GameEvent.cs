using System;

namespace ShootTheMoon.Game {

    [Flags]
    public enum GameEventType {
        None = 0,

        ClientUpdate = 1,

        ScoreUpdate = 2,

        TricksUpdate = 4,

        SeatListUpdate = 8,

        StartGame = 16,

        DealCards = 32,

        RequestBid = 64,

        BidUpdate = 128,

        TransferRequest = 256,

        TransferCard = 512,

        ThrowawayRequest = 1024,

        TrumpUpdate = 2048,

        PlayCardRequest = 4096,

        PlayedCards = 8192
    }

    public class GameEvent {

        public GameEventType Type { get; }
        public Game Game { get; }

        public Client Client { get; protected set; }

        public Object AdditionalData { get; }

        internal GameEvent(GameEventType type, Game game) {
            Type = type;
            Game = game;
            AdditionalData = null;
        }

        internal GameEvent(GameEventType type, Game game, Object additionalData) {
            Type = type;
            Game = game;
            AdditionalData = additionalData;
        }

    }

}
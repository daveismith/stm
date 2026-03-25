using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using Serilog;
using ShootTheMoon.Network.Proto;
using Grpc.Net.Client;
using Grpc.Core;

namespace ShootTheMoon.Bot
{
    public class Game
    {
        public enum GameState {
            AWAITING_PLAYERS,
            DEALING,
            AWAITING_BIDS,
            AWAITING_TRANSFER,
            AWAITING_DISCARD,
            NEW_TRICK,
            PLAYING_HAND, 
            TRICK_COMPLETE,
            HAND_COMPLETE,
            GAME_COMPLETE
        }
        public GameSettings GameSettings { get; set; }
        public string Uuid { get; set; }
        public string? Name { get; set; }

        public List<int> Score { get; set; }
        public int Dealer { get; set; }
        public int CurrentPlayer { get; set; }
        public List<uint> SkipSeats {get; set;}
        public int NextShootNum { get; set; }
        public List<Bid> Bids { get; set; }


        public Bid? CurrentBid { get; set; }

        public Trump? CurrentTrump { get; set; }
        public int RequiredTricks { get; set; }
        public int CallingTeam { get; set; }
        public int[] Tricks { get; set; }
        public List<PlayedCard> PlayedCards { get; set; }
        public PlayedCard? HighCard { get; set; }
        public PlayedCard? LeadCard { get; set; }

        public GameState State { get; private set; }

        public int NumPlayersPresent { get; private set; }

        public bool AddingBots { get; private set; }

        public Game(GameSettings gameSettings)
        {
            Uuid = Guid.NewGuid().ToString();
            Score = new List<int> { 0, 0 };
            Tricks = new int[] { 0, 0 };
            State = GameState.AWAITING_PLAYERS;
            GameSettings = gameSettings;
            Bids = new List<Bid>();
            PlayedCards = new List<PlayedCard>();
            SkipSeats = new List<uint>();
            NumPlayersPresent = 0;
        }
    }
}

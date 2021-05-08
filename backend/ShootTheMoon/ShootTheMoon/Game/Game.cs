using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class Game
    {
        public GameSettings GameSettings { get; set; }
        public string Uuid { get; set; }
        public string Name { get; set; }
        public int NumPlayers { get; }
        public int InProgress { get; set; }
        public List<Client> Clients { get; set; }
        public Client[] Players { get; set; }
        public List<int> Score { get; set; }
        public int Dealer { get; set; }
        public Client CurrentPlayer { get; set; }
        public int NextShootNum { get; set; }
        public List<Bid> Bids { get; set; }
        public Trump CurrentTrump { get; set; }
        public int RequiredTricks { get; set; }
        public int CallingTeam { get; set; }
        public int[] Tricks { get; set; }
        public List<Card> PlayedCards { get; set; }
        public Card HighCard { get; set; }
        public Card LeadCard { get; set; }

        public Game(GameSettings gameSettings)
        {
            Uuid = Guid.NewGuid().ToString();
            Clients = new List<Client>();
            NumPlayers = gameSettings.NumPlayersPerTeam * 2;
            Players = new Client[NumPlayers];
            Score = new List<int> { 0, 0 };
            Tricks = new int[] { 0, 0 };

            Random r = new Random();
            Dealer = r.Next(Players.Length);
        }
    }
}

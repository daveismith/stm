using System;
using System.Collections.Generic;
using System.Linq;
using Grpc.Core;
using ShootTheMoon.Network.Proto;
using System.Threading.Tasks;
using Microsoft.Extensions.ObjectPool;
using ShootTheMoon.Game;
using Grpc.Net.Client;
using Google.Protobuf.Collections;

namespace Bot
{
    public class Bot
    {
        protected string _name;

        public string Name { get { return _name; } }

        private bool _ready;
        public bool Ready { get { return _ready; } }

        private bool _human;
        public bool Human { get { return _human; } }

        public List<Card> Hand { get; set; } = new List<Card>();

        public uint Seat { get; set; }

        public bool Seated { get; set; } = false;

        private ShootServer.ShootServerClient _grpcClient;

        private Metadata _grpcMetadata;

        public AsyncServerStreamingCall<Notification> NotificationStream { get; set; }

        public int id;

        private readonly Dictionary<Trump, double> TrumpScores = new Dictionary<Trump, double>();
        private Bid FirstPartnerBid;
        private Bid SecondPartnerBid;
        private Dictionary<Suit, List<Card>> SortedHand;
        private int LoneAcesOrNines;
        private readonly List<Card> HighCards = new List<Card>();
        private readonly List<Card> LowCards = new List<Card>();
        private readonly BotProfile Profile;

        private readonly Dictionary<Trump, HandBreakdown> Breakdowns = new Dictionary<Trump, HandBreakdown>();
        private HandBreakdown FinalBreakdown;

        private const bool HIGH_LOW_BIDDING_ENABLED = true;
        private const bool DEBUG_MODE_BIDDING = false;
        private const bool DEBUG_MODE_PLAYING = false;
        private const bool TRACK_BOT_STATS = false;

        private enum Status
        {
            LOGIN_SCREEN, LOBBY, LOOKING_FOR_SEAT, PREGAME_READY, PREGAME_NOT_READY, CHOOSING_BID, WAITING_FOR_BID, CHOOSING_TRANSFER_CARDS,
            WAITING_FOR_TRANSFER, THROWING_AWAY_CARDS, WAITING_FOR_THROWAWAY, CHOOSING_CARD, WAITING_FOR_PLAY, SITTING_OUT, LOGGED_OUT, OBSERVING,
            POSTGAME_READY, POSTGAME_NOT_READY
        };


        private static readonly List<string> PossibleNames;

        private static int NextBot = 0;

        const int BID_DELAY = 500;
        const int CARD_DELAY = 500;
        const int TRANSFER_DELAY = 500;
        const int THROWAWAY_DELAY = 500;

        // private readonly Game Game = null;

        // private readonly string Name = string.Empty;

        // private readonly List<Card> Hand = null;

        private Dictionary<uint, Bid> Bids = null;

        private Status CurrentStatus = Status.LOGIN_SCREEN;

        private readonly CardTracker Tracker = new CardTracker();

        private uint Team { get { return Seat % 2; } }

        private Game Game { get; set; }

        private Queue<Notification> notificationQueue = new Queue<Notification>();

        static Bot()
        {
            PossibleNames = new List<string>(new string[] { "Alexander", "Genghis Khan", "Hannibal", "Louis IX", "Charlemagne", "Ivan III" });
        }

        public Bot(BotProfile initProfile)
        {
            id = Bot.NextBot++;
            // Game = initGame;
            CurrentStatus = Status.PREGAME_READY;
            Profile = initProfile;
            _grpcMetadata = new Metadata();
        }

        /// <summary>
        /// Constructor for creating a new bot partway through a game.
        /// </summary>
        /// <param name="initGame">game to join</param>
        /// <param name="newHand">existing hand</param>
        public Bot(List<Card> newHand, BotProfile initProfile)
            : this(initProfile)
        {
            InitializeRound();
            Hand = newHand;
        }

        public void JoinGame(string uuid)
        {
            GrpcChannel channel = GrpcChannel.ForAddress("http://localhost:8080");
            ShootServer.ShootServerClient grpcClient = new ShootServer.ShootServerClient(channel);
            _grpcClient = grpcClient;

            JoinGameRequest joinGameRequest = new JoinGameRequest();
            joinGameRequest.Uuid = uuid;
            joinGameRequest.Name = "Bot";

            _grpcMetadata.Add("x-game-id", uuid);

            Console.WriteLine($"JoinGameRequest: {joinGameRequest}");

            AsyncServerStreamingCall<Notification> response = grpcClient.JoinGame(joinGameRequest);
            NotificationStream = response;
        }

        public async Task GetNotifications()
        {
            Console.WriteLine("BOT: Processing notifications");
            // AsyncServerStreamingCall<Notification> stream = NotificationStream;
            // while (await stream.ResponseStream.MoveNext())
            // {
            // Console.WriteLine("BOT: Processing notification");
            // Notification notification = stream.ResponseStream.Current;
            // ProcessMessage(notification);
            // }
            //await foreach (var notification in NotificationStream.ResponseStream.ReadAllAsync())
            try
            {
                while (await NotificationStream.ResponseStream.MoveNext())
                {
                    Console.WriteLine("BOT: Processing notification");
                    var notification = NotificationStream.ResponseStream.Current;
                    notificationQueue.Enqueue(notification);
                    ProcessMessage(notificationQueue.Dequeue());
                }
            }
            catch (RpcException ex)
            {
                Console.WriteLine($"Error: {{Code: {ex.StatusCode}, Status: {ex.Status.Detail}}}");
            }
            Console.WriteLine("BOT: Done processing notifications");
        }

        private static bool SameTeam(uint seatA, uint seatB)
        {
            return seatA % 2 == seatB % 2;
        }

        private void AdjustForContext(Status newStatus)
        {
            FinalBreakdown = new HandBreakdown();
            CurrentStatus = newStatus;

            if (Game.CurrentTrump == null) SortedHand = SortHandIntoSuits(Trump.High);
            else SortedHand = SortHandIntoSuits(Game.CurrentTrump);

            // switch (status)
            // {
            //     case Status.CHOOSING_BID:
            //         game.CurrentPlayer = this;
            //         requestBid();
            //         break;

            //     case Status.WAITING_FOR_PLAY:
            //         initializeTrick();
            //         break;

            //     case Status.CHOOSING_CARD:
            //         initializeTrick();
            //         game.CurrentPlayer = this;
            //         sendMessageToClient("<REQUESTCARD>" + position);
            //         break;

            //     case Status.CHOOSING_TRANSFER_CARDS:
            //         //game.CurrentPlayer = this;
            //         sendMessageToClient("<REQUESTTRANSFER>" + position.ToString() + game.highBid.bidder.position.ToString());
            //         break;

            //     case Status.THROWING_AWAY_CARDS:
            //         game.CurrentPlayer = this;
            //         sendMessageToClient("<REQUESTTHROWAWAY>" + position);
            //         break;

            //     default:
            //         break;
            // }
        }

        private string GetRandomName()
        {
            Random random = new Random();
            int index;

            List<string> names = new List<string>(PossibleNames);

            index = random.Next(names.Count);

            return names[index];
        }

        /// <summary>
        /// For statistics collection purposes only.  Doesn't take into account trump, unlike countVoidSuits.
        /// </summary>
        /// <returns>number of void suits</returns>
        private int GetNumVoids()
        {
            int result = 0;
            foreach (Suit suit in SortedHand.Keys)
            {
                if (SortedHand[suit].Count == 0)
                {
                    result++;
                }
            }
            return result;
        }

        /// <summary>
        /// initialize round variables
        /// </summary>
        private void InitializeRound()
        {
            TrumpScores.Clear();
            HighCards.Clear();
            LowCards.Clear();
            LoneAcesOrNines = 0;
            FirstPartnerBid = null;
            SecondPartnerBid = null;
            SortedHand = SortHandIntoSuits(Trump.High);
            Breakdowns.Clear();
            Game.CurrentBid = null;
        }

        private void EndRound()
        {
            // if (TRACK_BOT_STATS)
            // {
            //     int trickDifferential = 0;
            //     if (finalBreakdown.wonBid == 'Y')
            //     {
            //         if (game.highBid.isShoot()) trickDifferential = game.tricks[team] - 8;
            //         else trickDifferential = game.tricks[team] - game.highBid.Number;
            //     }
            //     finalBreakdown.trickDifferential = trickDifferential;
            // }
        }

        private void EndTrick()
        {
            // if (TRACK_BOT_STATS)
            // {
            //     int winnerPosition = game.highCard.player.position;
            //     if (winnerPosition == position) finalBreakdown.tricksWon++;
            //     else if (winnerPosition == finalBreakdown.partner1position) finalBreakdown.partner1TricksWon++;
            //     else if (winnerPosition == finalBreakdown.partner2position) finalBreakdown.partner2TricksWon++;
            // }
        }

        private void DeferNotification(Notification notification)
        {
            Console.WriteLine($"Deferring: {notification}");
            Thread.Sleep(100);
            notificationQueue.Enqueue(notification);
            ProcessMessage(notificationQueue.Dequeue());
        }

        private void ProcessMessage(Notification notification)
        {
            uint seat;
            uint fromSeat;
            uint toSeat;
            Card card;
            Card leadCard;

            Console.WriteLine($"ProcessMessage: {notification}");

            switch (notification.NotificationCase)
            {
                case Notification.NotificationOneofCase.JoinResponse:
                    System.Console.WriteLine("BOT: Received Join Response");
                    var token = notification.JoinResponse.Token;
                    _grpcMetadata.Add("x-game-token", token);
                    GameSettings gameSettings = GameSettings.GamePresets["TWOPLAYER"];
                    Game = new Game(gameSettings);
                    break;
                case Notification.NotificationOneofCase.Hand:
                    System.Console.WriteLine("BOT: RECEIVED HAND");
                    List<ShootTheMoon.Network.Proto.Card> protoHand;
                    Hand.Clear();
                    protoHand = notification.Hand.Hand_.ToList();
                    foreach (ShootTheMoon.Network.Proto.Card protoCard in protoHand)
                    {
                        Hand.Add(Card.FromProto(protoCard));
                    }
                    InitializeRound();

                    break;

                case Notification.NotificationOneofCase.BidRequest:
                    System.Console.WriteLine("BOT: RECEIVED BID REQUEST");
                    // Make sure we've received a hand before choosing a bid
                    if (Hand == null)
                    {
                        DeferNotification(notification);
                        break;
                    }
                    CurrentStatus = Status.CHOOSING_BID;
                    ShootTheMoon.Network.Proto.Bid myBid = Bid.toProto(DecideBid());
                    _grpcClient.CreateBid(myBid, _grpcMetadata);
                    break;

                case Notification.NotificationOneofCase.BidList:
                    System.Console.WriteLine("BOT: RECEIVED BID LIST");
                    List<ShootTheMoon.Network.Proto.Bid> protoBids;
                    protoBids = notification.BidList.Bids.ToList();
                    Bids = new Dictionary<uint, Bid>();
                    Bid bid = null;

                    foreach (ShootTheMoon.Network.Proto.Bid protoBid in protoBids)
                    {
                        bid = Bid.fromProto(protoBid);
                        Bids.Add(protoBid.Seat, bid);
                        if (SameTeam(protoBid.Seat, Seat) && protoBid.Seat != Seat)
                        {
                            if (FirstPartnerBid == null)
                            {
                                FirstPartnerBid = bid;
                            }
                            else
                            {
                                SecondPartnerBid = bid;
                            }
                        }
                    }
                    break;

                case Notification.NotificationOneofCase.TrumpUpdate:
                    Game.CurrentTrump = Trump.fromProto(notification.TrumpUpdate.Trump);
                    Tracker.InitializeRound();
                    Tracker.CurrentTrump = Game.CurrentTrump;
                    Tracker.AdjustForTrump(Game.CurrentTrump);
                    SortedHand = SortHandIntoSuits(Game.CurrentTrump);

                    // if (TRACK_BOT_STATS)
                    // {
                    //     finalBreakdown.tricksBidByWinner = game.highBid.Number;
                    //     if (game.highBid.bidder.Equals(this)) finalBreakdown.wonBid = 'Y';
                    //     else finalBreakdown.wonBid = 'N';
                    // }
                    break;

                case Notification.NotificationOneofCase.PlayCardRequest:
                    seat = notification.PlayCardRequest.Seat;
                    card = null;
                    leadCard = null;
                    if (Game.LeadCard != null) leadCard = Card.FromProto(Game.LeadCard.Card);
                    if (seat == Seat)
                    {
                        card = DecideCard(GetLegalCards(Hand, leadCard, Game.CurrentTrump));
                        _grpcClient.PlayCard(Card.ToProto(card), _grpcMetadata);
                    }
                    break;

                case Notification.NotificationOneofCase.SeatList:
                    List<SeatDetails> seats = notification.SeatList.Seats.ToList();
                    if (!Seated)
                    {
                        foreach (SeatDetails seatDetails in seats)
                        {
                            if (seatDetails.Empty)
                            {
                                TakeSeatRequest takeSeatRequest = new TakeSeatRequest();
                                takeSeatRequest.Seat = seatDetails.Seat;
                                StatusResponse takeSeatStatusResponse = _grpcClient.TakeSeat(takeSeatRequest, _grpcMetadata);
                                if (takeSeatStatusResponse.Success)
                                {
                                    Seated = true;
                                    Seat = takeSeatRequest.Seat;
                                    break;
                                }
                            }
                        }

                        SetReadyStatusRequest setReadyStatusRequest = new SetReadyStatusRequest();
                        setReadyStatusRequest.Ready = true;
                        StatusResponse setReadyStatusResponse = _grpcClient.SetReadyStatus(setReadyStatusRequest, _grpcMetadata);
                    }

                    break;

                case Notification.NotificationOneofCase.TransferRequest:
                    toSeat = notification.TransferRequest.ToSeat;
                    fromSeat = notification.TransferRequest.FromSeat;
                    if (fromSeat == Seat)
                    {
                        card = DecideTransferCard();
                        if (card == null) card = PickLowestCard(); // TODO: This could be improved. Shouldn't happen often though.
                        Transfer transfer = new Transfer();
                        transfer.FromSeat = fromSeat;
                        transfer.ToSeat = toSeat;
                        transfer.Card = Card.ToProto(card);
                        _grpcClient.TransferCard(transfer, _grpcMetadata);
                    }
                    break;

                case Notification.NotificationOneofCase.TransferComplete:
                    fromSeat = notification.TransferComplete.FromSeat;
                    toSeat = notification.TransferComplete.ToSeat;
                    // if (fromSeat == Seat) // check if giving away a card
                    // {
                    //     SortedHand[card.EffectiveSuit(Game.CurrentTrump)].Remove(card);
                    // }
                    // else
                    // {
                    //     if (toSeat == Seat) // check if receiving a card
                    //     {
                    //         SortedHand[card.EffectiveSuit(Game.CurrentTrump)].Add(card);
                    //     }
                    // }
                    break;

                case Notification.NotificationOneofCase.ThrowawayRequest:
                    card = PickLowestCard();
                    // System.Threading.Thread.Sleep(THROWAWAY_DELAY);
                    _grpcClient.ThrowawayCard(Card.ToProto(card), _grpcMetadata);
                    break;

                case Notification.NotificationOneofCase.PlayedCards:
                    List<ShootTheMoon.Network.Proto.PlayedCard> playedCards = notification.PlayedCards.Cards.ToList();
                    if (playedCards.Count == 0) Game.LeadCard = null;
                    foreach (ShootTheMoon.Network.Proto.PlayedCard playedCard in playedCards)
                    {
                        if (playedCard.Order == 0) Game.LeadCard = playedCard;
                        //TODO: check if this is adding duplicates
                        Tracker.PlayCard(Card.FromProto(playedCard.Card), (int)playedCard.Seat);
                    }
                    break;

                // case "CONFIRMTHROWAWAY":
                //     playerIndex = int.Parse(content.Substring(0, 1));
                //     bool finished = int.Parse(content.Substring(1, 1)) == 1;

                //     if (content.Length > 2 && playerIndex == position) // these two predicates should be equivalent
                //     {
                //         // server sent us the card info
                //         card = Card.FromString(content.Substring(2, 2));
                //         //hand.Remove(card); // taken care of by the server
                //         sortedHand[card.EffectiveSuit(game.CurrentTrump)].Remove(card);
                //     }

                //     if (!finished) // throw away another card if not finished
                //     {
                //         card = PickLowestCard();
                //         sendMessageToServer("<THROWAWAYCARD>" + card.ToString());
                //     }
                //     break;

                default:
                    // if (ServerMain.CONSOLE_OUTPUT_ON) System.Console.WriteLine("ER " + name + ":\t" + "Didn't understand message.");
                    break;
            }
        }

        #region Bidding Phase Methods
        /// <summary>
        /// decide what to bid based on cards and previous bids, etc.  highest level - utilizes evaluateTrump and applyBidBonus.
        /// </summary>
        /// <returns>Bot's bid</returns>
        private Bid DecideBid()
        {
            Bid highBid = Game.CurrentBid;
            Trump bestTrump = null;
            double bestTrumpBid = 0;
            double score = 0;

            // if (DEBUG_MODE_BIDDING)
            // {
            //     printHand();
            // }

            foreach (Suit suit in Suit.Suits.Values)
            {
                HighCards.Add(new Card(suit, Rank.Ace));
                HighCards.Add(new Card(suit, Rank.Ace));
            }
            foreach (Suit suit in Suit.Suits.Values)
            {
                LowCards.Add(new Card(suit, Rank.Nine));
                LowCards.Add(new Card(suit, Rank.Nine));
            }

            foreach (Trump trump in Trump.Trumps.Values)
            {
                // if (TRACK_BOT_STATS)
                // {
                //     breakdowns.Add(trump, new HandBreakdown());
                //     breakdowns[trump].bidPosition = position;
                // }

                score = this.EvaluateTrump(trump);

                TrumpScores.Add(trump, score);
            }

            if (FirstPartnerBid != null && !FirstPartnerBid.isPass())
            {
                foreach (Trump trump in Trump.Trumps.Values)
                {
                    ApplyBidBonus(FirstPartnerBid, trump);

                    // if (TRACK_BOT_STATS)
                    // {
                    //     breakdowns[trump].partner1TricksBid = firstPartnerBid.Number;
                    //     if (!firstPartnerBid.isPass()) breakdowns[trump].partner1Trump = firstPartnerBid.Trump.ToString();
                    //     breakdowns[trump].partner1position = firstPartnerBid.bidder.position;
                    // }
                }
            }
            if (SecondPartnerBid != null && !SecondPartnerBid.isPass())
            {
                if (!FirstPartnerBid.isPass() && FirstPartnerBid.Trump.Equals(SecondPartnerBid.Trump))
                {
                    TrumpScores.Clear();
                }
                foreach (Trump trump in Trump.Trumps.Values)
                {
                    ApplyBidBonus(SecondPartnerBid, trump);

                    // if (TRACK_BOT_STATS)
                    // {
                    //     breakdowns[trump].partner2TricksBid = secondPartnerBid.Number;
                    //     if (!secondPartnerBid.isPass()) breakdowns[trump].partner2Trump = secondPartnerBid.Trump.ToString();
                    //     breakdowns[trump].partner2position = secondPartnerBid.bidder.position;
                    // }
                }
            }

            foreach (Trump trump in Trump.Trumps.Values)
            {
                // if last bidder and partner is winning the bid, no need to overbid.  this method is a little sloppy but it should work.
                if (highBid != null && SameTeam(highBid.Seat, Seat) && Game.Bids.Count == Game.GameSettings.NumPlayers - 1)
                    score = 0;
                else
                    score = TrumpScores[trump] * Profile.getAggressionFactor();

                if (score + LoneAcesOrNines * Profile.getOffsuitAceValue() >= Profile.getBidThreshold())
                {
                    // if (DEBUG_MODE_BIDDING)
                    // {
                    //     System.Console.WriteLine("\tSCORE OF " + score + " GREATER THAN BID THRESHOLD: BID = " + profile.getBidThreshold());
                    // }
                    score = Profile.getBidThreshold();
                }
                else if (SecondPartnerBid != null)
                {
                    score += LoneAcesOrNines * Profile.getOffsuitAceValue();
                //     if (DEBUG_MODE_BIDDING)
                //     {
                //         System.Console.WriteLine("\tLAST BIDDER - LONE ACES/NINES BONUS: " + loneAcesOrNines);
                //     }
                }

                if (bestTrump == null || score > bestTrumpBid)
                {
                    if (trump.isSuit() || HIGH_LOW_BIDDING_ENABLED)
                    {
                        bestTrump = trump;
                        bestTrumpBid = score;
                    }
                }
            }

            // if (TRACK_BOT_STATS)
            // {
            //     finalBreakdown = breakdowns[bestTrump];
            //     finalBreakdown.trump = bestTrump.ToString();
            // }

            // Thread.Sleep(BID_DELAY);

            if (bestTrumpBid >= Profile.getShootThreshold())
            {
                return Bid.makeShootBid(Seat, (uint)Game.NextShootNum, bestTrump);
            }

            if (highBid == null || highBid.isPass() || (uint)bestTrumpBid > highBid.Number)
            {
                // if (DEBUG_MODE_BIDDING)
                // {
                //     System.Console.WriteLine("Bid " + (int)bestTrumpBid + " " + bestTrump.ToString());
                // }
                return Bid.makeNormalBid(Seat, (uint)bestTrumpBid, bestTrump);
            }
            else
            {
                // if (DEBUG_MODE_BIDDING)
                // {
                //     System.Console.WriteLine("Pass");
                // }
                return Bid.makePassBid(Seat);
            }
        }

        /// <summary>
        /// take into account partners' bids.  run once for each partner for each trump.
        /// </summary>
        /// <param name="partnerBid">partner's bid</param>
        /// <param name="contemplatedTrump">trump being considered</param>
        private void ApplyBidBonus(Bid partnerBid, Trump contemplatedTrump)
        {
            Trump partnerTrump = partnerBid.Trump;
            uint partnerQty = partnerBid.Number;
            double currentScore = 0;
            int scoreModifier = 0;

            if (TrumpScores.ContainsKey(contemplatedTrump))
            {
                currentScore = TrumpScores[contemplatedTrump];
            }

            if (partnerBid.isShoot()) partnerQty = 1;

            scoreModifier += (int)(partnerQty * Profile.getPartnerBidMultiplier(partnerTrump, contemplatedTrump));

            currentScore += scoreModifier;
            TrumpScores[contemplatedTrump] = currentScore;
            //trumpScores.Add(contemplatedTrump, currentScore);
        }

        /// <summary>
        /// consider one type of trump and estimate how many tricks the bot could get.  mid-level method - uses scoreCard and countVoidSuits, etc.
        /// </summary>
        /// <param name="trump">trump to evaluate</param>
        /// <returns>number of tricks we could expect to win</returns>
        private double EvaluateTrump(Trump trump)
        {
            double score = 0;
            //int trumpCount = 0;
            SortedHand = SortHandIntoSuits(trump);

            int voidSuits = CountVoidSuits(trump);
            // if (TRACK_BOT_STATS) breakdowns[trump].voidSuits = voidSuits;

            // if (DEBUG_MODE_BIDDING)
            // {
            //     System.Console.WriteLine("\nEvaluate " + trump.ToString() + ":");
            // }

            if (TrumpScores.ContainsKey(trump))
            {
                score = TrumpScores[trump];
            }
            // if (DEBUG_MODE_BIDDING)
            // {
            //     System.Console.WriteLine("Starting at " + score);
            // }

            foreach (Suit suit in Suit.Suits.Values)
            {
                LoneAcesOrNines = 0;
                foreach (Card card in SortedHand[suit])
                {
                    score += ScoreCard(trump, card);
                    //				if(trump.isSuit() && card.EffectiveSuit(trump).Equals(trump.Suit)){
                    //					trumpCount += 1;
                    //				}
                }
            }

            //		score += trumpCount * TRUMP_COUNT_MULTIPLIER;
            //		if(DEBUG_MODE_BIDDING){
            //			System.Console.WriteLine("\tTRUMP QUANTITY BONUS: +" + trumpCount * TRUMP_COUNT_MULTIPLIER);
            //		}

            score += Profile.getVoidBonus(voidSuits);
            // if (DEBUG_MODE_BIDDING)
            // {
            //     System.Console.WriteLine("\tVOID SUIT BONUS: +" + profile.getVoidBonus(voidSuits));
            // }

            //if (score >= profile.getShootThreshold())
            //{
            //    score = 9;
            //    if (DEBUG_MODE_BIDDING)
            //    {
            //        System.Console.WriteLine("REACHED SHOOT THRESHOLD IN " + trump.ToString());
            //    }
            //}

            // if (DEBUG_MODE_BIDDING)
            // {
            //     System.Console.WriteLine("Final score for " + trump.ToString() + ": " + score);
            // }
            return score;
        }

        /// <summary>
        /// Evaluate a single card based on the trump being considered.  To be used as part of evaluateTrump.
        /// </summary>
        /// <param name="trump">trump being considered</param>
        /// <param name="card">card being evaluated</param>
        /// <returns>expected number of tricks this card could win (presumably [0-1])</returns>
        private double ScoreCard(Trump trump, Card card)
        {
            ContextualRank cRank = card.EffectiveRank(trump);
            Suit cSuit = card.EffectiveSuit(trump);
            double score = 0;

            if (trump.isSuit())
            {
                if (trump.Suit.Equals(cSuit))
                {
                    score = Profile.getTrumpCardValue(cRank);

                    // if (TRACK_BOT_STATS)
                    // {
                    //     if (cRank.Equals(ContextualRank.RIGHT)) breakdowns[trump].rightBowers++;
                    //     else if (cRank.Equals(ContextualRank.LEFT)) breakdowns[trump].leftBowers++;
                    //     else if (cRank.Equals(ContextualRank.ACE)) breakdowns[trump].trumpAces++;
                    //     breakdowns[trump].trumpTotal++;
                    // }
                }
                else // not trump
                {
                    if (cRank.Equals(ContextualRank.ACE))
                    {
                        if (SortedHand[card.Suit].Count > 1) //make sure isn't lone Ace
                        {
                            score = Profile.getBestCardValue(trump, card.Suit);

                            // if (TRACK_BOT_STATS)
                            // {
                            //     if (card.EffectiveSuit(trump).Equals(trump.Suit.getSameColourSuit()))
                            //         breakdowns[trump].sameColourAces++;
                            //     else breakdowns[trump].otherColourAces++;
                            // }
                        }
                        else
                        {
                            LoneAcesOrNines++;

                            // if (TRACK_BOT_STATS) breakdowns[trump].loneAces++;
                        }
                    }
                }
            }
            else
            {
                if (trump.Equals(Trump.High))
                {
                    /**
                     * This section is used to track how many high cards in a row the player has. (AAK, etc)
                     */
                    if (HighCards.Contains(card))
                    {
                        HighCards.Remove(card);
                        if (cRank.Equals(ContextualRank.ACE) && !(SortedHand[card.Suit].Count > 1)) // lone ace
                        {
                            LoneAcesOrNines += 1;

                            // if (TRACK_BOT_STATS) breakdowns[trump].loneAces++;
                        }
                        else
                        {
                            score = Profile.getBestCardValue(trump, card.Suit);

                            // if (TRACK_BOT_STATS) breakdowns[trump].runLength++;
                        }
                        if (!HighCards.Contains(card) && !card.Rank.Equals(Rank.Nine)) // refill high cards list
                        {
                            Card newCard = new Card(card.Suit, Rank.Ranks[card.Rank.Value - 1 - 9]);
                            HighCards.Add(newCard);
                            HighCards.Add(newCard);
                        }
                    }
                }
                else if (trump.Equals(Trump.Low))
                {
                    /**
                     * This section is used to track how many high cards in a row the player has. (AAK, etc)
                     */
                    if (LowCards.Contains(card))
                    {
                        LowCards.Remove(card);
                        if (cRank.Equals(ContextualRank.NINE) && !(SortedHand[card.Suit].Count > 1))
                        {
                            LoneAcesOrNines += 1;

                            // if (TRACK_BOT_STATS) breakdowns[trump].loneAces++;
                        }
                        else
                        {
                            score = Profile.getBestCardValue(trump, card.Suit);

                            // if (TRACK_BOT_STATS) breakdowns[trump].runLength++;
                        }
                        if (!LowCards.Contains(card) && !card.Rank.Equals(Rank.Ace))
                        {
                            Card newCard = new Card(card.Suit, Rank.Ranks[card.Rank.Value + 1 - 9]);
                            LowCards.Add(newCard);
                            LowCards.Add(newCard);
                        }
                    }
                }
            }

            // if (DEBUG_MODE_BIDDING && score > 0)
            // {
            //     System.Console.WriteLine(card.Rank.getFullName() + " of " + card.Suit.ToString() + ": +" + score);
            // }
            return score;
        }

        /// <summary>
        /// count the number of void suits in bot's hand, taking into account a prospective trump.
        /// *note* sortHandIntoSuits should be called first.  is that a problem?
        /// </summary>
        /// <param name="contemplatedTrump">trump being considered</param>
        /// <returns>number of void suits</returns>
        private int CountVoidSuits(Trump contemplatedTrump)
        {
            int voidCount = 0;

            foreach (Suit suit in SortedHand.Keys)
            {
                if (SortedHand[suit].Count == 0 && contemplatedTrump.isSuit()
                        && !suit.Equals(contemplatedTrump.Suit))
                {
                    voidCount += 1;
                }
            }

            return voidCount;
        }
        #endregion

        /// <summary>
        /// find highest available card in hand, based on lead card
        /// </summary>
        /// <returns>highest card in hand</returns>
        private Card PickHighestCard()
        {
            Trump trump = Game.CurrentTrump; // get what trump is
            Suit suit = Card.FromProto(Game.LeadCard.Card).EffectiveSuit(trump); // start with the suit that was lead
            List<Card> cardsInSuit = SortedHand[suit]; // get cards that follow suit

            // must follow suit if able, so return the highest card
            if (cardsInSuit.Count > 0)
            {
                return cardsInSuit[0]; // sorted in descending order, so 0 is highest
            }

            // doesn't need to follow suit, so return lowest trump if available
            if (trump.isSuit() && !trump.Suit.Equals(suit) && SortedHand[trump.Suit].Count > 0)
            {
                suit = trump.Suit;
                cardsInSuit = SortedHand[suit];
                return cardsInSuit[cardsInSuit.Count - 1];
            }

            // if can't follow suit and can't play trump, return null
            return null;
        }

        /// <summary>
        /// find lowest available card in hand.  Not to be used to find best card in Low trump.
        /// </summary>
        /// <returns>lowest card in hand</returns>
        private Card PickLowestCard()
        {
            List<Card> cardsInSuit;
            int score;
            int highestScore = -1;
            Dictionary<Suit, int> suitScores;
            List<Suit> candidateSuits = new List<Suit>();
            List<Card> candidateCards;
            Random random = new Random();
            int suitChooser;

            if (Game.LeadCard != null)
            {
                cardsInSuit = SortedHand[Card.FromProto(Game.LeadCard.Card).EffectiveSuit(Game.CurrentTrump)]; // get cards that follow suit

                // must follow suit if able, so return the lowest card
                if (cardsInSuit.Count > 0)
                {
                    return cardsInSuit[cardsInSuit.Count - 1]; // sorted in descending order, so last is lowest
                }
            }

            suitScores = ScoreSuitsForThrowaway();
            foreach (Suit suit in Suit.Suits.Values)
            {
                score = suitScores[suit];

                if (score > highestScore)
                {
                    highestScore = score;
                    candidateSuits.Clear();
                    candidateSuits.Add(suit);
                }
                else if (score == highestScore)
                {
                    candidateSuits.Add(suit);
                }
            }

            if (candidateSuits.Count == 1)
            { // there is a clear winner, so take from that suit
                candidateCards = SortedHand[candidateSuits[0]];
            }
            else
            {
                suitChooser = Math.Abs(random.Next()) % candidateSuits.Count;
                candidateCards = SortedHand[candidateSuits[suitChooser]];
            }

            return candidateCards[candidateCards.Count - 1]; // return lowest card
        }

        /// <summary>
        /// Score suits to find best card to throw away.
        /// 6: single low card
        /// 5: multiple low cards
        /// 4: highest card with multiple backup
        /// 3: highest card without backup
        /// 2: highest card with one backup
        /// 1: suit is trump
        /// 0: no cards in suit
        /// </summary>
        /// <returns>Dictionary containing scores for each suit</returns>
        private Dictionary<Suit, int> ScoreSuitsForThrowaway()
        {
            Trump trump = Game.CurrentTrump;
            List<Card> candidateSuit;
            Card highestCard;
            Dictionary<Suit, int> suitScores = new Dictionary<Suit, int>();
            int score = -1;

            foreach (Suit suit in Suit.Suits.Values)
            {
                candidateSuit = SortedHand[suit];

                if (candidateSuit.Count == 0)
                {
                    score = 0;
                }
                else if (trump.isSuit() && trump.Suit.Equals(suit))
                {
                    score = 1;
                }
                else
                {
                    highestCard = candidateSuit[0];

                    if (Tracker.IsHighest(highestCard))
                    {
                        if (candidateSuit.Count == 1) score = 3;
                        if (candidateSuit.Count == 2) score = 2;
                        if (candidateSuit.Count > 2) score = 4;
                    }
                    else
                    {
                        if (candidateSuit.Count == 1) score = 6;
                        if (candidateSuit.Count > 1) score = 5;
                    }
                }
                suitScores.Add(suit, score);
            }
            return suitScores;
        }

        /// <summary>
        /// Score suits to find best suit to lead.
        /// 10: highest trump
        /// 9: lone opposite colour highest card
        /// 8: lone unique opposite colour highest card
        /// 7: lone same colour highest card
        /// 6: lone unique same colour highest card
        /// 5: opposite colour highest card w/ backup
        /// 4: unique opposite colour highest card w/ backup
        /// 3: same colour highest card w/ backup
        /// 2: unique same colour highest card w/ backup
        /// 1: nothing useful
        /// 0: no cards in suit
        /// NOTE: unique means there is only one of that card left between all hands
        ///       lone means there is only one of that suit in player's hand
        /// </summary>
        /// <returns>Dictionary containing score for each suit</returns>
        private Dictionary<Suit, int> ScoreSuitsForLead()
        {
            Trump trump = Game.CurrentTrump;
            List<Card> candidateSuit;
            Card candidate;
            Dictionary<Suit, int> suitScores = new Dictionary<Suit, int>();
            int score = -1;

            foreach (Suit suit in Suit.Suits.Values)
            {
                candidateSuit = SortedHand[suit];

                if (candidateSuit.Count == 0)
                {
                    score = 0;
                }
                else
                {
                    candidate = candidateSuit[0];

                    if (trump.isSuit() && suit.Equals(trump.Suit))
                    { // candidate suit is trump
                        if (Tracker.IsHighest(candidate))
                        { // highest trump
                            score = 10;
                        }
                        else
                        {
                            score = 1;
                        }
                    }
                    else
                    {
                        if (Tracker.IsHighest(candidate))
                        { // is highest
                            if (trump.isSuit() && candidateSuit.Count == 1)
                            { // is lone
                                if (!Tracker.IsLone(candidate))
                                { // is unique
                                    if (trump.isSuit() && trump.SameColour.Equals(suit))
                                    { // is same colour
                                        score = 6;
                                    }
                                    else
                                    { // opposite colour
                                        score = 8;
                                    }
                                }
                                else
                                { // non-unique
                                    if (trump.isSuit() && trump.SameColour.Equals(suit))
                                    { // is same colour
                                        score = 7;
                                    }
                                    else
                                    { // opposite colour
                                        score = 9;
                                    }
                                }
                            }
                            else
                            { // is not lone
                                if (!Tracker.IsLone(candidate))
                                { // is unique
                                    if (trump.isSuit() && trump.SameColour.Equals(suit))
                                    { // is same colour
                                        score = 2;
                                    }
                                    else
                                    { // opposite colour
                                        score = 4;
                                    }
                                }
                                else
                                { // non-unique
                                    if (trump.isSuit() && trump.SameColour.Equals(suit))
                                    { // is same colour
                                        score = 3;
                                    }
                                    else
                                    { // opposite colour
                                        score = 5;
                                    }
                                }
                            }
                        }
                        else
                        {
                            score = 1;
                        }
                    }
                }

                suitScores.Add(suit, score);
            }

            return suitScores;
        }

        /// <summary>
        /// Choose a card to lead
        /// </summary>
        /// <returns>best card in hand to lead</returns>
        private Card PickCardToLead()
        {
            int score;
            int highestScore = -1;
            Dictionary<Suit, int> suitScores = ScoreSuitsForLead();
            List<Suit> candidateSuits = new List<Suit>();
            List<Card> candidateCards;
            Random random = new Random();
            int suitChooser;

            foreach (Suit suit in Suit.Suits.Values)
            {
                score = suitScores[suit];

                if (score > highestScore)
                {
                    highestScore = score;
                    candidateSuits.Clear();
                    candidateSuits.Add(suit);
                }
                else if (score == highestScore)
                {
                    candidateSuits.Add(suit);
                }
            }

            if (highestScore == 1)
            {
                // if (DEBUG_MODE_PLAYING)
                // {
                //     System.Console.WriteLine("No good card to lead - pick lowest to throw away.");
                // }
                return null; // no cards are high so leave it to PickLowestCard
            }

            if (candidateSuits.Count == 1)
            { // there is a clear winner, so return the highest card in that suit
                candidateCards = SortedHand[candidateSuits[0]];
            }
            else
            {
                suitChooser = Math.Abs(random.Next()) % candidateSuits.Count;
                candidateCards = SortedHand[candidateSuits[suitChooser]];
            }

            // if (DEBUG_MODE_PLAYING)
            // {
            //     System.Console.WriteLine("Found card to lead.");
            // }
            return candidateCards[0]; // return highest card
        }

        /// <summary>
        /// Print sorted hand for debug purposes
        /// </summary>
        private void PrintSortedHand()
        {
            System.Console.WriteLine("Current Hand:");
            foreach (List<Card> cards in SortedHand.Values)
            {
                if (cards.Count > 0)
                {
                    System.Console.WriteLine("\t" + cards[0].Suit.ToString() + ":");
                }
                foreach (Card card in cards)
                {
                    System.Console.WriteLine(" " + card.Rank.ShortName);
                }
                System.Console.WriteLine();
            }
        }

        /// <summary>
        /// find lowest card in hand that will win the trick
        /// </summary>
        /// <param name="cardToBeat">currently winning card</param>
        /// <returns>a card that can minimally beat the currently winning card</returns>
        private Card FindLowestWinningCard(List<Card> legalCards, Card cardToBeat)
        {
            Trump trump = Game.CurrentTrump;
            Suit suitLead = Card.FromProto(Game.LeadCard.Card).EffectiveSuit(trump);
            Card chosenCard = null;

            foreach (Card card in legalCards)
            {
                if (IsCardBetter(cardToBeat, card, trump, suitLead)
                        && (chosenCard == null || IsCardBetter(card, chosenCard, trump, suitLead)))
                {
                    chosenCard = card;
                }
            }

            return chosenCard; // may be null, in which case can't beat cardToBeat
        }

        /// <summary>
        /// decide which card to play - highest level.
        /// </summary>
        /// <returns>the card chosen</returns>
        private Card DecideCard(List<Card> legalCards)
        {
            bool isLeader = Game.LeadCard == null;
            Card cardToPlay = null;
            Trump trump = Game.CurrentTrump;

            // if (DEBUG_MODE_PLAYING)
            // {
            //     PrintSortedHand();
            //     System.Console.WriteLine("Deciding card...");
            // }

            if (isLeader)
            {
                cardToPlay = PickCardToLead();
                if (cardToPlay == null)
                {
                    cardToPlay = PickLowestCard();
                }
            }
            else
            {
                Card winningCard = Tracker.BestInCurrentTrick;
                bool teamIsWinning = SameTeam(Seat, (uint)Tracker.WinnerOfCurrentTrick);
                bool winningCardIsHighestInSuit = Tracker.IsHighestExcluding(winningCard, SortedHand);
                if (teamIsWinning && (winningCardIsHighestInSuit || (trump.isSuit() && winningCard.EffectiveSuit(trump).Equals(trump.Suit))))
                {
                    cardToPlay = PickLowestCard();
                    // if (DEBUG_MODE_PLAYING)
                    // {
                    //     System.Console.WriteLine("throwing off - team is winning.");
                    // }
                }
                else
                {
                    if (Tracker.PlaysLast(Seat, Game.GameSettings.NumPlayers))
                    { // beat with lowest winning card
                        cardToPlay = FindLowestWinningCard(legalCards, winningCard);
                        // if (DEBUG_MODE_PLAYING)
                        // {
                        //     System.Console.WriteLine("last player - using lowest winning card if possible...");
                        // }
                    }
                    else
                    {
                        cardToPlay = PickHighestCard();
                    }
                    if (cardToPlay == null)
                    {
                        cardToPlay = PickLowestCard();
                    }
                    if (!IsCardBetter(winningCard, cardToPlay, trump, Card.FromProto(Game.LeadCard.Card).EffectiveSuit(trump)))
                    {
                        cardToPlay = PickLowestCard();
                        // if (DEBUG_MODE_PLAYING)
                        // {
                        //     System.Console.WriteLine("throwing off.");
                        // }
                    }
                    else
                    {
                        // if (DEBUG_MODE_PLAYING)
                        // {
                        //     System.Console.WriteLine("trying to win.");
                        // }
                    }
                }
            }

            // Thread.Sleep(CARD_DELAY);

            SortedHand[cardToPlay.EffectiveSuit(trump)].Remove(cardToPlay);
            return cardToPlay;
        }

        /// <summary>
        /// sort the unsorted hand into different suits (in order within the suit).  Note - trump may not be fixed yet, so use parameter.
        /// </summary>
        /// <returns>Dictionary containing cards by suit</returns>
        private Dictionary<Suit, List<Card>> SortHandIntoSuits(Trump trump)
        {
            Dictionary<Suit, List<Card>> result = new Dictionary<Suit, List<Card>>();
            List<Card> oneSuitsWorth = new List<Card>();

            foreach (Suit suit in Suit.Suits.Values)
            {
                oneSuitsWorth = GetCardsOfContextualSuit(Hand, suit, trump);
                oneSuitsWorth = SortSuit(oneSuitsWorth, trump);
                result.Add(suit, oneSuitsWorth);
            }

            return result;
        }

        /// <summary>
        /// Sort the cards of one suit in descending order. Note - trump may not be fixed yet, so use parameter.
        /// </summary>
        /// <param name="unsortedHand">a list of cards of the same suit</param>
        /// <param name="trump">trump to account for</param>
        /// <returns>an ordered list of cards</returns>
        private List<Card> SortSuit(List<Card> unsortedHand, Trump trump)
        {

            List<Card> sortedSuit = new List<Card>(unsortedHand);

            for (int i = 0; i < sortedSuit.Count; i++)
            {
                Card highestCard = sortedSuit[i];
                int highestCardSpot = i;
                for (int j = i + 1; j < sortedSuit.Count; j++)
                {
                    Card targetCard = sortedSuit[j];
                    if (IsCardBetter(highestCard, targetCard, trump, highestCard.Suit))
                    {
                        highestCard = targetCard;
                        highestCardSpot = j;
                    }
                }

                sortedSuit.RemoveAt(highestCardSpot);
                sortedSuit.Insert(i, highestCard);
            }
            return sortedSuit;
        }

        /// <summary>
        /// Choose a card to give to the person shooting.
        /// </summary>
        /// <returns>best card in hand</returns>
        private Card DecideTransferCard()
        {
            Trump trump = Game.CurrentTrump;

            Card transferCard = null;
            int candidateRank;
            int cardsInSuit;

            if (trump.isSuit())
            {
                Suit trumpSuit = trump.Suit;

                if (SortedHand[trumpSuit].Count > 0) return SortedHand[trumpSuit][0]; // Bot has trump, so return highest
            }

            foreach (Suit suit in SortedHand.Keys)
            {
                cardsInSuit = SortedHand[suit].Count;

                if (cardsInSuit > 0)
                {
                    candidateRank = SortedHand[suit][0].Rank.Value;

                    if (trump.Equals(Trump.Low))
                    {
                        if (transferCard == null || candidateRank < transferCard.Rank.Value)
                            transferCard = SortedHand[suit][0];
                    }
                    else
                    {
                        if (transferCard == null || candidateRank > transferCard.Rank.Value)
                            transferCard = SortedHand[suit][0];
                    }
                }
            }

            // Thread.Sleep(TRANSFER_DELAY);

            return transferCard;
        }

        /// <summary>
        /// print hand for debug purposes
        /// </summary>
        protected void PrintHand()
        {
            System.Console.WriteLine(Name + "'s Hand:");
            foreach (Card card in Hand)
            {
                System.Console.WriteLine(card.Rank.LongName + " of " + card.Suit);
            }
        }

        /// <summary>
        /// Find out whether a card is legal.
        /// </summary>
        /// <param name="hand">player's hand</param>
        /// <param name="card">card to test</param>
        /// <param name="leadCard">first card of trick</param>
        /// <param name="trump">current trump</param>
        /// <returns>true if card is allowed</returns>
        private static bool IsCardLegal(List<Card> hand, Card card,
                Card leadCard, Trump trump, out string reason)
        {
            Suit leadSuit = null;
            reason = string.Empty;

            if (leadCard != null)
            {
                leadSuit = leadCard.EffectiveSuit(trump);
            }
            // cardPlayed is illegal if it is not contained in hand
            if (!hand.Contains(card))
            {
                reason = "Card not in hand.";
                return false;
            }
            // if no card has been lead yet, then any card (as long as it
            // is in the hand) is legal
            if (leadSuit == null)
                return true;
            // if the suit lead is the same as the suit played, the card is always
            // legal
            if (leadSuit == card.EffectiveSuit(trump))
            {
                return true;
                // else if the CardList contains no cards of the suit lead, any card
                // is legal
            }
            else if (GetCardsOfContextualSuit(hand, leadSuit, trump).Count == 0)
            {
                return true;
                // otherwise the card is illegal
            }
            else
            {
                reason = "Card is the wrong suit.";
                return false;
            }
        }

        /*
         * Returns a new List<Card> containing all legal cards in a hand for a
         * given lead Card and trump
         */
        private static List<Card> GetLegalCards(List<Card> hand, Card leadCard,
                Trump trump)
        {
            string reason = string.Empty;

            List<Card> legalCards = new List<Card>();

            foreach (Card c in hand)
            {
                if (IsCardLegal(hand, c, leadCard, trump, out reason))
                {
                    legalCards.Add(c);
                }
            }

            return legalCards;
        }

        /// <summary>
        /// Determines whether or not one card would beat another in a trick
        /// </summary>
        /// <param name="c1">Card to compare to</param>
        /// <param name="c2">Card being played</param>
        /// <param name="trump">Current Trump</param>
        /// <param name="suitLead">Suit that was lead</param>
        /// <returns>true if c2 is strictly better than c1</returns>
        private static bool IsCardBetter(Card c1, Card c2, Trump trump,
                Suit suitLead)
        {
            // Case 1: The two cards are the same suit
            // if the two cards are the same suit, simply compare their contextual
            // ranks (with a reverse decision if the
            // trump is LOW
            if (c1.EffectiveSuit(trump) == c2.EffectiveSuit(trump))
            {
                if (trump == Trump.Low)
                {
                    return (c2.EffectiveRank(trump).Ranking < c1
                            .EffectiveRank(trump).Ranking);
                }
                else
                {
                    return (c2.EffectiveRank(trump).Ranking > c1
                            .EffectiveRank(trump).Ranking);
                }
            }
            // Case 2: Trump is a suit and the two cards played are different suits
            if (trump.isSuit())
            {
                // if c1 is a trump, c1 must win (since they do not have the same
                // suit)
                if (c1.EffectiveSuit(trump) == trump.Suit)
                {
                    return false;
                    // if c2 is a trump, c2 must win (since they do not have the
                    // same
                    // suit)
                }
                else if (c2.EffectiveSuit(trump) == trump.Suit)
                {
                    return true;
                    // at this point, we know that the trump is a suit, both cards
                    // are
                    // different suits, and neither is trump
                    // so if c1 is the suit that was lead, it must beat c2
                }
                else if (c1.EffectiveSuit(trump) == suitLead)
                {
                    return false;
                    // if c2 is of the suit lead, then it must beat c1
                }
                else if (c2.EffectiveSuit(trump) == suitLead)
                {
                    return true;
                    // otherwise, neither cards follow suit, say c1 wins
                }
                else
                {
                    return false;
                }
                // Case 3: Trump is not a suit and the two cards played are
                // different suits
            }
            else
            {
                // whichever card followed suit must win (since they are different
                // suits, and trump is not a suit)
                // so if c1 is the suit that was lead, it must beat c2
                if (c1.EffectiveSuit(trump) == suitLead)
                {
                    return false;
                    // if c2 is of the suit lead, then it must beat c1
                }
                else if (c2.EffectiveSuit(trump) == suitLead)
                {
                    return true;
                    // otherwise, neither cards follow suit, say c1 wins
                }
                else
                {
                    return false;
                }
            }
        }

        /**
         * Determine the Leech limit for a particular GameSettings. The leech limit
         * is defined to be the point at which if the other team only took half of
         * the tricks to make their contract, the team that didn't make the contract
         * would still win. In order to avoid this, a team cannot get any points
         * once their score is equal to or exceeds the leech limit for the game.
         * 
         * @param settings
         *            the settings of the game
         * @return the score at which a team can only receive points if they make
         *         the contract
         */
        private static int GetLeechLimit(GameSettings settings)
        {
            //int deckSize = settings.getDeckSize();
            //int numPlayers = settings.getNumPlayersPerTeam() * 2;

            //return deckSize - (deckSize / numPlayers) / 2;

            return 47;
        }

        private static bool IsBidLegal(GameSettings settings, Bid newBid, Bid lastHighestBid)
        {
            if (lastHighestBid == null)
            {
                if (newBid.isShoot() && newBid.ShootNumber != 1)
                {
                    return false;
                }
                else
                {
                    return true;
                }
            }

            // first check newBid is a legitimate bid on its own
            if (newBid.isNormalBid())
            {
                // return false if the bid is greater than the number of cards in
                // someone's hand
                if (newBid.Number > GetHandSize(settings))
                    return false;
            }

            // if the bid is a pass, it's always legal
            if (newBid.isPass())
                return true;
            // if the new bid is not better than the old bid, it isn't legal (since
            // we already took care of passes)
            if (!newBid.isBetterThan(lastHighestBid))
                return false;
            // make sure shoot numbers occur in right order (ie someone didn't go
            // straight to double shooting or someone didn't go from single shooting
            // to triple shooting)
            if (newBid.isShoot() && !lastHighestBid.isShoot())
            {
                if (newBid.ShootNumber == 1) return true;
                else return false;
            }
            else if (newBid.isShoot() && lastHighestBid.isShoot())
            {
                return (newBid.ShootNumber == lastHighestBid.ShootNumber + 1);
            }
            //all other cases the new bid is legal
            return true;

        }

        private static int GetHandSize(GameSettings settings)
        {
            return settings.getDeckSize()
                    / (settings.NumPlayersPerTeam * 2);
        }

        /// <summary>
        /// Return a new List<Card> containing all of the cards of a contextual suit
        /// given a list of cards and a particular trump context
        /// </summary>
        /// <param name="cardList">set of cards to filter</param>
        /// <param name="suit">suit to filter by</param>
        /// <param name="trump">current trump</param>
        /// <returns>filtered list of cards</returns>
        private static List<Card> GetCardsOfContextualSuit(List<Card> cardList, Suit suit, Trump trump)
        {
            List<Card> returnList = new List<Card>();

            foreach (Card c in cardList)
            {
                if (c.EffectiveSuit(trump).Equals(suit))
                {
                    returnList.Add(c);
                }
            }

            return returnList;
        }

        private class HandBreakdown
        {
            public int bidPosition = -1;

            public char wonBid = '-';
            public string trump = string.Empty;
            public int tricksBidByWinner = -1;
            public int tricksWon = 0;

            public int rightBowers = 0;
            public int leftBowers = 0;
            public int trumpAces = 0;
            public int trumpTotal = 0;
            public int sameColourAces = 0;
            public int otherColourAces = 0;

            public int loneAces = 0;
            public int voidSuits = 0;

            public int runLength = 0;

            public int trickDifferential = -1;

            public int partner1position = -1;
            public int partner1TricksBid = -1;
            public int partner1TricksWon = 0;
            public string partner1Trump = string.Empty;
            public int partner2position = -1;
            public int partner2TricksBid = -1;
            public int partner2TricksWon = 0;
            public string partner2Trump = string.Empty;
        }

        private class CardTracker
        {
            public List<Card> CardsLeft = new List<Card>();
            public List<Card> CardsPlayed = new List<Card>();
            public Dictionary<Suit, Card> BestCardsLeft = new Dictionary<Suit, Card>();
            public Dictionary<Suit, int> NumBestCardsLeft = new Dictionary<Suit, int>();
            public Dictionary<Suit, int> NumTotalCardsLeft = new Dictionary<Suit, int>();
            public Trump CurrentTrump;
            public Suit SuitLeadInCurrentTrick;
            public int LeadPositionInCurrentTrick;
            public Card BestInCurrentTrick;
            public int WinnerOfCurrentTrick;

            private const bool DEBUG_MODE = false;

            public void InitializeRound()
            {
                CardsLeft.Clear();
                CardsPlayed.Clear();
                BestCardsLeft.Clear();
                NumBestCardsLeft.Clear();
                NumTotalCardsLeft.Clear();
                CurrentTrump = null;

                foreach (Suit suit in Suit.Suits.Values)
                {
                    foreach (Rank rank in Rank.Ranks.Values)
                    {
                        CardsLeft.Add(new Card(suit, rank));
                        CardsLeft.Add(new Card(suit, rank));
                    }
                }
            }

            public void InitializeTrick()
            {
                SuitLeadInCurrentTrick = null;
                LeadPositionInCurrentTrick = -1;
                BestInCurrentTrick = null;
                WinnerOfCurrentTrick = -1;
            }

            public bool PlaysLast(uint seat, int players)
            {
                return (seat + 1) % (players) == LeadPositionInCurrentTrick;
            }

            public void PlayCard(Card card, int seat)
            {
                Suit cSuit = card.EffectiveSuit(CurrentTrump);
                ContextualRank cRank = card.EffectiveRank(CurrentTrump);
                Card newCard = null;
                Rank newRank = null;
                Suit newSuit = null;
                bool cardOK = false;
                int numCardsLeft;

                if (LeadPositionInCurrentTrick == -1)
                {
                    LeadPositionInCurrentTrick = seat;
                    SuitLeadInCurrentTrick = card.EffectiveSuit(CurrentTrump);
                }

                if (BestInCurrentTrick == null || IsCardBetter(BestInCurrentTrick, card, CurrentTrump, BestInCurrentTrick.EffectiveSuit(CurrentTrump)))
                {
                    BestInCurrentTrick = card;
                    WinnerOfCurrentTrick = seat;
                }

                CardsLeft.Remove(card);
                // if (DEBUG_MODE)
                // {
                //     System.Console.WriteLine(card.getRank().getShortName() + " of " + card.Suit.ToString() + " removed from Cards Left");
                // }
                CardsPlayed.Add(card);
                // if (DEBUG_MODE)
                // {
                //     System.Console.WriteLine(card.getRank().getShortName() + " of " + card.Suit.ToString() + " added to Cards Played");
                // }
                numCardsLeft = NumTotalCardsLeft[cSuit];
                NumTotalCardsLeft.Remove(cSuit);
                NumTotalCardsLeft.Add(cSuit, numCardsLeft - 1);
                if (NumTotalCardsLeft[cSuit] == 0)
                {
                    BestCardsLeft.Remove(cSuit);
                    NumBestCardsLeft.Remove(cSuit);
                    NumBestCardsLeft.Add(cSuit, 0);
                    return;
                }

                if (BestCardsLeft[cSuit].Equals(card))
                {
                    numCardsLeft = NumBestCardsLeft[cSuit];
                    NumBestCardsLeft.Remove(cSuit);
                    NumBestCardsLeft.Add(cSuit, numCardsLeft - 1);
                    // if (DEBUG_MODE)
                    // {
                    //     System.Console.WriteLine(card.getRank().getShortName() + " of " + card.Suit.ToString() + " removed from Best Cards Left");
                    // }

                    if (NumBestCardsLeft[cSuit] == 0)
                    {
                        while (!cardOK)
                        {
                            if (CurrentTrump.Equals(Trump.Low) && !cRank.Equals(ContextualRank.ACE))
                            { // trump is low
                                newRank = Rank.Ranks[cRank.Ranking + 1 - 9];
                                newSuit = cSuit;
                            }
                            else if ((CurrentTrump.Equals(Trump.High) || !cSuit.Equals(CurrentTrump.Suit)) && !cRank.Equals(ContextualRank.NINE))
                            { // trump is high or card isn't trump
                                if (CurrentTrump.isSuit() && CurrentTrump.Suit.Equals(CurrentTrump.SameColour) && cRank.Equals(ContextualRank.QUEEN))
                                {
                                    newRank = Rank.Ten;
                                }
                                else
                                {
                                    newRank = Rank.Ranks[cRank.Ranking - 1 - 9];
                                }
                                newSuit = cSuit;
                            }
                            else if (cSuit.Equals(CurrentTrump.Suit) && !cRank.Equals(ContextualRank.NINE))
                            { // card played is trump
                                if (cRank.Equals(ContextualRank.RIGHT))
                                {
                                    newRank = Rank.Jack;
                                    newSuit = CurrentTrump.SameColour;
                                }
                                else if (cRank.Equals(ContextualRank.LEFT))
                                {
                                    newRank = Rank.Ace;
                                    newSuit = cSuit;
                                }
                                else if (cRank.Equals(ContextualRank.ACE))
                                {
                                    newRank = Rank.King;
                                    newSuit = cSuit;
                                }
                                else if (cRank.Equals(ContextualRank.KING))
                                {
                                    newRank = Rank.Queen;
                                    newSuit = cSuit;
                                }
                                else if (cRank.Equals(ContextualRank.QUEEN))
                                {
                                    newRank = Rank.Ten;
                                    newSuit = cSuit;
                                }
                                else if (cRank.Equals(ContextualRank.TEN))
                                {
                                    newRank = Rank.Nine;
                                    newSuit = cSuit;
                                }
                                else
                                {
                                    return;
                                }
                            }
                            else
                            {
                                return;
                            }
                            newCard = new Card(newSuit, newRank);
                            if (!CardsLeft.Contains(newCard))
                            {
                                cRank = newCard.EffectiveRank(CurrentTrump);
                            }
                            else
                            {
                                cardOK = true;
                            }
                        }
                        BestCardsLeft.Remove(cSuit);
                        BestCardsLeft.Add(cSuit, newCard);
                        NumBestCardsLeft.Remove(cSuit);
                        NumBestCardsLeft.Add(cSuit, 2);
                        // if (DEBUG_MODE)
                        // {
                        //     System.Console.WriteLine(newCard.Rank.ShortName + " of " + newCard.Suit.ToString() + " added to Best Cards Left (x2)");
                        // }
                    }
                }
            }

            public void AdjustForTrump(Trump newTrump)
            {
                Rank rank;
                CurrentTrump = newTrump;

                foreach (Suit suit in Suit.Suits.Values)
                {
                    if (CurrentTrump.isSuit() && CurrentTrump.Suit.Equals(suit))
                    {
                        rank = Rank.Jack;
                        NumTotalCardsLeft.Add(suit, 14);
                    }
                    else if (CurrentTrump.isSuit() && CurrentTrump.Suit.Equals(CurrentTrump.SameColour))
                    {
                        rank = Rank.Ace;
                        NumTotalCardsLeft.Add(suit, 10);
                    }
                    else if (CurrentTrump.Equals(Trump.Low))
                    {
                        rank = Rank.Nine;
                        NumTotalCardsLeft.Add(suit, 12);
                    }
                    else
                    {
                        rank = Rank.Ace;
                        NumTotalCardsLeft.Add(suit, 12);
                    }

                    BestCardsLeft.Add(suit, new Card(suit, rank));
                    NumBestCardsLeft.Add(suit, 2);
                    // if (DEBUG_MODE)
                    // {
                    //     System.Console.WriteLine(rank.ShortName + " of " + suit.ToString() + " added to Best Cards Left (x2)");
                    // }
                }
            }

            public bool IsHighest(Card card)
            {
                if (BestCardsLeft[card.EffectiveSuit(CurrentTrump)].Equals(card))
                {
                    return true;
                }
                return false;
            }

            public bool IsHighestExcluding(Card card, Dictionary<Suit, List<Card>> excluded)
            { // sloppy
                Suit suit = card.EffectiveSuit(CurrentTrump);
                List<Card> adjustedCardsLeft = new List<Card>(CardsLeft);

                foreach (List<Card> cardsInSuit in excluded.Values)
                {
                    foreach (Card toRemove in cardsInSuit)
                    {
                        adjustedCardsLeft.Remove(toRemove);
                    }
                }
                foreach (Card candidate in adjustedCardsLeft)
                {
                    if (candidate.EffectiveSuit(CurrentTrump).Equals(suit) && IsCardBetter(card, candidate, CurrentTrump, SuitLeadInCurrentTrick))
                    {
                        return false;
                    }
                }
                return true;
            }

            public bool IsLone(Card card)
            {
                if (!CardsPlayed.Contains(card))
                {
                    return false;
                }
                return true;
            }

            public int CardsRemaining(Suit suit)
            { // could probably be optimised
                int result = 0;

                foreach (Card card in CardsLeft)
                {
                    if (card.Suit.Equals(suit))
                    {
                        result++;
                    }
                }

                return result;
            }
        }
    }
}
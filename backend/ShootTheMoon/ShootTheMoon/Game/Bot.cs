using System;
using System.Collections.Generic;
using System.Linq;
using Google.Protobuf.Collections;
using Grpc.Core;
using ShootTheMoon.Network.Proto;

namespace ShootTheMoon.Game
{
    public class Bot : Client
    {
        private ShootServer.ShootServerClient _grpcClient;

        public AsyncServerStreamingCall<Notification> NotificationStream  { get; set; }

        public Bot(ShootServer.ShootServerClient grpcClient) {
            _grpcClient = grpcClient;
        }

        public int id;

        private Dictionary<Trump, double> trumpScores = new Dictionary<Trump, double>();
        private Bid firstPartnerBid;
        private Bid secondPartnerBid;
        private Dictionary<Suit, List<Card>> sortedHand;
        private int loneAcesOrNines;
        private List<Card> highCards = new List<Card>();
        private List<Card> lowCards = new List<Card>();
        private BotProfile profile;

        private Dictionary<Trump, HandBreakdown> breakdowns = new Dictionary<Trump, HandBreakdown>();
        private HandBreakdown finalBreakdown;

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


        private static List<string> possibleNames;

        private static int nextBot = 0;

        const int BID_DELAY = 500;
        const int CARD_DELAY = 500;
        const int TRANSFER_DELAY = 500;
        const int THROWAWAY_DELAY = 500;

        private Game game = null;

        private string name = string.Empty;

        private List<Card> hand = null;

        private Dictionary<uint, Bid> bids = null;

        private Status status = Status.LOGIN_SCREEN;

        static Bot()
        {
            possibleNames = new List<string>(new string[] { "Alexander", "Genghis Khan", "Hannibal", "Louis IX", "Charlemagne", "Ivan III" });
        }

        public Bot(Game initGame, BotProfile initProfile)
        {
            id = Bot.nextBot++;
            game = initGame;
            name = GetRandomName();
            status = Status.PREGAME_READY;
            profile = initProfile;
        }

        /// <summary>
        /// Constructor for creating a new bot partway through a game.
        /// </summary>
        /// <param name="initGame">game to join</param>
        /// <param name="newHand">existing hand</param>
        public Bot(Game initGame, List<Card> newHand, BotProfile initProfile)
            : this(initGame, initProfile)
        {
            InitializeRound();
            hand = newHand;
        }

        private void AdjustForContext(Status newStatus)
        {
            finalBreakdown = new HandBreakdown();
            status = newStatus;

            if (game.CurrentTrump == null) sortedHand = SortHandIntoSuits(Trump.High);
            else sortedHand = SortHandIntoSuits(game.CurrentTrump);

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

            List<string> names = new List<string>(possibleNames);
            foreach (Client player in game.Players)
            {
                if (player != null && player.GetType() == typeof(Bot))
                {
                    names.Remove(player.Name);
                }
            }

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
            foreach (Suit suit in sortedHand.Keys)
            {
                if (sortedHand[suit].Count == 0)
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
            trumpScores.Clear();
            highCards.Clear();
            lowCards.Clear();
            loneAcesOrNines = 0;
            firstPartnerBid = null;
            secondPartnerBid = null;
            sortedHand = SortHandIntoSuits(Trump.High);
            breakdowns.Clear();
        }

        private void EndRound()
        {
            // if (TRACK_BOT_STATS)
            // {
            //     int trickDifferential = 0;
            //     if (finalBreakdown.wonBid == 'Y')
            //     {
            //         if (game.highBid.isShoot()) trickDifferential = game.tricks[team] - 8;
            //         else trickDifferential = game.tricks[team] - game.highBid.getNumber();
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

        private void ProcessMessage(Notification notification)
        {
            switch (notification.NotificationCase)
            {
                case Notification.NotificationOneofCase.Hand:
                    List<Network.Proto.Card> protoHand;
                    hand.Clear();
                    protoHand = notification.Hand.Hand_.ToList();
                    foreach (Network.Proto.Card protoCard in protoHand) {
                        hand.Add(Card.FromProto(protoCard));
                    }

                    break;
                case Notification.NotificationOneofCase.BidRequest:
                    status = Status.CHOOSING_BID;
                    Network.Proto.Bid myBid = DecideBid();
                    _grpcClient.CreateBid(myBid);
                    break;
                case Notification.NotificationOneofCase.BidList:
                    List<Network.Proto.Bid> protoBids;
                    protoBids = notification.BidList.Bids.ToList();
                    bids = new Dictionary<uint, Bid>();
                    Bid bid = null;

                    foreach (Network.Proto.Bid protoBid in protoBids)
                    {
                        bid = Bid.fromProto(protoBid);
                        bids.Add(protoBid.Seat, bid);
                        if (protoBid.Seat % 2 == Seat % 2 && protoBid.Seat != Seat)
                        {
                            if (firstPartnerBid == null)
                            {
                                firstPartnerBid = bid;
                            }
                            else
                            {
                                secondPartnerBid = bid;
                            }
                        }
                    }
                    break;
                case Notification.NotificationOneofCase.TrumpUpdate:
                    sortedHand = SortHandIntoSuits(game.CurrentTrump);

                    // if (TRACK_BOT_STATS)
                    // {
                    //     finalBreakdown.tricksBidByWinner = game.highBid.getNumber();
                    //     if (game.highBid.bidder.Equals(this)) finalBreakdown.wonBid = 'Y';
                    //     else finalBreakdown.wonBid = 'N';
                    // }
                    break;
                case Notification.NotificationOneofCase.PlayCardRequest:
                    uint seat = notification.PlayCardRequest.Seat;
                    Card card = null;
                    if (seat == Seat)
                    {
                        card = decideCard(Rules.getLegalCards(hand, game.leadCard, game.CurrentTrump));
                        sendMessageToServer("<PLAYCARD>" + card.ToString());
                    }
                    break;

                case Notification.NotificationOneofCase.TransferRequest:
                    playerIndex = int.Parse(content.Substring(0, 1));
                    if (playerIndex == position)
                    {
                        playerIndex = int.Parse(content.Substring(1, 1));
                        card = decideTransferCard();
                        if (card == null) card = PickLowestCard(); // TODO: This could be improved. Shouldn't happen often though.
                        sendMessageToServer("<TRANSFERCARD>" + playerIndex + card.ToString());
                    }
                    break;

                case Notification.NotificationOneofCase.TransferComplete:
                    playerIndex = int.Parse(content.Substring(0, 1));
                    if (playerIndex == position) // check if giving away a card
                    {
                        card = Card.FromString(content.Substring(2, 2));
                        //hand.Remove(card); // already taken care of by server
                        sortedHand[card.EffectiveSuit(game.CurrentTrump)].Remove(card);
                    }
                    else
                    {
                        playerIndex = int.Parse(content.Substring(1, 1));
                        if (playerIndex == position) // check if receiving a card
                        {
                            card = Card.FromString(content.Substring(2, 2));
                            //hand.Add(card); // already taken care of by server
                            sortedHand[card.EffectiveSuit(game.CurrentTrump)].Add(card);
                        }
                    }
                    break;

                case Notification.NotificationOneofCase.ThrowawayRequest:
                    playerIndex = int.Parse(content.Substring(0, 1));
                    if (playerIndex == position) // throw away a card
                    {
                        card = PickLowestCard();
                        System.Threading.Thread.Sleep(THROWAWAY_DELAY);
                        sendMessageToServer("<THROWAWAYCARD>" + card.ToString());
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
                    if (ServerMain.CONSOLE_OUTPUT_ON) System.Console.WriteLine("ER " + name + ":\t" + "Didn't understand message.");
                    break;
            }
        }

        #region Bidding Phase Methods
        /// <summary>
        /// decide what to bid based on cards and previous bids, etc.  highest level - utilizes evaluateTrump and applyBidBonus.
        /// </summary>
        /// <returns>Bot's bid</returns>
        private Network.Proto.Bid DecideBid()
        {
            Bid highBid = game.highBid;
            Trump bestTrump = null;
            double bestTrumpBid = 0;
            double score = 0;

            if (DEBUG_MODE_BIDDING)
            {
                printHand();
            }

            foreach (Suit suit in Suit.Suits.Values)
            {
                highCards.Add(new Card(suit, Rank.Ace));
                highCards.Add(new Card(suit, Rank.Ace));
            }
            foreach (Suit suit in Suit.Suits.Values)
            {
                lowCards.Add(new Card(suit, Rank.Nine));
                lowCards.Add(new Card(suit, Rank.Nine));
            }

            foreach (Trump trump in Trump.Trumps)
            {
                // if (TRACK_BOT_STATS)
                // {
                //     breakdowns.Add(trump, new HandBreakdown());
                //     breakdowns[trump].bidPosition = position;
                // }

                score = this.EvaluateTrump(trump);

                trumpScores.Add(trump, score);
            }

            if (firstPartnerBid != null && !firstPartnerBid.isPass())
            {
                foreach (Trump trump in Trump.Trumps)
                {
                    applyBidBonus(firstPartnerBid, trump);

                    // if (TRACK_BOT_STATS)
                    // {
                    //     breakdowns[trump].partner1TricksBid = firstPartnerBid.getNumber();
                    //     if (!firstPartnerBid.isPass()) breakdowns[trump].partner1Trump = firstPartnerBid.getTrump().ToString();
                    //     breakdowns[trump].partner1position = firstPartnerBid.bidder.position;
                    // }
                }
            }
            if (secondPartnerBid != null && !secondPartnerBid.isPass())
            {
                if (!firstPartnerBid.isPass() && firstPartnerBid.getTrump().Equals(secondPartnerBid.getTrump()))
                {
                    trumpScores.Clear();
                }
                foreach (Trump trump in Trump.allTrumps)
                {
                    applyBidBonus(secondPartnerBid, trump);

                    if (TRACK_BOT_STATS)
                    {
                        breakdowns[trump].partner2TricksBid = secondPartnerBid.getNumber();
                        if (!secondPartnerBid.isPass()) breakdowns[trump].partner2Trump = secondPartnerBid.getTrump().ToString();
                        breakdowns[trump].partner2position = secondPartnerBid.bidder.position;
                    }
                }
            }

            foreach (Trump trump in Trump.Trumps)
            {
                // if last bidder and partner is winning the bid, no need to overbid.  this method is a little sloppy but it should work.
                if (highBid != null && highBid.bidder.team == team && game.bids.Count == game.players.Length - 1)
                    score = 0;
                else
                    score = trumpScores[trump] * profile.getAggressionFactor();

                if (score + loneAcesOrNines * profile.getOffsuitAceValue() >= profile.getBidThreshold())
                {
                    if (DEBUG_MODE_BIDDING)
                    {
                        System.Console.WriteLine("\tSCORE OF " + score + " GREATER THAN BID THRESHOLD: BID = " + profile.getBidThreshold());
                    }
                    score = profile.getBidThreshold();
                }
                else if (secondPartnerBid != null)
                {
                    score += loneAcesOrNines * profile.getOffsuitAceValue();
                    if (DEBUG_MODE_BIDDING)
                    {
                        System.Console.WriteLine("\tLAST BIDDER - LONE ACES/NINES BONUS: " + loneAcesOrNines);
                    }
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

            if (TRACK_BOT_STATS)
            {
                finalBreakdown = breakdowns[bestTrump];
                finalBreakdown.trump = bestTrump.ToString();
            }

            Thread.Sleep(BID_DELAY);

            if (bestTrumpBid >= profile.getShootThreshold())
            {
                return Bid.makeShootBid(game.nextShootNum, bestTrump);
            }

            if (highBid == null || highBid.isPass() || (int)bestTrumpBid > highBid.getNumber())
            {
                if (DEBUG_MODE_BIDDING)
                {
                    System.Console.WriteLine("Bid " + (int)bestTrumpBid + " " + bestTrump.ToString());
                }
                return Bid.makeNormalBid((int)bestTrumpBid, bestTrump);
            }
            else
            {
                if (DEBUG_MODE_BIDDING)
                {
                    System.Console.WriteLine("Pass");
                }
                return Bid.makePassBid();
            }
        }

        /// <summary>
        /// take into account partners' bids.  run once for each partner for each trump.
        /// </summary>
        /// <param name="partnerBid">partner's bid</param>
        /// <param name="contemplatedTrump">trump being considered</param>
        private void ApplyBidBonus(Bid partnerBid, Trump contemplatedTrump)
        {
            Trump partnerTrump = partnerBid.getTrump();
            int partnerQty = partnerBid.getNumber();
            double currentScore = 0;
            int scoreModifier = 0;

            if (trumpScores.ContainsKey(contemplatedTrump))
            {
                currentScore = trumpScores[contemplatedTrump];
            }

            if (partnerBid.isShoot()) partnerQty = 1;

            scoreModifier += (int)(partnerQty * profile.getPartnerBidMultiplier(partnerTrump, contemplatedTrump));

            currentScore += scoreModifier;
            trumpScores[contemplatedTrump] = currentScore;
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
            sortedHand = SortHandIntoSuits(trump);

            int voidSuits = this.countVoidSuits(trump);
            if (TRACK_BOT_STATS) breakdowns[trump].voidSuits = voidSuits;

            if (DEBUG_MODE_BIDDING)
            {
                System.Console.WriteLine("\nEvaluate " + trump.ToString() + ":");
            }

            if (trumpScores.ContainsKey(trump))
            {
                score = trumpScores[trump];
            }
            if (DEBUG_MODE_BIDDING)
            {
                System.Console.WriteLine("Starting at " + score);
            }

            foreach (Suit suit in Suit.Suits.Values)
            {
                loneAcesOrNines = 0;
                foreach (Card card in sortedHand[suit])
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

            score += profile.getVoidBonus(voidSuits);
            if (DEBUG_MODE_BIDDING)
            {
                System.Console.WriteLine("\tVOID SUIT BONUS: +" + profile.getVoidBonus(voidSuits));
            }

            //if (score >= profile.getShootThreshold())
            //{
            //    score = 9;
            //    if (DEBUG_MODE_BIDDING)
            //    {
            //        System.Console.WriteLine("REACHED SHOOT THRESHOLD IN " + trump.ToString());
            //    }
            //}

            if (DEBUG_MODE_BIDDING)
            {
                System.Console.WriteLine("Final score for " + trump.ToString() + ": " + score);
            }
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
                    score = profile.getTrumpCardValue(cRank);

                    if (TRACK_BOT_STATS)
                    {
                        if (cRank.Equals(ContextualRank.RIGHT)) breakdowns[trump].rightBowers++;
                        else if (cRank.Equals(ContextualRank.LEFT)) breakdowns[trump].leftBowers++;
                        else if (cRank.Equals(ContextualRank.ACE)) breakdowns[trump].trumpAces++;
                        breakdowns[trump].trumpTotal++;
                    }
                }
                else // not trump
                {
                    if (cRank.Equals(ContextualRank.ACE))
                    {
                        if (sortedHand[card.Suit].Count > 1) //make sure isn't lone Ace
                        {
                            score = profile.getBestCardValue(trump, card.Suit);

                            if (TRACK_BOT_STATS)
                            {
                                if (card.EffectiveSuit(trump).Equals(trump.Suit.getSameColourSuit()))
                                    breakdowns[trump].sameColourAces++;
                                else breakdowns[trump].otherColourAces++;
                            }
                        }
                        else
                        {
                            loneAcesOrNines++;

                            if (TRACK_BOT_STATS) breakdowns[trump].loneAces++;
                        }
                    }
                }
            }
            else
            {
                if (trump.Equals(Trump.HIGH))
                {
                    /**
                     * This section is used to track how many high cards in a row the player has. (AAK, etc)
                     */
                    if (highCards.Contains(card))
                    {
                        highCards.Remove(card);
                        if (cRank.Equals(ContextualRank.ACE) && !(sortedHand[card.Suit].Count > 1)) // lone ace
                        {
                            loneAcesOrNines += 1;

                            if (TRACK_BOT_STATS) breakdowns[trump].loneAces++;
                        }
                        else
                        {
                            score = profile.getBestCardValue(trump, card.Suit);

                            if (TRACK_BOT_STATS) breakdowns[trump].runLength++;
                        }
                        if (!highCards.Contains(card) && !card.Rank.Equals(Rank.Nine)) // refill high cards list
                        {
                            Card newCard = new Card(Rank.Ranks[card.Rank.Value - 1 - 9], card.Suit);
                            highCards.Add(newCard);
                            highCards.Add(newCard);
                        }
                    }
                }
                else if (trump.Equals(Trump.LOW))
                {
                    /**
                     * This section is used to track how many high cards in a row the player has. (AAK, etc)
                     */
                    if (lowCards.Contains(card))
                    {
                        lowCards.Remove(card);
                        if (cRank.Equals(ContextualRank.NINE) && !(sortedHand[card.Suit].Count > 1))
                        {
                            loneAcesOrNines += 1;

                            if (TRACK_BOT_STATS) breakdowns[trump].loneAces++;
                        }
                        else
                        {
                            score = profile.getBestCardValue(trump, card.Suit);

                            if (TRACK_BOT_STATS) breakdowns[trump].runLength++;
                        }
                        if (!lowCards.Contains(card) && !card.Rank.Equals(Rank.ACE))
                        {
                            Card newCard = new Card(card.Suit, Rank.Ranks[card.Rank.Value + 1 - 9]);
                            lowCards.Add(newCard);
                            lowCards.Add(newCard);
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

            foreach (Suit suit in sortedHand.Keys)
            {
                if (sortedHand[suit].Count == 0 && contemplatedTrump.isSuit()
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
            Trump trump = game.CurrentTrump; // get what trump is
            Suit suit = game.leadCard.EffectiveSuit(trump); // start with the suit that was lead
            List<Card> cardsInSuit = sortedHand[suit]; // get cards that follow suit

            // must follow suit if able, so return the highest card
            if (cardsInSuit.Count > 0)
            {
                return cardsInSuit[0]; // sorted in descending order, so 0 is highest
            }

            // doesn't need to follow suit, so return lowest trump if available
            if (trump.isSuit() && !trump.Suit.Equals(suit) && sortedHand[trump.Suit].Count > 0)
            {
                suit = trump.Suit;
                cardsInSuit = sortedHand[suit];
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

            if (game.leadCard != null)
            {
                cardsInSuit = sortedHand[game.leadCard.EffectiveSuit(game.CurrentTrump)]; // get cards that follow suit

                // must follow suit if able, so return the lowest card
                if (cardsInSuit.Count > 0)
                {
                    return cardsInSuit[cardsInSuit.Count - 1]; // sorted in descending order, so last is lowest
                }
            }

            suitScores = ScoreSuitsForThrowaway();
            foreach (Suit suit in Suit.Suits)
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
                candidateCards = sortedHand[candidateSuits[0]];
            }
            else
            {
                suitChooser = Math.Abs(random.Next()) % candidateSuits.Count;
                candidateCards = sortedHand[candidateSuits[suitChooser]];
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
            Trump trump = game.CurrentTrump;
            List<Card> candidateSuit;
            Card highestCard;
            Dictionary<Suit, int> suitScores = new Dictionary<Suit, int>();
            int score = -1;

            foreach (Suit suit in Suit.Suits)
            {
                candidateSuit = sortedHand[suit];

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

                    if (game.cardCounter.isHighest(highestCard))
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
            Trump trump = game.CurrentTrump;
            List<Card> candidateSuit;
            Card candidate;
            Dictionary<Suit, int> suitScores = new Dictionary<Suit, int>();
            int score = -1;

            foreach (Suit suit in Suit.Suits.Values)
            {
                candidateSuit = sortedHand[suit];

                if (candidateSuit.Count == 0)
                {
                    score = 0;
                }
                else
                {
                    candidate = candidateSuit[0];

                    if (trump.isSuit() && suit.Equals(trump.Suit))
                    { // candidate suit is trump
                        if (game.cardCounter.isHighest(candidate))
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
                        if (game.cardCounter.isHighest(candidate))
                        { // is highest
                            if (trump.isSuit() && candidateSuit.Count == 1)
                            { // is lone
                                if (!game.cardCounter.isLone(candidate))
                                { // is unique
                                    if (trump.isSuit() && trump.Suit.getSameColourSuit().Equals(suit))
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
                                    if (trump.isSuit() && trump.Suit.getSameColourSuit().Equals(suit))
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
                                if (!game.cardCounter.isLone(candidate))
                                { // is unique
                                    if (trump.isSuit() && trump.Suit.getSameColourSuit().Equals(suit))
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
                                    if (trump.isSuit() && trump.Suit.getSameColourSuit().Equals(suit))
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
                if (DEBUG_MODE_PLAYING)
                {
                    System.Console.WriteLine("No good card to lead - pick lowest to throw away.");
                }
                return null; // no cards are high so leave it to PickLowestCard
            }

            if (candidateSuits.Count == 1)
            { // there is a clear winner, so return the highest card in that suit
                candidateCards = sortedHand[candidateSuits[0]];
            }
            else
            {
                suitChooser = Math.Abs(random.Next()) % candidateSuits.Count;
                candidateCards = sortedHand[candidateSuits[suitChooser]];
            }

            if (DEBUG_MODE_PLAYING)
            {
                System.Console.WriteLine("Found card to lead.");
            }
            return candidateCards[0]; // return highest card
        }

        /// <summary>
        /// Print sorted hand for debug purposes
        /// </summary>
        private void PrintSortedHand()
        {
            System.Console.WriteLine("Current Hand:");
            foreach (List<Card> cards in sortedHand.Values)
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
            Trump trump = game.CurrentTrump;
            Suit suitLead = game.leadCard.EffectiveSuit(trump);
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
            bool isLeader = game.leadCard == null;
            Card cardToPlay = null;
            Trump trump = game.CurrentTrump;

            if (DEBUG_MODE_PLAYING)
            {
                PrintSortedHand();
                System.Console.WriteLine("Deciding card...");
            }

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
                Suit leadSuit = game.leadCard.EffectiveSuit(trump);
                Card winningCard = game.cardCounter.bestInCurrentTrick;
                bool teamIsWinning = team == game.players[game.cardCounter.winnerOfCurrentTrick.position].team;
                bool winningCardIsHighestInSuit = game.cardCounter.isHighestExcluding(winningCard, sortedHand);
                if (teamIsWinning && (winningCardIsHighestInSuit || (trump.isSuit() && winningCard.EffectiveSuit(trump).Equals(trump.Suit))))
                {
                    cardToPlay = PickLowestCard();
                    if (DEBUG_MODE_PLAYING)
                    {
                        System.Console.WriteLine("throwing off - team is winning.");
                    }
                }
                else
                {
                    if (game.cardCounter.playsLast(this))
                    { // beat with lowest winning card
                        cardToPlay = FindLowestWinningCard(legalCards, winningCard);
                        if (DEBUG_MODE_PLAYING)
                        {
                            System.Console.WriteLine("last player - using lowest winning card if possible...");
                        }
                    }
                    else
                    {
                        cardToPlay = PickHighestCard();
                    }
                    if (cardToPlay == null)
                    {
                        cardToPlay = PickLowestCard();
                    }
                    if (!IsCardBetter(winningCard, cardToPlay, trump, game.leadCard.EffectiveSuit(trump)))
                    {
                        cardToPlay = PickLowestCard();
                        if (DEBUG_MODE_PLAYING)
                        {
                            System.Console.WriteLine("throwing off.");
                        }
                    }
                    else
                    {
                        if (DEBUG_MODE_PLAYING)
                        {
                            System.Console.WriteLine("trying to win.");
                        }
                    }
                }
            }

            Thread.Sleep(CARD_DELAY);

            sortedHand[cardToPlay.EffectiveSuit(trump)].Remove(cardToPlay);
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
                oneSuitsWorth = GetCardsOfContextualSuit(hand, suit, trump);
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
            Trump trump = game.CurrentTrump;

            Card transferCard = null;
            int candidateRank;
            int cardsInSuit;

            if (trump.isSuit())
            {
                Suit trumpSuit = trump.Suit;

                if (sortedHand[trumpSuit].Count > 0) return sortedHand[trumpSuit][0]; // Bot has trump, so return highest
            }

            foreach (Suit suit in sortedHand.Keys)
            {
                cardsInSuit = sortedHand[suit].Count;

                if (cardsInSuit > 0)
                {
                    candidateRank = sortedHand[suit][0].Rank.Value;

                    if (trump.Equals(Trump.Low))
                    {
                        if (transferCard == null || candidateRank < transferCard.Rank.Value)
                            transferCard = sortedHand[suit][0];
                    }
                    else
                    {
                        if (transferCard == null || candidateRank > transferCard.Rank.Value)
                            transferCard = sortedHand[suit][0];
                    }
                }
            }

            Thread.Sleep(TRANSFER_DELAY);

            return transferCard;
        }

        /// <summary>
        /// print hand for debug purposes
        /// </summary>
        protected void PrintHand()
        {
            System.Console.WriteLine(name + "'s Hand:");
            foreach (Card card in hand)
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
                if (newBid.isShoot() && newBid.getShootNumber() != 1)
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
                if (newBid.getNumber() > getHandSize(settings))
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
                if (newBid.getShootNumber() == 1) return true;
                else return false;
            }
            else if (newBid.isShoot() && lastHighestBid.isShoot())
            {
                return (newBid.getShootNumber() == lastHighestBid.getShootNumber() + 1);
            }
            //all other cases the new bid is legal
            return true;

        }

        private static int GetHandSize(GameSettings settings)
        {
            return settings.getDeckSize()
                    / (settings.getNumPlayersPerTeam() * 2);
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
    }
}
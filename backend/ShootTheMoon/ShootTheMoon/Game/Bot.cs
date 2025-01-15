using System;
using System.Collections.Generic;
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

        private Dictionary<Trump, Double> trumpScores = new Dictionary<Trump, double>();
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

        private static List<string> possibleNames;

        private static int nextBot = 0;

        const int BID_DELAY = 500;
        const int CARD_DELAY = 500;
        const int TRANSFER_DELAY = 500;
        const int THROWAWAY_DELAY = 500;

        static Bot()
        {
            possibleNames = new List<string>(new string[] { "Alexander", "Genghis Khan", "Hannibal", "Louis IX", "Charlemagne", "Ivan III" });
        }

        public Bot(Game initGame, BotProfile initProfile)
        {
            human = false;
            id = Bot.nextBot++;
            game = initGame;
            name = getRandomName();
            status = Status.PREGAME_READY;
            profile = initProfile;
            inactivityTimer = new Timer(InactivityTimeout);
        }

        /// <summary>
        /// Constructor for creating a new bot partway through a game.
        /// </summary>
        /// <param name="initGame">game to join</param>
        /// <param name="newHand">existing hand</param>
        public Bot(Game initGame, List<Card> newHand, BotProfile initProfile)
            : this(initGame, initProfile)
        {
            initializeRound();
            hand = newHand;
        }

        public void adjustForContext(Status newStatus)
        {
            finalBreakdown = new HandBreakdown();
            status = newStatus;

            if (game.currentTrump == null) sortedHand = sortHandIntoSuits(Trump.HIGH);
            else sortedHand = sortHandIntoSuits(game.currentTrump);

            switch (status)
            {
                case Status.CHOOSING_BID:
                    game.currentPlayer = this;
                    requestBid();
                    break;

                case Status.WAITING_FOR_PLAY:
                    initializeTrick();
                    break;

                case Status.CHOOSING_CARD:
                    initializeTrick();
                    game.currentPlayer = this;
                    sendMessageToClient("<REQUESTCARD>" + position);
                    break;

                case Status.CHOOSING_TRANSFER_CARDS:
                    //game.currentPlayer = this;
                    sendMessageToClient("<REQUESTTRANSFER>" + position.ToString() + game.highBid.bidder.position.ToString());
                    break;

                case Status.THROWING_AWAY_CARDS:
                    game.currentPlayer = this;
                    sendMessageToClient("<REQUESTTHROWAWAY>" + position);
                    break;

                default:
                    break;
            }
        }

        private string getRandomName()
        {
            Random random = new Random();
            int index;

            List<string> names = new List<string>(possibleNames);
            foreach (Client player in game.players)
            {
                if (player != null && player.GetType() == typeof(Bot))
                {
                    names.Remove(player.name);
                }
            }

            index = random.Next(names.Count);

            return names[index];
        }

        /// <summary>
        /// For statistics collection purposes only.  Doesn't take into account trump, unlike countVoidSuits.
        /// </summary>
        /// <returns>number of void suits</returns>
        public int getNumVoids()
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
        public void initializeRound()
        {
            trumpScores.Clear();
            highCards.Clear();
            lowCards.Clear();
            loneAcesOrNines = 0;
            firstPartnerBid = null;
            secondPartnerBid = null;
            sortedHand = sortHandIntoSuits(Trump.High);
            breakdowns.Clear();
        }

        public void endRound()
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

        public void endTrick()
        {
            // if (TRACK_BOT_STATS)
            // {
            //     int winnerPosition = game.highCard.player.position;
            //     if (winnerPosition == position) finalBreakdown.tricksWon++;
            //     else if (winnerPosition == finalBreakdown.partner1position) finalBreakdown.partner1TricksWon++;
            //     else if (winnerPosition == finalBreakdown.partner2position) finalBreakdown.partner2TricksWon++;
            // }
        }

        private void processMessage(Notification notification)
        {
            Card card;
            Bid bid;
            int playerIndex;

            switch (notification.GetType())
            {
                case "NEWHAND":
                    string cardShortName;
                    hand.Clear();

                    while (content != string.Empty)
                    {
                        cardShortName = content.Substring(0, 2);
                        content = content.Substring(2);
                        card = Card.FromString(cardShortName);
                        hand.Add(card);
                    }
                    break;
                case "REQUESTBID":
                    playerIndex = int.Parse(content.Substring(0, 1));
                    if (playerIndex == position)
                    {
                        bid = decideBid();
                        sendMessageToServer("<BID>" + bid.ToString());
                    }
                    break;
                case "CONFIRMBID":
                    playerIndex = int.Parse(content.Substring(0, 1));
                    content = content.Substring(1);

                    if (game.players[playerIndex].team == team && playerIndex != position)
                    {
                        if (firstPartnerBid == null)
                        {
                            firstPartnerBid = Bid.FromString(content);
                            firstPartnerBid.bidder = game.players[playerIndex];
                        }
                        else
                        {
                            secondPartnerBid = Bid.FromString(content);
                            secondPartnerBid.bidder = game.players[playerIndex];
                        }
                    }
                    break;
                case "CONFIRMTRUMP":
                    sortedHand = sortHandIntoSuits(game.currentTrump);

                    if (TRACK_BOT_STATS)
                    {
                        finalBreakdown.tricksBidByWinner = game.highBid.getNumber();
                        if (game.highBid.bidder.Equals(this)) finalBreakdown.wonBid = 'Y';
                        else finalBreakdown.wonBid = 'N';
                    }
                    break;
                case "REQUESTCARD":
                    playerIndex = int.Parse(content);
                    if (playerIndex == position)
                    {
                        card = decideCard(Rules.getLegalCards(hand, game.leadCard, game.currentTrump));
                        sendMessageToServer("<PLAYCARD>" + card.ToString());
                    }
                    break;

                case "REQUESTTRANSFER":
                    playerIndex = int.Parse(content.Substring(0, 1));
                    if (playerIndex == position)
                    {
                        playerIndex = int.Parse(content.Substring(1, 1));
                        card = decideTransferCard();
                        if (card == null) card = pickLowestCard(); // TODO: This could be improved. Shouldn't happen often though.
                        sendMessageToServer("<TRANSFERCARD>" + playerIndex + card.ToString());
                    }
                    break;

                case "CONFIRMTRANSFER":
                    playerIndex = int.Parse(content.Substring(0, 1));
                    if (playerIndex == position) // check if giving away a card
                    {
                        card = Card.FromString(content.Substring(2, 2));
                        //hand.Remove(card); // already taken care of by server
                        sortedHand[card.getContextualSuit(game.currentTrump)].Remove(card);
                    }
                    else
                    {
                        playerIndex = int.Parse(content.Substring(1, 1));
                        if (playerIndex == position) // check if receiving a card
                        {
                            card = Card.FromString(content.Substring(2, 2));
                            //hand.Add(card); // already taken care of by server
                            sortedHand[card.getContextualSuit(game.currentTrump)].Add(card);
                        }
                    }
                    break;

                case "REQUESTTHROWAWAY":
                    playerIndex = int.Parse(content.Substring(0, 1));
                    if (playerIndex == position) // throw away a card
                    {
                        card = pickLowestCard();
                        System.Threading.Thread.Sleep(THROWAWAY_DELAY);
                        sendMessageToServer("<THROWAWAYCARD>" + card.ToString());
                    }
                    break;

                case "CONFIRMTHROWAWAY":
                    playerIndex = int.Parse(content.Substring(0, 1));
                    bool finished = int.Parse(content.Substring(1, 1)) == 1;

                    if (content.Length > 2 && playerIndex == position) // these two predicates should be equivalent
                    {
                        // server sent us the card info
                        card = Card.FromString(content.Substring(2, 2));
                        //hand.Remove(card); // taken care of by the server
                        sortedHand[card.getContextualSuit(game.currentTrump)].Remove(card);
                    }

                    if (!finished) // throw away another card if not finished
                    {
                        card = pickLowestCard();
                        sendMessageToServer("<THROWAWAYCARD>" + card.ToString());
                    }
                    break;

                default:
                    if (ServerMain.CONSOLE_OUTPUT_ON) System.Console.WriteLine("ER " + name + ":\t" + "Didn't understand message.");
                    break;
            }
        }

        public override void leaveGame()
        {
        }

        #region Bidding Phase Methods
        /// <summary>
        /// decide what to bid based on cards and previous bids, etc.  highest level - utilizes evaluateTrump and applyBidBonus.
        /// </summary>
        /// <returns>Bot's bid</returns>
        private Bid decideBid()
        {
            Bid highBid = game.highBid;
            Trump bestTrump = null;
            double bestTrumpBid = 0;
            double score = 0;

            if (DEBUG_MODE_BIDDING)
            {
                printHand();
            }

            foreach (Suit suit in Suit.allSuits)
            {
                highCards.Add(new Card(Rank.ACE, suit));
                highCards.Add(new Card(Rank.ACE, suit));
            }
            foreach (Suit suit in Suit.allSuits)
            {
                lowCards.Add(new Card(Rank.NINE, suit));
                lowCards.Add(new Card(Rank.NINE, suit));
            }

            foreach (Trump trump in Trump.allTrumps)
            {
                if (TRACK_BOT_STATS)
                {
                    breakdowns.Add(trump, new HandBreakdown());
                    breakdowns[trump].bidPosition = position;
                }

                score = this.evaluateTrump(trump);

                trumpScores.Add(trump, score);
            }

            if (firstPartnerBid != null && !firstPartnerBid.isPass())
            {
                foreach (Trump trump in Trump.allTrumps)
                {
                    applyBidBonus(firstPartnerBid, trump);

                    if (TRACK_BOT_STATS)
                    {
                        breakdowns[trump].partner1TricksBid = firstPartnerBid.getNumber();
                        if (!firstPartnerBid.isPass()) breakdowns[trump].partner1Trump = firstPartnerBid.getTrump().ToString();
                        breakdowns[trump].partner1position = firstPartnerBid.bidder.position;
                    }
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

            foreach (Trump trump in Trump.allTrumps)
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
        private void applyBidBonus(Bid partnerBid, Trump contemplatedTrump)
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
        private double evaluateTrump(Trump trump)
        {
            double score = 0;
            //int trumpCount = 0;
            sortedHand = sortHandIntoSuits(trump);

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

            foreach (Suit suit in Suit.allSuits)
            {
                loneAcesOrNines = 0;
                foreach (Card card in sortedHand[suit])
                {
                    score += scoreCard(trump, card);
                    //				if(trump.isSuit() && card.getContextualSuit(trump).Equals(trump.getSuit())){
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
        private double scoreCard(Trump trump, Card card)
        {
            ContextualRank cRank = card.getContextualRank(trump);
            Suit cSuit = card.getContextualSuit(trump);
            double score = 0;

            if (trump.isSuit())
            {
                if (trump.getSuit().Equals(cSuit))
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
                        if (sortedHand[card.getSuit()].Count > 1) //make sure isn't lone Ace
                        {
                            score = profile.getBestCardValue(trump, card.getSuit());

                            if (TRACK_BOT_STATS)
                            {
                                if (card.getContextualSuit(trump).Equals(trump.getSuit().getSameColourSuit()))
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
                        if (cRank.Equals(ContextualRank.ACE) && !(sortedHand[card.getSuit()].Count > 1)) // lone ace
                        {
                            loneAcesOrNines += 1;

                            if (TRACK_BOT_STATS) breakdowns[trump].loneAces++;
                        }
                        else
                        {
                            score = profile.getBestCardValue(trump, card.getSuit());

                            if (TRACK_BOT_STATS) breakdowns[trump].runLength++;
                        }
                        if (!highCards.Contains(card) && !card.getRank().Equals(Rank.NINE)) // refill high cards list
                        {
                            Card newCard = new Card(Rank.allRanks[card.getRank().getRanking() - 1 - 9], card.getSuit());
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
                        if (cRank.Equals(ContextualRank.NINE) && !(sortedHand[card.getSuit()].Count > 1))
                        {
                            loneAcesOrNines += 1;

                            if (TRACK_BOT_STATS) breakdowns[trump].loneAces++;
                        }
                        else
                        {
                            score = profile.getBestCardValue(trump, card.getSuit());

                            if (TRACK_BOT_STATS) breakdowns[trump].runLength++;
                        }
                        if (!lowCards.Contains(card) && !card.getRank().Equals(Rank.ACE))
                        {
                            Card newCard = new Card(Rank.allRanks[card.getRank().getRanking() + 1 - 9], card.getSuit());
                            lowCards.Add(newCard);
                            lowCards.Add(newCard);
                        }
                    }
                }
            }

            if (DEBUG_MODE_BIDDING && score > 0)
            {
                System.Console.WriteLine(card.getRank().getFullName() + " of " + card.getSuit().ToString() + ": +" + score);
            }
            return score;
        }

        /// <summary>
        /// count the number of void suits in bot's hand, taking into account a prospective trump.
        /// *note* sortHandIntoSuits should be called first.  is that a problem?
        /// </summary>
        /// <param name="contemplatedTrump">trump being considered</param>
        /// <returns>number of void suits</returns>
        private int countVoidSuits(Trump contemplatedTrump)
        {
            int voidCount = 0;

            foreach (Suit suit in sortedHand.Keys)
            {
                if (sortedHand[suit].Count == 0 && contemplatedTrump.isSuit()
                        && !suit.Equals(contemplatedTrump.getSuit()))
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
        private Card pickHighestCard()
        {
            Trump trump = game.currentTrump; // get what trump is
            Suit suit = game.leadCard.getContextualSuit(trump); // start with the suit that was lead
            List<Card> cardsInSuit = sortedHand[suit]; // get cards that follow suit

            // must follow suit if able, so return the highest card
            if (cardsInSuit.Count > 0)
            {
                return cardsInSuit[0]; // sorted in descending order, so 0 is highest
            }

            // doesn't need to follow suit, so return lowest trump if available
            if (trump.isSuit() && !trump.getSuit().Equals(suit) && sortedHand[trump.getSuit()].Count > 0)
            {
                suit = trump.getSuit();
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
        private Card pickLowestCard()
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
                cardsInSuit = sortedHand[game.leadCard.getContextualSuit(game.currentTrump)]; // get cards that follow suit

                // must follow suit if able, so return the lowest card
                if (cardsInSuit.Count > 0)
                {
                    return cardsInSuit[cardsInSuit.Count - 1]; // sorted in descending order, so last is lowest
                }
            }

            suitScores = scoreSuitsForThrowaway();
            foreach (Suit suit in Suit.allSuits)
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
        private Dictionary<Suit, int> scoreSuitsForThrowaway()
        {
            Trump trump = game.currentTrump;
            List<Card> candidateSuit;
            Card highestCard;
            Dictionary<Suit, int> suitScores = new Dictionary<Suit, int>();
            int score = -1;

            foreach (Suit suit in Suit.allSuits)
            {
                candidateSuit = sortedHand[suit];

                if (candidateSuit.Count == 0)
                {
                    score = 0;
                }
                else if (trump.isSuit() && trump.getSuit().Equals(suit))
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
        private Dictionary<Suit, int> scoreSuitsForLead()
        {
            Trump trump = game.currentTrump;
            List<Card> candidateSuit;
            Card candidate;
            Dictionary<Suit, int> suitScores = new Dictionary<Suit, int>();
            int score = -1;

            foreach (Suit suit in Suit.allSuits)
            {
                candidateSuit = sortedHand[suit];

                if (candidateSuit.Count == 0)
                {
                    score = 0;
                }
                else
                {
                    candidate = candidateSuit[0];

                    if (trump.isSuit() && suit.Equals(trump.getSuit()))
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
                                    if (trump.isSuit() && trump.getSuit().getSameColourSuit().Equals(suit))
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
                                    if (trump.isSuit() && trump.getSuit().getSameColourSuit().Equals(suit))
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
                                    if (trump.isSuit() && trump.getSuit().getSameColourSuit().Equals(suit))
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
                                    if (trump.isSuit() && trump.getSuit().getSameColourSuit().Equals(suit))
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
        private Card pickCardToLead()
        {
            int score;
            int highestScore = -1;
            Dictionary<Suit, int> suitScores = scoreSuitsForLead();
            List<Suit> candidateSuits = new List<Suit>();
            List<Card> candidateCards;
            Random random = new Random();
            int suitChooser;

            foreach (Suit suit in Suit.allSuits)
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
                return null; // no cards are high so leave it to pickLowestCard
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
        private void printSortedHand()
        {
            System.Console.WriteLine("Current Hand:");
            foreach (List<Card> cards in sortedHand.Values)
            {
                if (cards.Count > 0)
                {
                    System.Console.WriteLine("\t" + cards[0].getSuit().ToString() + ":");
                }
                foreach (Card card in cards)
                {
                    System.Console.WriteLine(" " + card.getRank().getShortName());
                }
                System.Console.WriteLine();
            }
        }

        /// <summary>
        /// find lowest card in hand that will win the trick
        /// </summary>
        /// <param name="cardToBeat">currently winning card</param>
        /// <returns>a card that can minimally beat the currently winning card</returns>
        private Card findLowestWinningCard(List<Card> legalCards, Card cardToBeat)
        {
            Trump trump = game.currentTrump;
            Suit suitLead = game.leadCard.getContextualSuit(trump);
            Card chosenCard = null;

            foreach (Card card in legalCards)
            {
                if (Rules.isCardBetter(cardToBeat, card, trump, suitLead)
                        && (chosenCard == null || Rules.isCardBetter(card, chosenCard, trump, suitLead)))
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
        public Card decideCard(List<Card> legalCards)
        {
            bool isLeader = game.leadCard == null;
            Card cardToPlay = null;
            Trump trump = game.currentTrump;

            if (DEBUG_MODE_PLAYING)
            {
                printSortedHand();
                System.Console.WriteLine("Deciding card...");
            }

            if (isLeader)
            {
                cardToPlay = pickCardToLead();
                if (cardToPlay == null)
                {
                    cardToPlay = pickLowestCard();
                }
            }
            else
            {
                Suit leadSuit = game.leadCard.getContextualSuit(trump);
                Card winningCard = game.cardCounter.bestInCurrentTrick;
                bool teamIsWinning = team == game.players[game.cardCounter.winnerOfCurrentTrick.position].team;
                bool winningCardIsHighestInSuit = game.cardCounter.isHighestExcluding(winningCard, sortedHand);
                if (teamIsWinning && (winningCardIsHighestInSuit || (trump.isSuit() && winningCard.getContextualSuit(trump).Equals(trump.getSuit()))))
                {
                    cardToPlay = pickLowestCard();
                    if (DEBUG_MODE_PLAYING)
                    {
                        System.Console.WriteLine("throwing off - team is winning.");
                    }
                }
                else
                {
                    if (game.cardCounter.playsLast(this))
                    { // beat with lowest winning card
                        cardToPlay = findLowestWinningCard(legalCards, winningCard);
                        if (DEBUG_MODE_PLAYING)
                        {
                            System.Console.WriteLine("last player - using lowest winning card if possible...");
                        }
                    }
                    else
                    {
                        cardToPlay = pickHighestCard();
                    }
                    if (cardToPlay == null)
                    {
                        cardToPlay = pickLowestCard();
                    }
                    if (!Rules.isCardBetter(winningCard, cardToPlay, trump, game.leadCard.getContextualSuit(trump)))
                    {
                        cardToPlay = pickLowestCard();
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

            sortedHand[cardToPlay.getContextualSuit(trump)].Remove(cardToPlay);
            return cardToPlay;
        }

        /// <summary>
        /// sort the unsorted hand into different suits (in order within the suit).  Note - trump may not be fixed yet, so use parameter.
        /// </summary>
        /// <returns>Dictionary containing cards by suit</returns>
        private Dictionary<Suit, List<Card>> sortHandIntoSuits(Trump trump)
        {
            Dictionary<Suit, List<Card>> result = new Dictionary<Suit, List<Card>>();
            List<Card> oneSuitsWorth = new List<Card>();

            foreach (Suit suit in Suit.allSuits)
            {
                oneSuitsWorth = Card.getCardsOfContextualSuit(hand, suit, trump);
                oneSuitsWorth = sortSuit(oneSuitsWorth, trump);
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
        private List<Card> sortSuit(List<Card> unsortedHand, Trump trump)
        {

            List<Card> sortedSuit = new List<Card>(unsortedHand);

            for (int i = 0; i < sortedSuit.Count; i++)
            {
                Card highestCard = sortedSuit[i];
                int highestCardSpot = i;
                for (int j = i + 1; j < sortedSuit.Count; j++)
                {
                    Card targetCard = sortedSuit[j];
                    if (Rules.isCardBetter(highestCard, targetCard, trump, highestCard.getSuit()))
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
        private Card decideTransferCard()
        {
            Trump trump = game.currentTrump;

            Card transferCard = null;
            int candidateRank;
            int cardsInSuit;

            if (trump.isSuit())
            {
                Suit trumpSuit = trump.getSuit();

                if (sortedHand[trumpSuit].Count > 0) return sortedHand[trumpSuit][0]; // Bot has trump, so return highest
            }

            foreach (Suit suit in sortedHand.Keys)
            {
                cardsInSuit = sortedHand[suit].Count;

                if (cardsInSuit > 0)
                {
                    candidateRank = sortedHand[suit][0].getRank().getRanking();

                    if (trump.Equals(Trump.LOW))
                    {
                        if (transferCard == null || candidateRank < transferCard.getRank().getRanking())
                            transferCard = sortedHand[suit][0];
                    }
                    else
                    {
                        if (transferCard == null || candidateRank > transferCard.getRank().getRanking())
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
        protected void printHand()
        {
            System.Console.WriteLine(name + "'s Hand:");
            foreach (Card card in hand)
            {
                System.Console.WriteLine(card.getRank().getFullName() + " of " + card.getSuit());
            }
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
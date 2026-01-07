using System.Collections.Generic;
using System;

namespace Bot
{
    public class BotProfile
    {
        protected Dictionary<Trump, Dictionary<Trump, double>> partnerBidMultiplier = new Dictionary<Trump, Dictionary<Trump, double>>();
        protected double SAME_COLOUR_BID_MULTIPLIER = 0.5; //Proportion of other players' same colour bid that affects score
        protected double SAME_SUIT_BID_MULTIPLIER = 1; //Proportion of other players' same suit bid that affects score
        protected double BOTH_HIGH_LOW_BID_MULTIPLIER = 1; //Proportion of other players' no trump bid that affects same bid score
        protected double HIGH_BID_MULTIPLIER = 0.45; //Proportion of other players' no trump bid that affects suit bid score
        protected double LOW_BID_MULTIPLIER = 0; //Proportion of other players' (low) no trump bid that affects suit bid score
        protected double bidThreshold;
        protected double BID_THRESHOLD = 6; //Bid (# of tricks) expected to be sufficient to win the bid
        protected double shootThreshold;
        protected double SHOOT_THRESHOLD = 7; //Lowest bid that should be converted to a 'shoot' bid

        protected Dictionary<ContextualRank, double> trumpCardValues = new Dictionary<ContextualRank, double>();
        protected double TRUMP_RIGHT_VALUE = 0.94;
        protected double TRUMP_LEFT_VALUE = 0.65;
        protected double TRUMP_ACE_VALUE = 0.44;
        protected double TRUMP_KING_VALUE = 0.32;
        protected double TRUMP_QUEEN_VALUE = 0.25;
        protected double TRUMP_TEN_VALUE = 0.18;
        protected double TRUMP_NINE_VALUE = 0.13;

        protected Dictionary<Trump, Dictionary<Suit, double>> bestCardValue = new Dictionary<Trump, Dictionary<Suit, double>>();
        protected double OFFSUIT_ACE_VALUE = 0.37;
        protected double DANGER_ACE_VALUE = 0.24;
        protected double BEST_CARD_VALUE = 1;

        protected double VOID_MODIFIER_A = 0.35;
        protected double VOID_MODIFIER_B = -0.06;
        protected double VOID_MODIFIER_C = -0.1;

        protected double AGGRESSION_FACTOR = 1.15; // In its current default configuration, 1.15 beats opponents with 1.10. or 1.20.

        public static BotProfile DEFAULT = new BotProfile();
        public static BotProfile AGGRESSIVE = new BotProfile();
        public static BotProfile CONSERVATIVE = new BotProfile();

        protected BotProfile()
        {
            foreach (Trump t1 in Trump.Trumps.Values)
            {
                Dictionary<Trump, double> temp = new Dictionary<Trump, double>();
                foreach (Trump t2 in Trump.Trumps.Values)
                {
                    if (t1.isSuit() && t2.isSuit())
                    { // partner bid is a suit and I'm considering a suit
                        if (t1.Suit.Equals(t2.Suit))
                        { // partner bidding same suit I'm considering
                            temp.Add(t2, SAME_SUIT_BID_MULTIPLIER);
                        }
                        else if (t1.SameColour.Equals(t2.Suit))
                        { // partner bidding same colour as suit I'm considering
                            temp.Add(t2, SAME_COLOUR_BID_MULTIPLIER);
                        }
                        else
                        { // partner bidding different colour suit than I'm considering
                            temp.Add(t2, (double)0);
                        }
                    }
                    else if (t1.Equals(t2))
                    { // partner and I both considering high or both low
                        temp.Add(t2, BOTH_HIGH_LOW_BID_MULTIPLIER);
                    }
                    else if (!t1.isSuit() && t2.isSuit())
                    { // partner bidding high or low and I'm considering a suit
                        if (t1.Equals(Trump.High))
                        {
                            temp.Add(t2, HIGH_BID_MULTIPLIER);
                        }
                        else if (t1.Equals(Trump.Low))
                        {
                            temp.Add(t2, LOW_BID_MULTIPLIER);
                        }
                    }
                    else
                    { // my bid unrelated to partner's bid
                        temp.Add(t2, (double)0);
                    }
                }
                partnerBidMultiplier.Add(t1, temp);
            }

            bidThreshold = BID_THRESHOLD;
            shootThreshold = SHOOT_THRESHOLD;

            trumpCardValues.Add(ContextualRank.RIGHT, TRUMP_RIGHT_VALUE);
            trumpCardValues.Add(ContextualRank.LEFT, TRUMP_LEFT_VALUE);
            trumpCardValues.Add(ContextualRank.ACE, TRUMP_ACE_VALUE);
            trumpCardValues.Add(ContextualRank.KING, TRUMP_KING_VALUE);
            trumpCardValues.Add(ContextualRank.QUEEN, TRUMP_QUEEN_VALUE);
            trumpCardValues.Add(ContextualRank.TEN, TRUMP_TEN_VALUE);
            trumpCardValues.Add(ContextualRank.NINE, TRUMP_NINE_VALUE);

            foreach (Trump trump in Trump.Trumps.Values)
            {
                Dictionary<Suit, double> temp = new Dictionary<Suit, double>();
                foreach (Suit suit in Suit.Suits.Values)
                {
                    if (trump.isSuit())
                    {
                        if (trump.Suit.Equals(suit))
                        {
                            temp.Add(suit, TRUMP_ACE_VALUE);
                        }
                        else if (trump.SameColour.Equals(suit))
                        {
                            temp.Add(suit, DANGER_ACE_VALUE);
                        }
                        else
                        {
                            temp.Add(suit, OFFSUIT_ACE_VALUE);
                        }
                    }
                    else
                    {
                        temp.Add(suit, BEST_CARD_VALUE);
                    }
                }
                bestCardValue.Add(trump, temp);
            }
        }

        public double getTrumpCardValue(ContextualRank cRank)
        {
            return trumpCardValues[cRank];
        }

        public double getPartnerBidMultiplier(Trump partnerTrump, Trump myTrump)
        {
            return partnerBidMultiplier[partnerTrump][myTrump];
        }

        public double getBidThreshold()
        {
            return bidThreshold;
        }

        public double getShootThreshold()
        {
            return shootThreshold;
        }

        public double getBestCardValue(Trump trump, Suit suit)
        {
            return bestCardValue[trump][suit];
        }

        public double getVoidBonus(int voidSuits)
        {
            return VOID_MODIFIER_A * Math.Pow(voidSuits, 2) + VOID_MODIFIER_B * voidSuits + VOID_MODIFIER_C;
        }

        public double getOffsuitAceValue()
        {
            return bestCardValue[Trump.Clubs][Suit.Hearts];
        }

        public double getAggressionFactor()
        {
            return AGGRESSION_FACTOR;
        }
    }
}

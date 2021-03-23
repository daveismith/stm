using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class Bid
    {
        public static readonly int PASS_NUM = 0;
        public static readonly int SHOOT_NUM = 9;

        public int Number { get; set; }
        public Trump Trump { get; set; }
        public int ShootNumber { get; set; }

        public static Bid makeNormalBid(int number, Trump trump)
        {
            return new Bid { Number = number, Trump = trump, ShootNumber = 0 };
        }

        public static Bid makePassBid()
        {
            return new Bid { Number = PASS_NUM, Trump = null, ShootNumber = 0 };
        }

        public static Bid makeShootBid(int shootNumber, Trump trump)
        {
            return new Bid { Number = SHOOT_NUM, Trump = trump, ShootNumber = shootNumber };
        }

        public static Bid FromString(string bid)
        {
            int tricks = int.Parse(bid.Substring(0, 1));
            int shootNum = int.Parse(bid.Substring(1, 1));
            string t = bid.Substring(2);
            Trump trump;

            if (t == string.Empty || tricks == PASS_NUM)
            {
                return makePassBid();
            }

            trump = Trump.Trumps[t];

            if (tricks == SHOOT_NUM)
            {
                return makeShootBid(shootNum, trump);
            }
            else
            {
                return makeNormalBid(tricks, trump);
            }
        }

        public bool isPass()
        {
            return Number == PASS_NUM;
        }

        public bool isShoot()
        {
            return Number == SHOOT_NUM;
        }

        public bool isNormalBid()
        {
            return Number > PASS_NUM && Number < SHOOT_NUM;
        }

        public bool isBetterThan(Bid otherBid)
        {
            if (otherBid == null) throw new Exception("Illegal null argument passed to Bid.isBetterThan().");
            //if other bid is a pass and this isn't, return true
            if (otherBid.isPass() & !this.isPass()) return true;
            //if this a shoot, but the other isn't, return true
            if (!otherBid.isShoot() & this.isShoot()) return true;
            //if both bids are passes, return false
            if (otherBid.isPass() && this.isPass()) return false;
            //if both bids are regular bids, check number
            if (otherBid.isNormalBid() && this.isNormalBid())
            {
                return Number > otherBid.Number;
            }
            //if both bids are shoots, check shoot number
            if (otherBid.isShoot() && this.isShoot())
            {
                return ShootNumber > otherBid.ShootNumber;
            }
            //all other cases, other bid is better, so return false
            return false;
        }

    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ShootTheMoon.Game
{
    public class Bid
    {
        public static readonly uint PASS_NUM = 0;
        public static readonly uint SHOOT_NUM = 9;

        public uint Number { get; set; }
        public Trump Trump { get; set; }
        public uint ShootNumber { get; set; }

        public static Bid makeNormalBid(uint number, Trump trump)
        {
            return new Bid { Number = number, Trump = trump, ShootNumber = 0 };
        }

        public static Bid makePassBid()
        {
            return new Bid { Number = PASS_NUM, Trump = null, ShootNumber = 0 };
        }

        public static Bid makeShootBid(uint shootNumber, Trump trump)
        {
            return new Bid { Number = SHOOT_NUM, Trump = trump, ShootNumber = shootNumber };
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

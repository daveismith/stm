
export interface Bid {
    number: number;
    trump: Bid.Trump;
}

export namespace Bid {

    export enum Trump { 
        SPADES = 0,
        HEARTS = 1,
        DIAMONDS = 2,
        CLUBS = 3,
        LOW = 4,
        HIGH = 5
      }

      export function trumpString(trump: Bid.Trump): String {
        switch (trump) {
            case Bid.Trump.SPADES:
                return "♠️";
            case Bid.Trump.CLUBS:
                return "♣️";
            case Bid.Trump.HEARTS:
                return "♥️";
            case Bid.Trump.DIAMONDS:
                return "♦️";
            case Bid.Trump.LOW:
                return "⬇︎";
            case Bid.Trump.HIGH:
                return "⬆︎";
            default:
                return "X";
        }
      }
} 

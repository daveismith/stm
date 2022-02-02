import { Trump } from '../../../proto/shoot_pb';

export interface Bid {
    number: number;
    shootNum: number;
    trump: Bid.Trump;
    seat: number;
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

    export function fromProtoTrump(trump: Trump): Bid.Trump {
        switch (trump) {
            case Trump.SPADES:
                return Bid.Trump.SPADES;
            case Trump.CLUBS:
                return Bid.Trump.CLUBS;
            case Trump.HEARTS:
                return Bid.Trump.HEARTS;
            case Trump.DIAMONDS:
                return Bid.Trump.DIAMONDS;
            case Trump.LOW:
                return Bid.Trump.LOW;
            case Trump.HIGH:
                return Bid.Trump.HIGH;
            default:
                return Bid.Trump.HIGH;  // Default To High
        }
    }

    export function toProtoTrump(trump: Bid.Trump): Trump | null {
        switch (trump) {
            case Bid.Trump.SPADES:
                return Trump.SPADES;
            case Bid.Trump.CLUBS:
                return Trump.CLUBS;
            case Bid.Trump.HEARTS:
                return Trump.HEARTS;
            case Bid.Trump.DIAMONDS:
                return Trump.DIAMONDS;
            case Bid.Trump.LOW:
                return Trump.LOW;
            case Bid.Trump.HIGH:
                return Trump.HIGH;
            default:
                return null;
        }
    }

} 

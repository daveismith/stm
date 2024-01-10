import { Card } from "./Card";

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

    export function stringToTrump(str: string): Bid.Trump | null {
        switch (str) {
            case "♠️":
                return Bid.Trump.SPADES;
            case "♣️":
                return Bid.Trump.CLUBS;
            case "♥️":
                return Bid.Trump.HEARTS;
            case "♦️":
                return Bid.Trump.DIAMONDS;
            case "⬇︎":
                return Bid.Trump.LOW;
            case "⬆︎": 
                return Bid.Trump.HIGH;
            default:
                return null;
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

    export function suitEqualsTrump(trump: Bid.Trump, suit: Card.Suit): boolean {
        switch (trump) {
            case Trump.CLUBS:
                return suit === Card.Suit.CLUBS;
            case Trump.DIAMONDS:
                return suit === Card.Suit.DIAMONDS;
            case Trump.HEARTS:
                return suit === Card.Suit.HEARTS;
            case Trump.SPADES:
                return suit === Card.Suit.SPADES;
            case Trump.HIGH:
            case Trump.LOW:
                return false;
        }
    }

    export function isCardTrump(trump: Bid.Trump | undefined, card: Card): boolean {
        if (trump === Trump.HIGH || trump === Trump.LOW || trump === undefined) {
            return false;   // 
        }

        if (suitEqualsTrump(trump, card.suit)) {
            return true;
        }

        if (card.rank === Card.Rank.JACK) {
            let complimentarySuit = Card.complimentarySuit(card.suit);
            return suitEqualsTrump(trump, complimentarySuit);
        }

        return false;
    }

    export function effectiveSuit(card: Card, trump: Bid.Trump) {
        if (card.rank !== Card.Rank.JACK) {
            return card.suit;
        }

        if (isCardTrump(trump, card)) {
            switch (trump) {
                case Trump.CLUBS:
                    return Card.Suit.CLUBS;
                case Trump.DIAMONDS:
                    return Card.Suit.DIAMONDS;
                case Trump.HEARTS:
                    return Card.Suit.HEARTS;
                case Trump.SPADES:
                    return Card.Suit.SPADES;
                case Trump.HIGH:
                case Trump.LOW:
                    return card.suit;
            }
        }

        return card.suit;
      }

} 

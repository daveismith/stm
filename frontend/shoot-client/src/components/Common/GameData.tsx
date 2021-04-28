
export enum Suit {
    Spade,
    Club,
    Heart,
    Diamond,
}

export namespace Suit {
    export function symbol(suit: Suit): String {
        switch (suit) {
            case Suit.Spade:
                return "♠️";
            case Suit.Club:
                return "♣️";
            case Suit.Heart:
                return "♥️";
            case Suit.Diamond:
                return "♦️";
            default:
                return "X"
        }
    }
}

export enum Rank {
    Ace = 1,
    Two,
    Three,
    Four,
    Five,
    Six,
    Seven,
    Eight,
    Nine,
    Ten,
    Jack,
    Queen,
    King
}

export namespace Rank {
    export function symbol(rank: Rank): String {
        switch (rank) {
            case Rank.Ace:
                return "A";
            case Rank.Jack:
                return "J";
            case Rank.Queen:
                return "Q";
            case Rank.King:
                return "K";
            default:
                return rank.toString()
        }
    }
}

export interface Card {
    suit: Suit,
    rank: Rank
}
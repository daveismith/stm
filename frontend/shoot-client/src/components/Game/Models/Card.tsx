
export interface Card {
    rank: Card.Rank;
    suit: Card.Suit;
}

export namespace Card {
  
    export enum Rank { 
      SEVEN = 0,
      EIGHT = 1,
      NINE = 2,
      TEN = 3,
      JACK = 4,
      QUEEN = 5,
      KING = 6,
      ACE = 7,
    }

    export enum Suit { 
        SPADES = 0,
        HEARTS = 1,
        DIAMONDS = 2,
        CLUBS = 3,
      }

      export function suitString(suit: Card.Suit): String {
        switch (suit) {
            case Card.Suit.SPADES:
                return "♠️";
            case Card.Suit.CLUBS:
                return "♣️";
            case Card.Suit.HEARTS:
                return "♥️";
            case Card.Suit.DIAMONDS:
                return "♦️";
            default:
                return "X";
        }
      }
      
      export function rankString(rank: Card.Rank): String {
        switch (rank) {
            case Card.Rank.ACE:
                return "A";
            case Card.Rank.JACK:
                return "J";
            case Card.Rank.QUEEN:
                return "Q";
            case Card.Rank.KING:
                return "K";
            case Card.Rank.TEN:
                return "10";
            case Card.Rank.NINE:
                return "9";
            case Card.Rank.EIGHT:
                return "8";
            case Card.Rank.SEVEN:
                return "7";
            default:
                return "X";
        }
      }
  }

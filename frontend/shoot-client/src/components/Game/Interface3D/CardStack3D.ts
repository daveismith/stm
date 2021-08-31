import { Vector3 } from "@babylonjs/core";
import { GameSettings } from "./GameSettings3D";
import { Card3D } from "./Card3D";
import { Card } from "../../../proto/shoot_pb";

class CardStack3D {
    cardsInStack: number = 0;
    position: Vector3 = new Vector3(0, 0, 0);
    index: Card3D[] | null[] = new Array(GameSettings.deckSize);

    static cardStackSpacing = 0.008;
    static deck: CardStack3D;
    static dealMatStacks: CardStack3D[] = [];
    static playMatStacks: CardStack3D[] = [];
    static handStacks: CardStack3D[] = [];
    static fanStacks: CardStack3D[] = [];

    static initializeCardStacks () {
        //Radius ratio of position to deal cards to
        const dealPositionRatio = 3 / 5;
        //Radius ratio of position to play cards to
        const playMatRatio = 1 / 3;
        //Radius ratio of position to hold cards in hand
        const handRatio = 5 / 6;

        for(var i = 0; i < GameSettings.players; i++) {
            CardStack3D.dealMatStacks[i] = new CardStack3D();
            CardStack3D.playMatStacks[i] = new CardStack3D();
            CardStack3D.handStacks[i] = new CardStack3D();
            CardStack3D.fanStacks[i] = new CardStack3D();
        }

        CardStack3D.deck = new CardStack3D();
        CardStack3D.deck.position = new Vector3(1.5, GameSettings.tableHeight + 0.01, 1.5);

        //Populate all card positions
        for (i = 0; i < GameSettings.players; i++) {
            CardStack3D.dealMatStacks[i].position = new Vector3(
                GameSettings.tableRadius *
                dealPositionRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.01,
                GameSettings.tableRadius *
                dealPositionRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            );
            CardStack3D.playMatStacks[i].position = new Vector3(
                GameSettings.tableRadius *
                playMatRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.01,
                GameSettings.tableRadius *
                playMatRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            );
            CardStack3D.handStacks[i].position = new Vector3(
                GameSettings.tableRadius *
                handRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.05,
                GameSettings.tableRadius *
                handRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            );
            CardStack3D.fanStacks[i].position = new Vector3(
                GameSettings.tableRadius *
                handRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.05,
                GameSettings.tableRadius *
                handRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            );
        }
    };

    removeFromStack (card: Card3D) {
        if (card.positionInDeck >= 0) this.index[card.positionInDeck] = null;
        card.positionInDeck = -1;
        this.cardsInStack--;
    }

    addToStack (card: Card3D) {
        if (card.cardStack !== null) card.cardStack.removeFromStack(card);
        this.index[this.cardsInStack] = card;
        card.positionInDeck = this.cardsInStack;
        card.cardStack = this;
        this.cardsInStack++;
    }

    static arrangeDeck (cardValues: Card[]) {
        let offset: number = GameSettings.currentPlayer;
        let swap: Card3D;
        let currentHandCard: Card;
        let targetDeckCard1Index: number;
        let targetDeckCard1: Card3D;
        let targetDeckCard2Index: number;
        let targetDeckCard2: Card3D;

        for (let i: number = 0; i < cardValues.length; i++) {
            currentHandCard = cardValues[i];
            targetDeckCard1Index = (currentHandCard.getRank()-2) * 6 + currentHandCard.getSuit() * 4;
            targetDeckCard1 = this.deck.index[targetDeckCard1Index]!;
            if (targetDeckCard1.equals(currentHandCard)) {
                swap = this.deck.index[i * GameSettings.players + offset]!;
                this.deck.index[i * GameSettings.players + offset] = targetDeckCard1;
                this.deck.index[targetDeckCard1Index] = swap;
            }
            else {
                targetDeckCard2Index = this.deck.index.length / 2 + (currentHandCard.getRank()-2) * 6 + currentHandCard.getSuit() * 4;
                targetDeckCard2 = this.deck.index[targetDeckCard2Index]!;
                swap = this.deck.index[i * GameSettings.players + offset]!;
                this.deck.index[i * GameSettings.players + offset] = targetDeckCard2;
                this.deck.index[targetDeckCard2Index] = swap;
            }
        }
    }
}

export { CardStack3D };

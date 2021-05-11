import { Vector3 } from "@babylonjs/core";
import { GameSettings } from "./GameSettings3D";
import { Card } from "./Card3D";

class CardStack {
    cardsInStack: number = 0;
    position: Vector3 = new Vector3(0, 0, 0);
    index: Card[] | null[] = new Array(GameSettings.deckSize);

    static cardStackSpacing = 0.008;
    static deck: CardStack;
    static dealMatStacks: CardStack[] = [];
    static playMatStacks: CardStack[] = [];
    static handStacks: CardStack[] = [];
    static fanStacks: CardStack[] = [];

    private static _initialize = (() => {
        //Radius ratio of position to deal cards to
        const dealPositionRatio = 3 / 5;
        //Radius ratio of position to play cards to
        const playMatRatio = 1 / 3;
        //Radius ratio of position to hold cards in hand
        const handRatio = 5 / 6;

        for(var i = 0; i < GameSettings.players; i++) {
            CardStack.dealMatStacks[i] = new CardStack();
            CardStack.playMatStacks[i] = new CardStack();
            CardStack.handStacks[i] = new CardStack();
            CardStack.fanStacks[i] = new CardStack();
        }

        CardStack.deck = new CardStack();
        CardStack.deck.position = new Vector3(1.5, GameSettings.tableHeight + 0.01, 1.5);

        //Populate all card positions
        for (var i = 0; i < GameSettings.players; i++) {
            CardStack.dealMatStacks[i].position = new Vector3(
                GameSettings.tableRadius *
                dealPositionRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.01,
                GameSettings.tableRadius *
                dealPositionRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            );
            CardStack.playMatStacks[i].position = new Vector3(
                GameSettings.tableRadius *
                playMatRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.01,
                GameSettings.tableRadius *
                playMatRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            );
            CardStack.handStacks[i].position = new Vector3(
                GameSettings.tableRadius *
                handRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.05,
                GameSettings.tableRadius *
                handRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            );
            CardStack.fanStacks[i].position = new Vector3(
                GameSettings.tableRadius *
                handRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.05,
                GameSettings.tableRadius *
                handRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            );
        }
    })();

    removeFromStack (card: Card) {
        if (card.positionInDeck >= 0) this.index[card.positionInDeck] = null;
        card.positionInDeck = -1;
        this.cardsInStack--;
    }

    addToStack (card: Card) {
        if (card.cardStack !== null) card.cardStack.removeFromStack(card);
        this.index[this.cardsInStack] = card;
        card.positionInDeck = this.cardsInStack;
        card.cardStack = this;
        this.cardsInStack++;
    }
}

export { CardStack };
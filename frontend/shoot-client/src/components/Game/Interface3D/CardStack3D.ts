import { TransformNode, Vector3 } from "@babylonjs/core";
import { GameSettings } from "./GameSettings3D";
import { Card3D } from "./Card3D";
import { Card } from "../../../proto/shoot_pb";

class CardStack3D {
    cardsInStack: number = 0;
    position: Vector3 = new Vector3(0, 0, 0);
    index: Card3D[] | null[] = new Array(GameSettings.deckSize);
    pivot: TransformNode | null = null;

    static cardStackSpacing = 0.008;
    static deck: CardStack3D;
    static dealMatStacks: CardStack3D[] = [];
    static playMatStacks: CardStack3D[] = [];
    static handStacks: CardStack3D[] = [];
    static fanStacks: CardStack3D[] = [];
    static trashStack: CardStack3D;

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
        CardStack3D.deck.pivot = new TransformNode("deckStack");
        CardStack3D.deck.pivot.position = CardStack3D.deck.position;

        CardStack3D.trashStack = new CardStack3D();
        CardStack3D.trashStack.position = new Vector3(0, 0, 0);

        // let test = MeshBuilder.CreateBox("test", {
        //     width: (1.4 * 3) / 4,
        //     height: CardStack3D.cardStackSpacing * GameSettings.deckSize,
        //     depth: (1 * 3) / 4}
        // );
        // test.position = CardStack3D.deck.position.clone();
        // test.position.x += 1;

        let fanStackAxis: Vector3;
        let fanStackAngle: number;

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
            CardStack3D.dealMatStacks[i].pivot = new TransformNode("dealMatStack" + i);
            CardStack3D.dealMatStacks[i].pivot!.position = CardStack3D.dealMatStacks[i].position;

            CardStack3D.playMatStacks[i].position = new Vector3(
                GameSettings.tableRadius *
                playMatRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.01,
                GameSettings.tableRadius *
                playMatRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            );
            CardStack3D.playMatStacks[i].pivot = new TransformNode("playMatStack" + i);
            CardStack3D.playMatStacks[i].pivot!.position = CardStack3D.playMatStacks[i].position;
            
            CardStack3D.handStacks[i].position = new Vector3(
                GameSettings.tableRadius *
                handRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.05,
                GameSettings.tableRadius *
                handRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            );
            CardStack3D.handStacks[i].pivot = new TransformNode("handStack" + i);
            CardStack3D.handStacks[i].pivot!.position = CardStack3D.handStacks[i].position;
            
            CardStack3D.fanStacks[i].position = new Vector3(
                GameSettings.tableRadius *
                handRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.1,
                GameSettings.tableRadius *
                handRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            );
            CardStack3D.fanStacks[i].pivot = new TransformNode("fanStack" + i);
            CardStack3D.fanStacks[i].pivot!.position = CardStack3D.fanStacks[i].position;            
            fanStackAxis = new Vector3(0, 1, 0);
            fanStackAngle = i * 2 * Math.PI / GameSettings.players - Math.PI;
            CardStack3D.fanStacks[i].pivot?.rotate(fanStackAxis, fanStackAngle);
            fanStackAxis = new Vector3(1, 0, 0);
            fanStackAngle = -1/6 * Math.PI;
            CardStack3D.fanStacks[i].pivot?.rotate(fanStackAxis, fanStackAngle);
        }
    };

    removeFromStack (card: Card3D) {
        if (card.positionInStack >= 0) this.index[card.positionInStack] = null;
        card.positionInStack = -1;
        this.cardsInStack--;
    }

    addToStack (card: Card3D) {
        let firstEmpty: number = -1;
        // find the first empty slot
        for (let i: number = 0; i < this.index.length; i++)
            if (!this.index[i]) {
                firstEmpty = i;
                break;
            }
        // if no empty slots, add one at the end
        if (firstEmpty === -1) firstEmpty = this.cardsInStack;

        // remove from old stack
        if (card.cardStack !== null) card.cardStack.removeFromStack(card);

        // add to this stack
        this.index[firstEmpty] = card;
        card.positionInStack = firstEmpty;
        card.cardStack = this;
        this.cardsInStack++;
    }

    // Arrange the deck so that the cards we need for the client will be dealt to them.
    static arrangeDeck (cardValues: Card[]) {
        let offset: number = GameSettings.currentPlayer;
        let currentHandCard: Card;
        let swapDestinationIndex: number;
        let targetDeckCard1Index: number;
        let targetDeckCard1: Card3D;
        let targetDeckCard2Index: number;
        let targetDeckCard2: Card3D | null = null;
        let targetDeckCard3: Card3D;

        for (let i: number = 0; i < cardValues.length; i++) {
            currentHandCard = cardValues[i];
            swapDestinationIndex = i * GameSettings.players + offset; // Find the right card and swap it into this spot.

            targetDeckCard1Index = (currentHandCard.getRank()-2) * 4 + currentHandCard.getSuit();
            targetDeckCard2Index = targetDeckCard1Index + 24;

            targetDeckCard1 = this.deck.index[targetDeckCard1Index]!;
            if (GameSettings.cardCopies > 1) targetDeckCard2 = this.deck.index[targetDeckCard2Index]!;

            if (targetDeckCard1.equals(currentHandCard)) { // First place to look.
                // Update deck position trackers.
                this.deck.index[swapDestinationIndex]!.positionInStack = targetDeckCard1Index;
                targetDeckCard1.positionInStack = swapDestinationIndex;

                // Swap cards.
                [this.deck.index[targetDeckCard1Index], this.deck.index[swapDestinationIndex]] =
                    [this.deck.index[swapDestinationIndex], this.deck.index[targetDeckCard1Index]];
            }
            else if (targetDeckCard2 && targetDeckCard2.equals(currentHandCard)) { // Second place to look.
                // Update deck position trackers.
                this.deck.index[swapDestinationIndex]!.positionInStack = targetDeckCard2Index;
                targetDeckCard2.positionInStack = swapDestinationIndex;

                // Swap cards.
                [this.deck.index[targetDeckCard2Index], this.deck.index[swapDestinationIndex]] =
                    [this.deck.index[swapDestinationIndex], this.deck.index[targetDeckCard2Index]];
            }
            else { // If for some reason the card isn't in either original spot, just search for it.
                let matched: boolean = false;
                let j: number = 0;

                while (j < this.deck.index.length && !matched) {
                    targetDeckCard3 = this.deck.index[j]!;
                    if (targetDeckCard3.equals(currentHandCard)) {
                        // Update deck position trackers.
                        this.deck.index[swapDestinationIndex]!.positionInStack = j;
                        targetDeckCard3.positionInStack = swapDestinationIndex;

                        // Swap cards.
                        [this.deck.index[j], this.deck.index[swapDestinationIndex]] =
                            [this.deck.index[swapDestinationIndex], this.deck.index[j]];

                        matched = true;
                    }

                    j++;
                }

                if (!matched) throw new Error('error arranging cards');
            }
        }
    }
}

export { CardStack3D };

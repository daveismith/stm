import { SeatDetails, Hand, Bid as BidDetails, TrumpUpdate, PlayedCard, Card } from '../../../proto/shoot_pb';
import { Seat } from "../Models/Seat";
import { Bid } from "../Models/Bid";
import { GameSettings } from "./GameSettings3D";
import { arrangeCardsInDeck, baseRotation } from "./SceneFunctions";
import { SeatCube } from "./SeatCube";
import { Nameplate } from "./Nameplate";
import { BidNumberCube } from './BidNumberCube';
import { BidSuitCube } from './BidSuitCube';
import { ReadyCube } from './ReadyCube';
import { Seat3D } from './Seat3D';
import { Card3D } from './Card3D';
import { Scene, PointLight } from '@babylonjs/core';
import { CardStack3D } from './CardStack3D';
import { GameEvent3D } from './GameEvent3D';

enum GameState {
    Unknown = -1,
    ChoosingSeat = 0,
    WaitingForSeatConfirmation = 1,
    SeatedNotReady = 2,
    WaitingForReadyConfirmation = 3,
    SeatedReady = 4,
    ObservingBids = 10,
    ChoosingBid = 11,
    WaitingForBidConfirmation = 12,
    ObservingPlay = 100,
    ChoosingPlay = 101
}

class SceneController {
    static scene: Scene;
    static seatCubes: SeatCube[] = [];
    static bidNumberCubes: BidNumberCube[][] = [];
    static bidSuitCubes: BidSuitCube[][] = [];
    static nameplates: Nameplate[] = [];
    static unreadyCubes: ReadyCube[] = [];
    static readyCubes: ReadyCube[] = [];
    static turnLight: PointLight;
    static seats: Seat3D[] = [];
    static bids: Bid[] = [];
    static hand: Card3D[] = [];
    static currentBid: Bid;
    static gameState: GameState = GameState.ChoosingSeat;
    static currentTrump: TrumpUpdate;
    static currentCard: Card3D | null;
    static currentCardsInTrick: Card3D[] = [];
    static eventQueue: Map<number, GameEvent3D> = new Map();
    static nextEventNumber: number = 0;
    static awaitingServerResponse: boolean = false;
    static awaitingAnimation: boolean = false;

    static addNewEvent (newEvent: GameEvent3D) {
        let newEventSequence: number = newEvent.notification.getSequence();

        // skip the new event if it seems to be a duplicate of one we've already processed.
        if (newEventSequence >= this.nextEventNumber) {
            this.eventQueue.set(newEventSequence, newEvent);
            console.log("added event " + newEventSequence);
        }
        
        this.processNextEvent();
    }

    static processNextEvent () {
        let nextEvent : GameEvent3D | undefined;

        // don't process any events while we're waiting for a response
        if (this.awaitingServerResponse || this.awaitingAnimation) setTimeout(() => { this.processNextEvent(); }, 100);
        else nextEvent = this.eventQueue.get(this.nextEventNumber);

        // if we're ready and there's an event available, process it
        if (nextEvent) {
            console.log("processing event " + nextEvent.notification.getSequence());

            nextEvent.execute();

            this.eventQueue.delete(nextEvent.notification.getSequence());

            this.nextEventNumber++;

            this.processNextEvent();
        }
    }

    static tricksListener () {
        this.currentCardsInTrick = [];

        this.awaitingAnimation = true;
        setTimeout(() => {
            Card3D.clearCards();
            this.awaitingAnimation = false;
        }, 3000);
    }

    static seatsListener (seatDetailsList: SeatDetails[]) {
        // console.log('seat list event');

        for (let seatDetails of seatDetailsList) {
            const seat: Seat = {
                index: seatDetails.getSeat(),
                name: seatDetails.getName(),
                empty: seatDetails.getEmpty(),
                human: seatDetails.getHuman(),
                ready: seatDetails.getReady(),
            };

            // Add the seat to the 3D state
            if (!this.seats[seat.index])
                this.seats[seat.index] = new Seat3D(seat.index, seat.name, seat.empty, seat.human, seat.ready);
            else {
                this.seats[seat.index].name = seat.name;
                this.seats[seat.index].empty = seat.empty;
                this.seats[seat.index].human = seat.human;
                this.seats[seat.index].ready = seat.ready;
            }

            if (!seat.empty) { // Someone is in the seat, so disable the take-seat button and update the name.
                if (this.seatCubes[seat.index]) this.seatCubes[seat.index].hideAndDisable();
                if (this.nameplates[seat.index]) this.nameplates[seat.index].updateName(seat.index + ":" + seat.name);
                if (seat.ready) {
                    if (this.readyCubes[seat.index]) this.readyCubes[seat.index].show();
                    if (this.unreadyCubes[seat.index]) this.unreadyCubes[seat.index].hide();
                }
                else {
                    if (this.unreadyCubes[seat.index]) this.unreadyCubes[seat.index].show();
                    if (this.readyCubes[seat.index]) this.readyCubes[seat.index].hide();
                }
            }
            else // No one in the seat, so apply the empty-seat nameplate.
            {
                if (this.nameplates[seat.index]) this.nameplates[seat.index].updateName(Nameplate.emptySeatLabel);
            }
        }
    }

    // Server response to our take-seat request.
    static seatRequestResponseListener (seatNumber: number, success: boolean) {
        if (success) {
            // Assign seat number to the client player.
            GameSettings.currentPlayer = seatNumber;

            this.moveCameraToSeat(GameSettings.currentPlayer);
            // this.nameplates[seatNumber].disable();

            // Hide seat selection buttons.
            for (let seatCube of this.seatCubes) {
                seatCube.hideAndDisable();
            }

            // Show start-game ready buttons.
            for (let seat of this.seats) {
                if (seat.ready) this.readyCubes[seat.index].show();
                else this.unreadyCubes[seat.index].show();
            }

            // Show the client's ready button, defaulting to not ready.
            this.unreadyCubes[seatNumber].enable();

            this.gameState = GameState.SeatedNotReady;
        }

        this.awaitingServerResponse = false;
    }

    // Server response to our ready-status request.
    static readyStatusRequestResponseListener (readyStatus: boolean, success: boolean) {
        if (this.readyCubes[GameSettings.currentPlayer] && this.unreadyCubes[GameSettings.currentPlayer]) {

            if (success) {
                if (readyStatus && this.gameState === GameState.WaitingForReadyConfirmation)
                {
                    this.unreadyCubes[GameSettings.currentPlayer].disable();
                    this.unreadyCubes[GameSettings.currentPlayer].hide();
                    this.readyCubes[GameSettings.currentPlayer].enable();
                    this.readyCubes[GameSettings.currentPlayer].show();

                    this.gameState = GameState.SeatedReady;
                }
                else if (this.gameState === GameState.WaitingForReadyConfirmation)
                {
                    this.readyCubes[GameSettings.currentPlayer].disable();
                    this.readyCubes[GameSettings.currentPlayer].hide();
                    this.unreadyCubes[GameSettings.currentPlayer].enable();
                    this.unreadyCubes[GameSettings.currentPlayer].show();

                    this.gameState = GameState.SeatedNotReady;
                }
            }
        }

        this.awaitingServerResponse = false;
    }

    static startGameListener () {
        for (let seatCube of this.seatCubes) {
            seatCube.hideAndDisable();
        }
        for (let unreadyCube of this.unreadyCubes) {
            if (unreadyCube.startGameModeActive) {
                unreadyCube.hide();
                unreadyCube.disable();
                unreadyCube.confirmBidMode();
            }
        }
        for (let readyCube of this.readyCubes) {
            if (readyCube.startGameModeActive) {
                readyCube.hide();
                readyCube.disable();
                readyCube.confirmBidMode();
            }
        }

        this.gameState = GameState.ObservingBids;
    }

    static handListener (hand: Hand) {
        this.hand = [];
        this.currentCard = null;
        this.currentCardsInTrick = [];

        CardStack3D.arrangeDeck(hand.getHandList());

        arrangeCardsInDeck(this.scene, CardStack3D.deck);

        this.awaitingAnimation = true;
        setTimeout(() => {
            Card3D.dealCards(this.scene);
            // don't reset awaitingAnimation because we want to go straight to picking up cards.
        }, 1000);

        this.awaitingAnimation = true;
        setTimeout(() => {
            this.pickUpListener();
            this.awaitingAnimation = false;
        }, 7500);
    }

    static pickUpListener () {
        for (let i: number = 0; i < GameSettings.players; i++)
            Card3D.pickUpCards(i, this.scene);

        setTimeout(() => { this.fanListener() }, 2000);
    }

    static fanListener () {
        for (let i: number = 0; i < GameSettings.players; i++)
            Card3D.fanCards(i, this.scene);
    }

    static bidRequestListener () {
        let player: number = GameSettings.currentPlayer;
        let highestBid: number = 0;

        if (this.currentBid) highestBid = this.currentBid.number;

        // Activate bidding cubes for the client player.
        for (let j = 0; j < this.bidSuitCubes[player].length; j++) {
            this.bidSuitCubes[player][j].enableAndShow();
        }
        for (let j = 0; j < this.bidNumberCubes[player].length; j++) {
            // If the cube number is higher than the current bid then show it, otherwise hide it.
            if (this.bidNumberCubes[player][j].tricks > highestBid || j === this.bidNumberCubes[player].length-1)
                this.bidNumberCubes[player][j].enableAndShow();
            else
                this.bidNumberCubes[player][j].disableAndHide();
        }

        // Hide all unready and ready cubes and set them to bid mode.
        for (let unreadyCube of this.unreadyCubes) {
            if (unreadyCube.startGameModeActive) {
                unreadyCube.hide();
                unreadyCube.disable();
                unreadyCube.confirmBidMode();
            }
        }
        for (let readyCube of this.readyCubes) {
            if (readyCube.startGameModeActive) {
                readyCube.hide();
                readyCube.disable();
                readyCube.confirmBidMode();
            }
        }

        // Enable the unready cube just for the client player as a bid-ready button.
        this.unreadyCubes[player].enable();
        this.unreadyCubes[player].show();

        this.gameState = GameState.ChoosingBid;
    }

    static bidResponseListener (tricks: number, shootNum: number, trump: Bid.Trump, seat: number) {
        if (this.gameState >= 100) return;

        let player: number = GameSettings.currentPlayer;

        // Show bid as ready
        this.unreadyCubes[seat].disable();
        this.unreadyCubes[seat].hide();
        this.readyCubes[seat].enable();
        this.readyCubes[seat].show();

        for (let bidSuitCube of this.bidSuitCubes[player]) {
            if (!bidSuitCube.isActiveCube) bidSuitCube.disableAndHide();
            else {
                bidSuitCube.deactivate(this.scene);
                bidSuitCube.disable();
            }
        }

        for (let bidNumberCube of this.bidNumberCubes[player]) {
            if (!bidNumberCube.isActiveCube) bidNumberCube.disableAndHide();
            else {
                bidNumberCube.deactivate(this.scene);
                bidNumberCube.disable();
            }
        }

        this.gameState = GameState.ObservingBids;

        this.awaitingServerResponse = false;
    }

    static bidsListener (bidDetailsList: BidDetails[]) {
        let player: number = GameSettings.currentPlayer;
        this.bids = []; // reset the bid list
        let highestBid: number = 0;

        for (let bidDetails of bidDetailsList) {
            const bid: Bid = {
                number: bidDetails.getTricks(),
                shootNum: bidDetails.getShootNum(),
                trump: bidDetails.getTrump(),
                seat: bidDetails.getSeat(),
            };
            this.bids[bid.seat] = bid; // Store the bid for later use.
            if (bid.number > 0) {
                this.currentBid = bid; // If the bid is not a pass, make it the current highest bid.

                // show bid cubes for other players' bids
                this.bidNumberCubes[bid.seat][bid.number-1].show();
                this.bidSuitCubes[bid.seat][bid.trump].show();
            }
        }

        console.log(this.bids);

        // Make sure that invalid bid cubes are disabled if they haven't been already.
        if (this.gameState === GameState.ChoosingBid) {
            if (this.currentBid) highestBid = this.currentBid.number;

            // Disable invalid cubes. Only do n-1 since we never want to disable the shoot cube.
            for (let j = 0; j < this.bidNumberCubes[player].length - 1; j++) {
                if (this.bidNumberCubes[player][j].tricks <= highestBid)
                    this.bidNumberCubes[player][j].disableAndHide();
            }
        }
    }

    static trumpUpdateListener(trumpUpdate: TrumpUpdate) {
        this.currentTrump = trumpUpdate;
        let seat: number = trumpUpdate.getSeat();
        let nameplate: Nameplate = this.nameplates[seat];

        if (nameplate) {
            let trump: Bid.Trump = Bid.fromProtoTrump(trumpUpdate.getTrump());
            nameplate.updateName(nameplate.name + ": " + trumpUpdate.getTricks() + Bid.trumpString(trump));
        }

        for (let seat of this.seats) {
            for (let bidSuitCube of this.bidSuitCubes[seat.index]) {
                bidSuitCube.deactivate(this.scene);
                bidSuitCube.disableAndHide();
            }

            for (let bidNumberCube of this.bidNumberCubes[seat.index]) {
                bidNumberCube.deactivate(this.scene);
                bidNumberCube.disableAndHide();
            }

            this.readyCubes[seat.index].disable();
            this.readyCubes[seat.index].hide();
            this.unreadyCubes[seat.index].disable();
            this.unreadyCubes[seat.index].hide();
        }

        if (this.gameState < 100) this.gameState = GameState.ObservingPlay;
    }

    static cardRequestListener() {
        for (let card of this.hand) card.toggleGlow(true);
        this.gameState = GameState.ChoosingPlay;
    }

    static playCardResponseListener(playedCard: Card, success: boolean) {
        // To do: check if playedCard is the same as this.currentCard?

        if (success) {
            let card: Card3D | null = this.currentCard;

            card && card.playCardAnimation(GameSettings.currentPlayer, this.scene);

            for (let card of this.hand) card.toggleGlow(false);

            this.gameState = GameState.ObservingPlay;
        } else {
            console.log("Error Playing Card");
        }

        this.awaitingServerResponse = false;
    }

    static playedCardsListener(cardsList: Array<PlayedCard>) {
        let sourceCardLocation: number[] | null;
        let destinationCardLocation: number[] | null = null;
        let playedCard: PlayedCard;
        let order: number = -1;
        let seat: number = -1;
        let card: Card | undefined;
        let card3D: Card3D | null;

        console.log(cardsList);

        for (let i: number = 0; i < cardsList.length; i++) {
            playedCard = cardsList[i];

            if (playedCard) {
                order = playedCard.getOrder();
                seat = playedCard.getSeat();
                card = playedCard.getCard();
            }

             // Skip if this card has already been played in the UI
             // Skip if it's our card, let it be handled by playCardResponseListener 
            if (!this.currentCardsInTrick[order] && card && seat !== GameSettings.currentPlayer) {
                console.log("searching for " + card.getRank() + card.getSuit());
                console.log(CardStack3D.fanStacks[seat].index);
                sourceCardLocation = Card3D.findCardInHands(card);
                if (!sourceCardLocation) throw new Error("could not find source card to swap");

                for (let j: number = 0; j < CardStack3D.fanStacks[seat].index.length; j++) {
                    if (CardStack3D.fanStacks[seat].index[j]) {
                        destinationCardLocation = [seat, j];
                        break;
                    }
                }
                if (!destinationCardLocation) throw new Error("could not find destination card to swap");

                // find the actual card and swap it into the right spot before playing it
                if (sourceCardLocation && destinationCardLocation) Card3D.swapCards(sourceCardLocation, destinationCardLocation);
                else throw new Error("could not find cards to swap");

                card3D = CardStack3D.fanStacks[seat].index[destinationCardLocation[1]];

                if (card3D) {
                    card3D.playCardAnimation(seat, this.scene);
                 
                    this.currentCardsInTrick[order] = card3D;
                }
            }
        }
    }

    static moveCameraToSeat(seatNumber: number) {
        GameSettings.camera.target = GameSettings.cameraTargets[seatNumber];
        GameSettings.camera.alpha = -1 * baseRotation(seatNumber).y + Math.PI;
        GameSettings.camera.beta = GameSettings.cameraBeta;
        GameSettings.camera.radius = GameSettings.cameraRadius;
    }
}

export { SceneController, GameState };

import { Notification, SeatDetails, Hand, Bid as BidDetails, TrumpUpdate, PlayCardRequest, PlayedCard, Card, Tricks } from '../../../proto/shoot_pb';
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
    WaitingForHand = 10,
    WaitingToBid = 11,
    ChoosingBid = 12,
    WaitingForBidConfirmation = 13,
    WaitingForBidEnd = 14,
    ChoosingTransfer = 15,
    WaitingForTransferConfirmation = 16,
    WaitingForTransfer = 17,
    WaitingForTransfersEnd = 18,
    ChoosingThrowaway = 19,
    WaitingForThrowawayConfirmation = 20,
    WaitingForThrowawaysEnd = 21,
    WaitingToPlay = 100,
    ChoosingPlay = 101,
    WaitingForTrickEnd = 102,
    WaitingForGameEnd = 1000
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
    static currentBid: Bid | null = null;
    static gameState: GameState = GameState.ChoosingSeat;
    static gameStateEventTypeMap: number[][] = [];
    static currentTrump: TrumpUpdate;
    static currentCard: Card3D | null;
    static currentCardsInTrick: Card3D[] = [];
    static eventQueue: Map<number, GameEvent3D> = new Map();
    static deferredEventQueue: Map<number, GameEvent3D> = new Map();
    static nextEventNumber: number = 0;
    static awaitingServerResponse: boolean = false;
    static awaitingAnimation: boolean = false;
    static clientIn3DMode: boolean = false;
    static transferRecipient: number = -1;

    static initialize () {
        this.gameStateEventTypeMap = [];

        // Set game state to event type map
        this.gameStateEventTypeMap[GameState.ChoosingSeat] = [];
        this.gameStateEventTypeMap[GameState.ChoosingSeat][Notification.NotificationCase.SEAT_LIST] = 1;
        this.gameStateEventTypeMap[GameState.ChoosingSeat][Notification.NotificationCase.SEAT_UPDATE] = 1;
        this.gameStateEventTypeMap[GameState.ChoosingSeat][Notification.NotificationCase.START_GAME] = 1;
        this.gameStateEventTypeMap[GameState.ChoosingSeat][Notification.NotificationCase.JOIN_RESPONSE] = 1;
        this.gameStateEventTypeMap[GameState.ChoosingSeat][Notification.NotificationCase.TRICKS] = 1;
        this.gameStateEventTypeMap[GameState.ChoosingSeat][Notification.NotificationCase.SCORES] = 1;

        this.gameStateEventTypeMap[GameState.WaitingForSeatConfirmation] = [];
        this.gameStateEventTypeMap[GameState.WaitingForSeatConfirmation][Notification.NotificationCase.SEAT_LIST] = 1;
        this.gameStateEventTypeMap[GameState.WaitingForSeatConfirmation][Notification.NotificationCase.SEAT_UPDATE] = 1;
        this.gameStateEventTypeMap[GameState.WaitingForSeatConfirmation][Notification.NotificationCase.JOIN_RESPONSE] = 1;

        this.gameStateEventTypeMap[GameState.SeatedNotReady] = [];
        this.gameStateEventTypeMap[GameState.SeatedNotReady][Notification.NotificationCase.SEAT_LIST] = 1;
        this.gameStateEventTypeMap[GameState.SeatedNotReady][Notification.NotificationCase.SEAT_UPDATE] = 1;
        this.gameStateEventTypeMap[GameState.SeatedNotReady][Notification.NotificationCase.START_GAME] = 1;
        this.gameStateEventTypeMap[GameState.SeatedNotReady][Notification.NotificationCase.TRICKS] = 1;
        this.gameStateEventTypeMap[GameState.SeatedNotReady][Notification.NotificationCase.SCORES] = 1;
        this.gameStateEventTypeMap[GameState.SeatedNotReady][Notification.NotificationCase.JOIN_RESPONSE] = 1;

        this.gameStateEventTypeMap[GameState.WaitingForReadyConfirmation] = [];
        this.gameStateEventTypeMap[GameState.WaitingForReadyConfirmation][Notification.NotificationCase.SEAT_LIST] = 1;
        this.gameStateEventTypeMap[GameState.WaitingForReadyConfirmation][Notification.NotificationCase.SEAT_UPDATE] = 1;
        this.gameStateEventTypeMap[GameState.WaitingForReadyConfirmation][Notification.NotificationCase.JOIN_RESPONSE] = 1;
        
        this.gameStateEventTypeMap[GameState.SeatedReady] = [];
        this.gameStateEventTypeMap[GameState.SeatedReady][Notification.NotificationCase.SEAT_LIST] = 1;
        this.gameStateEventTypeMap[GameState.SeatedReady][Notification.NotificationCase.SEAT_UPDATE] = 1;
        this.gameStateEventTypeMap[GameState.SeatedReady][Notification.NotificationCase.START_GAME] = 1;
        this.gameStateEventTypeMap[GameState.SeatedReady][Notification.NotificationCase.TRICKS] = 1;
        this.gameStateEventTypeMap[GameState.SeatedReady][Notification.NotificationCase.SCORES] = 1;
        this.gameStateEventTypeMap[GameState.SeatedReady][Notification.NotificationCase.JOIN_RESPONSE] = 1;

        this.gameStateEventTypeMap[GameState.WaitingForHand] = [];
        this.gameStateEventTypeMap[GameState.WaitingForHand][Notification.NotificationCase.HAND] = 1;
        this.gameStateEventTypeMap[GameState.WaitingForHand][Notification.NotificationCase.TRICKS] = 1;
        this.gameStateEventTypeMap[GameState.WaitingForHand][Notification.NotificationCase.SCORES] = 1;

        this.gameStateEventTypeMap[GameState.WaitingToBid] = [];
        this.gameStateEventTypeMap[GameState.WaitingToBid][Notification.NotificationCase.BID] = 1;
        this.gameStateEventTypeMap[GameState.WaitingToBid][Notification.NotificationCase.BID_LIST] = 1;
        this.gameStateEventTypeMap[GameState.WaitingToBid][Notification.NotificationCase.BID_REQUEST] = 1;
        this.gameStateEventTypeMap[GameState.WaitingToBid][Notification.NotificationCase.TRICKS] = 1;
        this.gameStateEventTypeMap[GameState.WaitingToBid][Notification.NotificationCase.SCORES] = 1;

        this.gameStateEventTypeMap[GameState.ChoosingBid] = [];
        this.gameStateEventTypeMap[GameState.ChoosingBid][Notification.NotificationCase.BID] = 1;
        this.gameStateEventTypeMap[GameState.ChoosingBid][Notification.NotificationCase.BID_LIST] = 1;
        this.gameStateEventTypeMap[GameState.ChoosingBid][Notification.NotificationCase.TRICKS] = 1;
        this.gameStateEventTypeMap[GameState.ChoosingBid][Notification.NotificationCase.SCORES] = 1;

        this.gameStateEventTypeMap[GameState.WaitingForBidConfirmation] = [];
        this.gameStateEventTypeMap[GameState.WaitingForBidConfirmation][Notification.NotificationCase.BID_LIST] = 1;
        this.gameStateEventTypeMap[GameState.WaitingForBidConfirmation][Notification.NotificationCase.TRICKS] = 1;
        this.gameStateEventTypeMap[GameState.WaitingForBidConfirmation][Notification.NotificationCase.SCORES] = 1;

        this.gameStateEventTypeMap[GameState.WaitingForBidEnd] = [];
        this.gameStateEventTypeMap[GameState.WaitingForBidEnd][Notification.NotificationCase.BID_LIST] = 1;
        this.gameStateEventTypeMap[GameState.WaitingForBidEnd][Notification.NotificationCase.TRUMP_UPDATE] = 1;
        this.gameStateEventTypeMap[GameState.WaitingForBidEnd][Notification.NotificationCase.TRICKS] = 1;
        this.gameStateEventTypeMap[GameState.WaitingForBidEnd][Notification.NotificationCase.SCORES] = 1;

        this.gameStateEventTypeMap[GameState.ChoosingTransfer] = [];
        this.gameStateEventTypeMap[GameState.ChoosingTransfer][Notification.NotificationCase.TRANSFER_COMPLETE] = 1;

        this.gameStateEventTypeMap[GameState.WaitingForTransfersEnd] = [];
        this.gameStateEventTypeMap[GameState.WaitingForTransfersEnd][Notification.NotificationCase.TRANSFER_COMPLETE] = 1;

        this.gameStateEventTypeMap[GameState.WaitingToPlay] = [];
        this.gameStateEventTypeMap[GameState.WaitingToPlay][Notification.NotificationCase.PLAY_CARD_REQUEST] = 1;
        this.gameStateEventTypeMap[GameState.WaitingToPlay][Notification.NotificationCase.PLAYED_CARDS] = 1;
        this.gameStateEventTypeMap[GameState.WaitingToPlay][Notification.NotificationCase.TRANSFER_REQUEST] = 1;
        this.gameStateEventTypeMap[GameState.WaitingToPlay][Notification.NotificationCase.TRANSFER] = 1;
        this.gameStateEventTypeMap[GameState.WaitingToPlay][Notification.NotificationCase.THROWAWAY_REQUEST] = 1;

        this.gameStateEventTypeMap[GameState.ChoosingPlay] = [];
        this.gameStateEventTypeMap[GameState.ChoosingPlay][Notification.NotificationCase.PLAY_CARD_REQUEST] = 1;

        this.gameStateEventTypeMap[GameState.WaitingForTrickEnd] = [];
        this.gameStateEventTypeMap[GameState.WaitingForTrickEnd][Notification.NotificationCase.PLAYED_CARDS] = 1;
        this.gameStateEventTypeMap[GameState.WaitingForTrickEnd][Notification.NotificationCase.TRICKS] = 1;
        this.gameStateEventTypeMap[GameState.WaitingForTrickEnd][Notification.NotificationCase.SCORES] = 1;
    }

    static addNewEvent (newEvent: GameEvent3D) {
        let newEventSequence: number = newEvent.notification.getSequence();

        // skip the new event if it seems to be a duplicate of one we've already processed.
        if (newEventSequence >= this.nextEventNumber) {
            this.eventQueue.set(newEventSequence, newEvent);
            console.log("added event " + newEventSequence);
        }
        
        if (!this.clientIn3DMode) return; // don't process any new events if we're not in 3D mode.

        this.processNextEvent();
    }

    static processNextEvent () {
        let nextEvent : GameEvent3D | undefined;

        // don't process any events while we're waiting for a response
        if (this.awaitingServerResponse || this.awaitingAnimation) setTimeout(() => { this.processNextEvent(); }, 100);
        else {
            // prioritize valid deferred events
            nextEvent = this.getNextDeferredEvent();

            // if there's a deferred event, process it.  otherwise get the next regular event
            if (nextEvent) {
                console.log("processing deferred event " + nextEvent.notification.getSequence());

                nextEvent.execute();

                if (!this.clientIn3DMode) return; // don't process any new events if we're not in 3D mode.

                this.processNextEvent();
            }
            else { // get next regular event
                console.log ("fetching regular event " + this.nextEventNumber);
                nextEvent = this.eventQueue.get(this.nextEventNumber);

                // if there's an event available but it's out of order, defer it
                if (nextEvent && !this.checkEventIsValid(nextEvent)) this.deferEvent(nextEvent);
                // if there's still an event available, process it
                else if (nextEvent) {
                    console.log("processing event " + nextEvent.notification.getSequence());

                    nextEvent.execute();

                    this.eventQueue.delete(nextEvent.notification.getSequence());

                    this.nextEventNumber++;

                    if (!this.clientIn3DMode) return; // don't process any new events if we're not in 3D mode.

                    this.processNextEvent();
                }
            }
        }
    }


    static deferEvent (event: GameEvent3D) {
        let eventSequence: number = event.notification.getSequence();

        console.log("deferring event:" + eventSequence + ". current state:" + this.gameState);

        // add this event to the deferred queue since it was out of order
        this.deferredEventQueue.set(eventSequence, event);

        // remove it from the main queue
        this.eventQueue.delete(eventSequence);

        this.nextEventNumber++;
    }

    static getNextDeferredEvent (): GameEvent3D | undefined {
        let eventCandidate: GameEvent3D | undefined;

        for (let i: number = 0; i < this.nextEventNumber; i++) {
            eventCandidate = this.deferredEventQueue.get(i);

            if (eventCandidate && this.checkEventIsValid(eventCandidate)) {
                console.log("fetching deferred event " + i);

                // since it's valid now, remove it from the deferred queue
                this.deferredEventQueue.delete(i);

                return eventCandidate;
            }
        }
    }

    static checkEventIsValid (event: GameEvent3D): boolean {
        let eventType: Notification.NotificationCase = event.notification.getNotificationCase();

        let valid: number | undefined;

        valid = this.gameStateEventTypeMap[this.gameState][eventType];

        console.log("validating event seq-" + event.notification.getSequence() + ":state-" + this.gameState + ":type-" + eventType + ":valid-" + valid);

        return valid === 1;
    }

    static tricksListener (tricks: Tricks) {
        let tricksRemainingInHand = tricks.getTricksRemainingInHand() ?? 0;
        console.log("tricks remaining: " + tricksRemainingInHand);

        this.currentCardsInTrick = [];

        this.awaitingAnimation = true;
        setTimeout(() => {
            Card3D.clearCards(this.scene);
            this.awaitingAnimation = false;
        }, 3000);

        if (this.gameState >= GameState.WaitingToPlay && tricksRemainingInHand > 0) // trick complete, ready for next trick
            this.gameState = GameState.WaitingToPlay;
        else if (this.gameState >= GameState.WaitingToPlay) { // hand complete, ready for next hand
            this.currentBid = null;
            for (let nameplate of this.nameplates) nameplate.resetToDefault();
            this.gameState = GameState.WaitingForHand;
        }
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
                if (this.nameplates[seat.index]) this.nameplates[seat.index].updateName(seat.index + ":" + seat.name, true);
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
                if (this.nameplates[seat.index]) this.nameplates[seat.index].updateName(Nameplate.emptySeatLabel, true);
            }
        }
    }

    // Server response to our take-seat request.
    static seatRequestResponseListener (seatNumber: number, success: boolean) {
        if (success) {
            console.log('take seat request successful: seat ' + seatNumber);

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
        } else {
            console.log('take seat request failed');
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

        this.gameState = GameState.WaitingForHand;
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

            this.gameState = GameState.WaitingToBid;
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
        if (!this.clientIn3DMode) return;
        if (this.gameState >= 100) return;

        if (!this.clientIn3DMode) return;

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

        this.gameState = GameState.WaitingForBidEnd;

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
            nameplate.updateName(nameplate.name + ": " + trumpUpdate.getTricks() + Bid.trumpString(trump), false);
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

        if (this.gameState < 100) this.gameState = GameState.WaitingToPlay;
    }

    static cardRequestListener(playCardRequest: PlayCardRequest) {
        let seat: number = playCardRequest.getSeat();

        if (seat === GameSettings.currentPlayer) {
            for (let card of this.hand) card.toggleGlow(true);
            this.gameState = GameState.ChoosingPlay;
        }
    }

    static playCardResponseListener(playedCard: Card, success: boolean) {
        // To do: check if playedCard is the same as this.currentCard?

        if (!this.clientIn3DMode) return;

        if (success) {
            let card: Card3D | null = this.currentCard;

            card && card.playCardAnimation(GameSettings.currentPlayer, this.scene);

            for (let card of this.hand) card.toggleGlow(false);

            this.gameState = GameState.WaitingForTrickEnd;
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

        function animate(card3D: Card3D, seat: number) {
            setTimeout(() => {
                card3D && card3D.playCardAnimation(seat, SceneController.scene);
                SceneController.awaitingAnimation = false;
            }, 1000);
        }

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
                console.log("order: " + order + ", seat: " + seat + ", card: " + card);
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
                    this.awaitingAnimation = true;
                    animate(card3D, seat);
                    // setTimeout(() => {
                    //     card3D && card3D.playCardAnimation(seat, this.scene);
                    //     this.awaitingAnimation = false;
                    // }, 1000);
                 
                    this.currentCardsInTrick[order] = card3D;
                }
            }
        }
    }

    static transferRequestListener(fromSeat: number, toSeat: number) {
        if (fromSeat === GameSettings.currentPlayer) {
            this.transferRecipient = toSeat;

            for (let card of this.hand) card.toggleGlow(true);

            this.gameState = GameState.ChoosingTransfer;

            console.log("Game state -> Choosing transfer");
        }
        else {
            this.gameState = GameState.WaitingForTransfersEnd;
            console.log("Game state -> Waiting for transfers to end.");
        }
    }

    static transferResponseListener(fromSeat: number, toSeat: number, card: Card, success: boolean) {
        // To do: check if card is the same as this.currentCard?

        if (!this.clientIn3DMode) return;

        if (success) {
            let card: Card3D | null = this.currentCard;

            card && card.transferCardAnimation(GameSettings.currentPlayer, this.scene);

            for (let card of this.hand) card.toggleGlow(false);

            this.gameState = GameState.WaitingForTransfersEnd;
        } else {
            console.log("Error Transferring Card");
        }

        this.awaitingServerResponse = false;
    }

    static throwawayRequestListener() {
        for (let card of this.hand) card.toggleGlow(true);
        this.gameState = GameState.ChoosingThrowaway;
    }

    static throwawayResponseListener(finished: boolean, cardRemoved: Card, success: boolean) {
        // To do: check if cardRemoved is the same as this.currentCard?

        if (!this.clientIn3DMode) return;

        if (success) {
            let card: Card3D | null = this.currentCard;

            card && card.throwAwayCardAnimation(GameSettings.currentPlayer, this.scene);

            for (let card of this.hand) card.toggleGlow(false);

            this.gameState = GameState.WaitingForThrowawaysEnd;
        } else {
            console.log("Error Throwing Away Card");
        }

        this.awaitingServerResponse = false;
    }

    static moveCameraToSeat(seatNumber: number) {
        GameSettings.camera.target = GameSettings.cameraTargets[seatNumber];
        GameSettings.camera.alpha = -1 * baseRotation(seatNumber).y + Math.PI;
        GameSettings.camera.beta = GameSettings.cameraBeta;
        GameSettings.camera.radius = GameSettings.cameraRadius;
    }
}

SceneController.initialize();

export { SceneController, GameState };

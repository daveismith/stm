import { SeatDetails, Hand, Bid as BidDetails } from '../../../proto/shoot_pb';
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
import { Scene } from '@babylonjs/core';
import { CardStack3D } from './CardStack3D';

class SceneController {
    static scene: Scene;
    static seatCubes: SeatCube[] = [];
    static bidNumberCubes: BidNumberCube[][] = [];
    static bidSuitCubes: BidSuitCube[][] = [];
    static nameplates: Nameplate[] = [];
    static unreadyCubes: ReadyCube[] = [];
    static readyCubes: ReadyCube[] = [];
    static seats: Seat3D[] = [];

    static tricksListener () {
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
                if (this.nameplates[seat.index]) this.nameplates[seat.index].updateName(seat.name);
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
            this.moveCameraToSeat(seatNumber);
            // this.nameplates[seatNumber].disable();

            for (let seatCube of this.seatCubes) {
                seatCube.hideAndDisable();
            }

            for (let seat of this.seats) {
                if (seat.ready) this.readyCubes[seat.index].show();
                else this.unreadyCubes[seat.index].show();
            }

            this.unreadyCubes[seatNumber].enable();
        }
    }

    // Server response to our ready-status request.
    static readyStatusRequestResponseListener (readyStatus: boolean, success: boolean) {
        if (this.readyCubes[GameSettings.currentPlayer] && this.unreadyCubes[GameSettings.currentPlayer]) {

            if (success) {
                if (readyStatus)
                {
                    this.unreadyCubes[GameSettings.currentPlayer].disable();
                    this.unreadyCubes[GameSettings.currentPlayer].hide();
                    this.readyCubes[GameSettings.currentPlayer].enable();
                    this.readyCubes[GameSettings.currentPlayer].show();
                }
                else
                {
                    this.readyCubes[GameSettings.currentPlayer].disable();
                    this.readyCubes[GameSettings.currentPlayer].hide();
                    this.unreadyCubes[GameSettings.currentPlayer].enable();
                    this.unreadyCubes[GameSettings.currentPlayer].show();
                }
            }
        }
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
    }

    static handListener (hand: Hand) {
        CardStack3D.arrangeDeck(hand.getHandList());

        arrangeCardsInDeck(this.scene, CardStack3D.deck);

        setTimeout(() => { Card3D.dealCards(this.scene); }, 1000);

        setTimeout(() => { this.pickUpListener(); }, 7500);
    }

    static pickUpListener () {
        Card3D.pickUpCards(GameSettings.currentPlayer, this.scene);

        setTimeout(() => { this.fanListener() }, 2000);
    }

    static fanListener () {
        Card3D.fanCards(GameSettings.currentPlayer, this.scene);
    }

    static bidRequestListener () {
        let player: number = GameSettings.currentPlayer;

        for (let j = 0; j < this.bidSuitCubes[player].length; j++) {
            this.bidSuitCubes[player][j].enable();
        }
        for (let j = 0; j < this.bidNumberCubes[player].length; j++) {
            this.bidNumberCubes[player][j].enable();
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

        this.unreadyCubes[player].enable();
        this.unreadyCubes[player].show();
    }

    static bidResponseListener (tricks: number, shootNum: number, trump: Bid.Trump, seat: number) {
        this.unreadyCubes[seat].disable();
        this.unreadyCubes[seat].hide();
        this.readyCubes[seat].enable();
        this.readyCubes[seat].show();
    }

    static bidsListener (bidDetailsList: BidDetails[]) {
        for (let bidDetails of bidDetailsList) {
            const bid: Bid = {
                number: bidDetails.getTricks(),
                shootNum: bidDetails.getShootNum(),
                trump: bidDetails.getTrump(),
                seat: bidDetails.getSeat(),
            };
        }
    }

    static moveCameraToSeat(seatNumber: number) {
        GameSettings.currentPlayer = seatNumber;
        GameSettings.camera.target = GameSettings.cameraTargets[seatNumber];
        GameSettings.camera.alpha = -1 * baseRotation(seatNumber).y + Math.PI;
        GameSettings.camera.beta = GameSettings.cameraBeta;
        GameSettings.camera.radius = GameSettings.cameraRadius;
    }
}

export { SceneController };

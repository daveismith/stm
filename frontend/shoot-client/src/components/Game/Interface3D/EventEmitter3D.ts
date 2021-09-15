import { EventEmitter } from 'events';
import { SeatDetails, Bid as BidDetails, Hand } from '../../../proto/shoot_pb';
import { SceneController } from "./SceneController";
import { Bid } from "../../Game/Models/Bid";

// const events = require('events');

class EventEmitter3D extends EventEmitter {
    constructor() {
        super();

        this.on('tricks', function() {
            SceneController.tricksListener();
        });

        this.on('seats', function(seatDetailsList: SeatDetails[]) {
            SceneController.seatsListener(seatDetailsList);
        });

        this.on('takeSeatRequestResponse', function(seatNumber: number, success: boolean) {
            SceneController.seatRequestResponseListener(seatNumber, success);
        });

        this.on('setReadyStatusResponse', function(readyStatus: boolean, success: boolean) {
            SceneController.readyStatusRequestResponseListener(readyStatus, success);
        });

        this.on('startGame', function() {
            SceneController.startGameListener();
        });

        this.on('hand', function(hand: Hand) {
            SceneController.handListener(hand);
        });

        // server wants a bid from us
        this.on('bidRequest', function() {
            SceneController.bidRequestListener();
        });

        this.on('bids', function(bidDetailsList: BidDetails[]) {
            SceneController.bidsListener(bidDetailsList);
        });

        this.on('createBidResponse', function(tricks: number, shootNum: number, trump: Bid.Trump, seat: number, success: boolean) {
            SceneController.bidResponseListener(tricks, shootNum, trump, seat);
        });
    }
}

export { EventEmitter3D };

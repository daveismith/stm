import { EventEmitter } from 'events';
import { Card, SeatDetails, Bid as BidDetails, Hand, TrumpUpdate, PlayCardRequest, PlayedCard, Tricks } from '../../../proto/shoot_pb';
import { SceneController } from "./SceneController";
import { Bid } from "../../Game/Models/Bid";

class EventEmitter3D extends EventEmitter {
    constructor() {
        super();

        this.on('tricks', function(tricks: Tricks) {
            SceneController.tricksListener(tricks);
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

        this.on('trumpUpdate', function(trumpUpdate: TrumpUpdate) {
            SceneController.trumpUpdateListener(trumpUpdate);
        });

        this.on('cardRequest', function(playCardRequest: PlayCardRequest) {
            SceneController.cardRequestListener(playCardRequest);
        });

        this.on('playCardResponse', function(card: Card, success: boolean) {
            SceneController.playCardResponseListener(card, success);
        });

        this.on('playedCards', function(cardsList: Array<PlayedCard>) {
            SceneController.playedCardsListener(cardsList);
        });

        this.on('transferRequest', function(fromSeat: number, toSeat: number) {
            SceneController.transferRequestListener(fromSeat, toSeat);
        });

        this.on('transferResponse', function(fromSeat: number, toSeat: number, card: Card, success: boolean) {
            SceneController.transferResponseListener(fromSeat, toSeat, card, success);
        });

        this.on('throwawayRequest', function() {
            SceneController.throwawayRequestListener();
        });

        this.on('throwawayResponse', function(finished: boolean, cardRemoved: Card, success: boolean) {
            SceneController.throwawayResponseListener(finished, cardRemoved, success);
        });
    }
}

export { EventEmitter3D };

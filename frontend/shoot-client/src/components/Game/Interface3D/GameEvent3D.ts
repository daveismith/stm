import { EventEmitter3D } from "./EventEmitter3D";
import { Notification, SeatDetails, Bid as BidDetails } from "../../../proto/shoot_pb";

class GameEvent3D {
    notification: Notification;
    eventEmitter: EventEmitter3D;

    constructor (notification: Notification, eventEmitter: EventEmitter3D) {
        this.notification = notification;
        this.eventEmitter = eventEmitter;
    }

    execute () {
        switch (this.notification.getNotificationCase()) {
            case Notification.NotificationCase.BID_LIST: {
                let bidDetailsList: BidDetails[] = this.notification.getBidList()?.getBidsList() as BidDetails[];
                this.eventEmitter.emit("bids", bidDetailsList);
                break;
            }
            case Notification.NotificationCase.BID_REQUEST: {
                this.eventEmitter.emit("bidRequest");
                break;
            }
            case Notification.NotificationCase.HAND: {
                this.eventEmitter.emit("hand", this.notification.getHand());
                break;
            }
            case Notification.NotificationCase.PLAY_CARD_REQUEST: {
                this.eventEmitter.emit("cardRequest", this.notification.getPlayCardRequest());
                break;
            }
            case Notification.NotificationCase.PLAYED_CARDS: {
                this.eventEmitter.emit("playedCards", this.notification.getPlayedCards()?.getCardsList());
                break;
            }
            case Notification.NotificationCase.SCORES: {
                this.eventEmitter.emit("score");
                break;
            }
            case Notification.NotificationCase.SEAT_LIST: {
                let seatDetailsList: SeatDetails[] = this.notification.getSeatList()?.getSeatsList() as SeatDetails[];
                this.eventEmitter.emit("seats", seatDetailsList);
                break;
            }
            case Notification.NotificationCase.START_GAME: {
                this.eventEmitter.emit('startGame');
                break;
            }
            case Notification.NotificationCase.TRICKS: {
                this.eventEmitter.emit("tricks", this.notification.getTricks());
                break;
            }
            case Notification.NotificationCase.TRUMP_UPDATE: {
                this.eventEmitter.emit("trumpUpdate", this.notification.getTrumpUpdate());
                break;
            }
            case Notification.NotificationCase.TRANSFER_REQUEST: {
                this.eventEmitter.emit("transferRequest", this.notification.getTransferRequest());
                break;
            }
            case Notification.NotificationCase.THROWAWAY_REQUEST: {
                this.eventEmitter.emit("throwawayRequest", this.notification.getThrowawayRequest());
                break;
            }
            default:
        }

    }
}

export { GameEvent3D };
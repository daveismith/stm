import { EventEmitter } from 'events';
import { SeatDetails } from '../../../proto/shoot_pb';
import { SceneController } from "./SceneController";

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
    }
}

export { EventEmitter3D };

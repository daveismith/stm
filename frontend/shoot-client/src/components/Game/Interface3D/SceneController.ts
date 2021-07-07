import { SeatDetails } from '../../../proto/shoot_pb';
import { Seat } from "../Models/Seat";
import { GameSettings } from "./GameSettings3D";
import { baseRotation } from "./SceneFunctions";
import { SeatCube } from "./SeatCube";
import { Nameplate } from "./Nameplate";
import { BidNumberCube } from './BidNumberCube';
import { BidSuitCube } from './BidSuitCube';

class SceneController {
    static seatCubes: SeatCube[] = [];
    static bidNumberCubes: BidNumberCube[][] = [];
    static bidSuitCubes: BidSuitCube[][] = [];
    static nameplates: Nameplate[] = [];

    static tricksListener () {
        console.log('tricks event');
    }

    static seatsListener (seatDetailsList: SeatDetails[]) {
        console.log('seat list event');

        for (let seatDetails of seatDetailsList) {
            const seat: Seat = {
                index: seatDetails.getSeat(),
                name: seatDetails.getName(),
                empty: seatDetails.getEmpty(),
                human: seatDetails.getHuman(),
                ready: seatDetails.getReady(),
            };

            if (!seat.empty) { // Someone is in the seat, so disable the take-seat button and update the name.
                this.seatCubes[seat.index].disable();
                this.nameplates[seat.index].updateName(seat.name);
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
            this.nameplates[seatNumber].disable();

            for (let seatCube of this.seatCubes) {
                seatCube.disable();
            }
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

import { SeatDetails } from '../../../proto/shoot_pb';
import { Seat } from "../Models/Seat";
import { GameSettings } from "./GameSettings3D";
import { baseRotation } from "./SceneFunctions";

class SceneController {
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

            if (seat.name === "tim") {
                GameSettings.currentPlayer = seat.index;
                GameSettings.camera.target = GameSettings.cameraTargets[seat.index];
                GameSettings.camera.alpha = -1 * baseRotation(seat.index).y + Math.PI;
                GameSettings.camera.beta = GameSettings.cameraBeta;
                GameSettings.camera.radius = GameSettings.cameraRadius;

                for (let seatCube of GameSettings.seatCubes) {
                    seatCube.disable();
                }
            }
        }
    }
}

export { SceneController };

import EventEmitter from "node:events";
import { SceneController } from "./SceneController";

class EventEmitter3D extends EventEmitter {
    constructor() {
        super();

        this.on('tricks', function() {
            SceneController.tricksListener();
        });

        this.on('seats', function() {
            SceneController.seatsListener();
        });
    }
}

export { EventEmitter3D };

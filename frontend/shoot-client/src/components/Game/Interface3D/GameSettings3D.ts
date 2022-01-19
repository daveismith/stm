import {
    Mesh,
    Vector3,
    ArcRotateCamera
} from "@babylonjs/core";

class GameSettings {
    static roomSize = 48;
    static tableRadius = 5;
    static tableHeight = 9;
    static players: number;
    static deck: Mesh[] = [];
    static deckSize:number = 48;
    static handRadius = new Vector3(2, 0, 1);
    static currentPlayer: number;
    static currentDealer: number;
    static camera: ArcRotateCamera;
    static cameraAlpha: number = 3 * Math.PI / 2;
    static cameraBeta: number = Math.PI / 3;
    static cameraRadius: number = 8;
    static cameraTargets: Vector3[] = [];
    // static cameraDefaultTarget: Vector3 = new Vector3(0, GameSettings.tableHeight, -1/2 * GameSettings.tableRadius);

    static initializeGame () {
        //Radius ratio of camera target to table radius (from centre of table)
        const cameraTargetRatio = 1 / 3;

        //Populate all camera targets
        for (var i = 0; i < GameSettings.players; i++) {
            GameSettings.cameraTargets[i] = new Vector3(
                GameSettings.tableRadius *
                cameraTargetRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 1/2,
                GameSettings.tableRadius *
                cameraTargetRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            );
        }

        if (GameSettings.players === 2) {
            GameSettings.deckSize = 24;
        }
    };
}

export { GameSettings };

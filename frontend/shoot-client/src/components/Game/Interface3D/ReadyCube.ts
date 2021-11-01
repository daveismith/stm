import {
    Mesh,
    MeshBuilder,
    Scene,
    StandardMaterial,
    Texture,
    TransformNode,
    Vector3,
    Vector4
} from "@babylonjs/core";

import {
    GUI3DManager,
    MeshButton3D
} from "@babylonjs/gui";

import { GameSettings } from "./GameSettings3D";
import { GameState, SceneController } from "./SceneController";

import readyTextures from "./resources/images/ready.png";
import { IApp } from "../../App/App.context";
import { BidSuitCube } from "./BidSuitCube";
import { BidNumberCube } from "./BidNumberCube";
import { Bid } from "../Models/Bid";

class ReadyCube {
    readyCubeRatio = 7/8;
    readyCubeHeight = 1/4;
    mesh: Mesh;
    player: number;
    pivot: TransformNode;
    button: MeshButton3D;
    readyValue: boolean;
    faceUV = new Array(6);
    appState: IApp;
    cubeStartingPosition: Vector3;
    pivotStartingPosition: Vector3;
    startGameModeActive: boolean = false;
    confirmBidModeActive: boolean = false;


    constructor (scene: Scene, manager: GUI3DManager, player: number, readyStatus: boolean, appState: IApp) {
        this.appState = appState;
        this.player = player;
        this.pivot = new TransformNode("readyCubePivot", scene);
        this.pivotStartingPosition = new Vector3(0, GameSettings.tableHeight, 0);
        this.pivot.position = this.pivotStartingPosition.clone();
        this.cubeStartingPosition = new Vector3(
            0,
            0.01 + this.readyCubeHeight/2,
            GameSettings.tableRadius * this.readyCubeRatio
        );

        if (readyStatus) {
            this.faceUV[0] = new Vector4(0, 0, 1/2, 1/2);
            this.faceUV[1] = this.faceUV[0];
            this.faceUV[2] = this.faceUV[0];
            this.faceUV[3] = this.faceUV[0];
            this.faceUV[4] = new Vector4(0, 1/2, 1/2, 1);
            this.faceUV[5] = this.faceUV[4];

            this.readyValue = true;
        }
        else {
            this.faceUV[0] = new Vector4(1/2, 0, 1, 1/2);
            this.faceUV[1] = this.faceUV[0];
            this.faceUV[2] = this.faceUV[0];
            this.faceUV[3] = this.faceUV[0];
            this.faceUV[4] = new Vector4(1/2, 1/2, 1, 1);
            this.faceUV[5] = this.faceUV[4];

            this.readyValue = false;
        }

        this.mesh = MeshBuilder.CreateBox("readyCube", {
            width: this.readyCubeHeight,
            height: this.readyCubeHeight,
            depth: this.readyCubeHeight,
            faceUV: this.faceUV,
            wrap: true
        });

        const readyCubeMaterial = new StandardMaterial("readyCubeMaterial", scene);
        readyCubeMaterial.diffuseTexture = new Texture(readyTextures, scene);
        this.mesh.material = readyCubeMaterial;

        this.button = new MeshButton3D(this.mesh, "readyCubeButton");

        this.startGameMode();

        manager.addControl(this.button);

        this.mesh.parent = this.pivot;
        this.mesh.position = this.cubeStartingPosition.clone();

        if (SceneController.seats[player]
                && !SceneController.seats[player].empty
                && SceneController.seats[player].ready === this.readyValue)
            this.show();
        else
            this.hide();

        this.disable();

        const axis = new Vector3(0, 1, 0);
        const angle = player * 2 * Math.PI / GameSettings.players;
        this.pivot.rotate(axis, angle);
    }

    disable () {
        this.mesh.isPickable = false;
    }

    enable () {
        this.mesh.isPickable = true;
    }

    hide () {
        this.mesh.visibility = 0;
    }

    show () {
        this.mesh.visibility = 1;
    }

    startGameMode() {
        this.confirmBidModeActive = false;
        this.startGameModeActive = true;

        this.button.onPointerDownObservable.clear();

        this.button.onPointerDownObservable.add(() => {
            SceneController.gameState = GameState.WaitingForReadyConfirmation;
                
            if (this.appState.setSeatReadyStatus) this.appState.setSeatReadyStatus(!this.readyValue);
        });
    }

    confirmBidMode() {
        this.startGameModeActive = false;
        this.confirmBidModeActive = true;

        this.button.onPointerDownObservable.clear();

        this.button.onPointerDownObservable.add(() => {
            let tricks: number = -1;
            let shootNumber: number = 0;
            let currentShootNumber: number = 0;
            let suit: Bid.Trump = Bid.Trump.HIGH; // Should never use the default

            if (BidNumberCube.activeCube && BidSuitCube.activeCube) { // If a number and suit cube are activated, bid.
                tricks = BidNumberCube.activeCube.tricks;

                if (SceneController.currentBid) currentShootNumber = SceneController.currentBid.shootNum;
                if (tricks === 9) shootNumber = currentShootNumber + 1; // TODO: Change from 9 to dynamic shoot trick number

                suit = BidSuitCube.activeCube.suit;
            }
            else if (!BidNumberCube.activeCube && !BidSuitCube.activeCube) { // If no cubes are activated, pass.
                tricks = 0;
            }

            // If tricks is at least 0 then submit the bid.
            if (tricks >= 0) {
                SceneController.gameState = GameState.WaitingForBidConfirmation;
                    
                if (this.appState.createBid) this.appState.createBid(tricks, shootNumber, suit, GameSettings.currentPlayer);
            }
    });
    }
}

export { ReadyCube };

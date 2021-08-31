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
import { SceneController } from "./SceneController";

import iconTextures from "./resources/images/icons.png";
import { IApp } from "../../App/App.context";

class SeatCube {
    seatCubeRatio = 7/8;
    seatCubeHeight = 1/4;
    mesh: Mesh;
    player: number;
    pivot: TransformNode;
    button: MeshButton3D;
    pivotStartingPosition: Vector3;

    constructor (scene: Scene, manager: GUI3DManager, player: number, appState: IApp) {
        var faceUV = new Array(6);
        this.player = player;
        this.pivot = new TransformNode("seatCubePivot", scene);
        this.pivotStartingPosition = new Vector3(0, GameSettings.tableHeight, 0);
        this.pivot.position = this.pivotStartingPosition.clone();

        faceUV[0] = new Vector4((player % 4) / 4, Math.floor(player / 4 + 2) / 4, (player % 4 + 1) / 4, Math.floor(player / 4 + 3) / 4);
        faceUV[1] = faceUV[0];
        faceUV[2] = faceUV[0];
        faceUV[3] = faceUV[0];
        faceUV[4] = new Vector4(faceUV[0].z, faceUV[0].w, faceUV[0].x, faceUV[0].y);
        faceUV[5] = new Vector4(3/4, 1/4, 1, 1/2);

        this.mesh = MeshBuilder.CreateBox("seatCube", {
            width: this.seatCubeHeight,
            height: this.seatCubeHeight,
            depth: this.seatCubeHeight,
            faceUV: faceUV,
            wrap: true
        });

        const seatCubeMaterial = new StandardMaterial("seatCubeMaterial", scene);
        seatCubeMaterial.diffuseTexture = new Texture(iconTextures, scene);
        this.mesh.material = seatCubeMaterial;

        this.button = new MeshButton3D(this.mesh, "seatCubeButton");
        this.button.onPointerDownObservable.add(() => {
            if (appState.takeSeat) appState.takeSeat(player);

            // GameSettings.currentPlayer = player;
            // camera.target = GameSettings.cameraTargets[player];
            // camera.alpha = -1 * baseRotation(player).y + Math.PI;
            // camera.beta = GameSettings.cameraBeta;
            // camera.radius = GameSettings.cameraRadius;
            // SceneController.takeSeat(player);
        });

        manager.addControl(this.button);

        this.mesh.parent = this.pivot;
        this.mesh.position = new Vector3(
            0,
            0.01 + this.seatCubeHeight/2,
            GameSettings.tableRadius * this.seatCubeRatio
        );

        if (SceneController.seats[player] && !SceneController.seats[player].empty)
            this.hideAndDisable();

            const axis = new Vector3(0, 1, 0);
        const angle = player * 2 * Math.PI / GameSettings.players;
        this.pivot.rotate(axis, angle);
    }

    hideAndDisable () {
        this.mesh.visibility = 0;
        this.mesh.isPickable = false;
    }
}

export { SeatCube };

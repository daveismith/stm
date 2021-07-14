import {
    Color3,
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

import iconTextures from "./resources/images/icons.png";
import { IApp } from "../../App/App.context";

class ReadyCube {
    readyCubeRatio = 5/8;
    readyCubeHeight = 1/3;
    mesh: Mesh;
    player: number;
    pivot: TransformNode;
    button: MeshButton3D;
    status: boolean = false;

    constructor (scene: Scene, manager: GUI3DManager, player: number, appState: IApp) {
        // var faceUV = new Array(6);
        this.player = player;
        this.pivot = new TransformNode("readyCubePivot", scene);
        this.pivot.position = new Vector3(0, GameSettings.tableHeight, 0);

        // faceUV[0] = new Vector4((player % 4) / 4, Math.floor(player / 4 + 2) / 4, (player % 4 + 1) / 4, Math.floor(player / 4 + 3) / 4);
        // faceUV[1] = faceUV[0];
        // faceUV[2] = faceUV[0];
        // faceUV[3] = faceUV[0];
        // faceUV[4] = new Vector4(faceUV[0].z, faceUV[0].w, faceUV[0].x, faceUV[0].y);
        // faceUV[5] = new Vector4(3/4, 1/4, 1, 1/2);

        this.mesh = MeshBuilder.CreateBox("readyCube", {
            width: this.readyCubeHeight,
            height: this.readyCubeHeight,
            depth: this.readyCubeHeight,
            // faceUV: faceUV,
            wrap: true
        });

        const readyCubeMaterial = new StandardMaterial("readyCubeMaterial", scene);
        // readyCubeMaterial.diffuseTexture = new Texture(iconTextures, scene);
        readyCubeMaterial.diffuseColor = Color3.Yellow();
        this.mesh.material = readyCubeMaterial;

        this.button = new MeshButton3D(this.mesh, "readyCubeButton");
        this.button.onPointerDownObservable.add(() => {
            if (appState.setSeatReadyStatus) appState.setSeatReadyStatus(!this.status);
        });

        manager.addControl(this.button);

        this.mesh.parent = this.pivot;
        this.mesh.position = new Vector3(
            0,
            0.01 + this.readyCubeHeight/2,
            GameSettings.tableRadius * this.readyCubeRatio
        );

        const axis = new Vector3(0, 1, 0);
        const angle = player * 2 * Math.PI / GameSettings.players;
        this.pivot.rotate(axis, angle);
    }

    disable () {
        this.button.onPointerDownObservable.clear();
        this.mesh.visibility = 0;
    }
}

export { ReadyCube };
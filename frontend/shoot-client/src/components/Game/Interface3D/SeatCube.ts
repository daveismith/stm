import {
    ArcRotateCamera,
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
import { baseRotation } from "./SceneFunctions";

import iconTextures from "./resources/images/icons.png";

class SeatCube {
    seatCubeRatio = 7/8;
    seatCubeHeight = 1/3;
    mesh: Mesh;
    player: number;
    pivot: TransformNode;

    constructor (scene: Scene, manager: GUI3DManager, camera: ArcRotateCamera, player: number) {
        var faceUV = new Array(6);
        this.player = player;
        this.pivot = new TransformNode("seatCubePivot", scene);
        this.pivot.position = new Vector3(0, GameSettings.tableHeight, 0);

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

        const seatCubeButton = new MeshButton3D(this.mesh, "seatCubeButton");
        seatCubeButton.onPointerDownObservable.add(() => {
            GameSettings.currentPlayer = player;
            camera.target = GameSettings.cameraTargets[player];
            camera.alpha = -1 * baseRotation(player).y + Math.PI;
            camera.beta = GameSettings.cameraBeta;
            camera.radius = GameSettings.cameraRadius;
        });

        manager.addControl(seatCubeButton);

        this.mesh.parent = this.pivot;
        this.mesh.position = new Vector3(
            0,
            0.01 + this.seatCubeHeight/2,
            GameSettings.tableRadius * this.seatCubeRatio
        );

        const axis = new Vector3(0, 1, 0);
        const angle = player * 2 * Math.PI / GameSettings.players;
        this.pivot.rotate(axis, angle);
    }
}

export { SeatCube };

import {
    Animation,
    CircleEase,
    EasingFunction,
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

class BidNumberCube {
    bidNumberCubeRatio = 1/2;
    bidCubeHeight = 1/4;
    mesh: Mesh;
    pivot: TransformNode;

    constructor(scene: Scene, manager: GUI3DManager, pivot: TransformNode, i: number, j: number) {
        var faceUV = new Array(6);

        this.pivot = pivot;
    
        if (j < 8) {
            faceUV[0] = new Vector4((j % 4) / 4, Math.floor(j / 4 + 2) / 4, (j % 4 + 1) / 4, Math.floor(j / 4 + 3) / 4);
            faceUV[1] = faceUV[0];
            faceUV[2] = faceUV[0];
            faceUV[3] = faceUV[0];
            faceUV[4] = new Vector4(faceUV[0].z, faceUV[0].w, faceUV[0].x, faceUV[0].y);
            faceUV[5] = new Vector4(3/4, 1/4, 1, 1/2);
        }
        else {
            faceUV[0] = new Vector4(1/2, 1/4, 3/4, 1/2);
            faceUV[1] = faceUV[0];
            faceUV[2] = faceUV[0];
            faceUV[3] = faceUV[0];
            faceUV[4] = new Vector4(faceUV[0].z, faceUV[0].w, faceUV[0].x, faceUV[0].y);
            faceUV[5] = new Vector4(3/4, 1/4, 1, 1/2);
        }

        this.mesh = MeshBuilder.CreateBox("bidNumberCube", {
            width: this.bidCubeHeight,
            height: this.bidCubeHeight,
            depth: this.bidCubeHeight,
            faceUV: faceUV,
            wrap: true
        });
        const bidNumberCubeMaterial = new StandardMaterial("bidNumberCubeMaterial", scene);
        bidNumberCubeMaterial.diffuseTexture = new Texture(iconTextures, scene);
        this.mesh.material = bidNumberCubeMaterial;

        const bidNumberCubeButton = new MeshButton3D(this.mesh, "bidNumberCubeButton");
        bidNumberCubeButton.onPointerDownObservable.add(() => {
            this.animateBidCube(scene, 1);
        });

        manager.addControl(bidNumberCubeButton);

        this.mesh.parent = this.pivot;
        this.mesh.position = new Vector3(
            (4 - j) * this.bidCubeHeight,
            0.1 - this.bidCubeHeight/2,
            GameSettings.tableRadius * this.bidNumberCubeRatio
        );
    }

    animateBidCube (scene: Scene, duration: number) {
        const frameRate: number = 60;
        const bidCubeBounceHeight = 2;
        var targetHeight: number = 0;
    
        if (this.mesh.position.y < 0) {
            targetHeight = this.mesh.position.y + bidCubeBounceHeight;
        }
        else {
            targetHeight = 0.1 - this.bidCubeHeight/2;
        }
            
        var ySlide = new Animation(
            "ySlide",
            "position.y",
            frameRate,
            Animation.ANIMATIONTYPE_FLOAT,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
    
        var ySlideEase = new CircleEase();
        ySlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    
        var keyFramesPY = [];
    
        keyFramesPY.push({
            frame: 0,
            value: this.mesh.position.y,
        });
    
        keyFramesPY.push({
            frame: frameRate * duration,
            value: targetHeight,
        });
    
        ySlide.setKeys(keyFramesPY);
        ySlide.setEasingFunction(ySlideEase);
    
        scene.beginDirectAnimation(
            this.mesh,
            [ySlide],
            0,
            frameRate * duration,
            true
        );    
    }
}

export { BidNumberCube };

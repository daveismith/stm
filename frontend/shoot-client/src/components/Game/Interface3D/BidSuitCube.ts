import {
    Animation,
    CircleEase,
    Color3,
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
import { Bid } from "../Models/Bid";

import iconTextures from "./resources/images/icons.png";

class BidSuitCube {
    bidNumberCubeRatio = 1/2;
    bidSuitCubeRatio = 7/16;
    bidCubeHeight = 1/4;
    mesh: Mesh;
    pivot: TransformNode;
    button: MeshButton3D;
    suit: Bid.Trump;
    static activeCube: BidSuitCube | null;
    isActiveCube: boolean = false;

    constructor(scene: Scene, manager: GUI3DManager, pivot: TransformNode, i: number, j: number, suit: Bid.Trump) {
        this.suit = suit;

        var faceUV = new Array(6);

        this.pivot = pivot;
        
        faceUV[0] = new Vector4((j % 4) / 4, Math.floor(j / 4) / 4, (j % 4 + 1) / 4, Math.floor(j / 4 + 1) / 4);
        faceUV[1] = faceUV[0];
        faceUV[2] = faceUV[0];
        faceUV[3] = faceUV[0];
        faceUV[4] = new Vector4(faceUV[0].z, faceUV[0].w, faceUV[0].x, faceUV[0].y);
        faceUV[5] = new Vector4(3/4, 1/4, 1, 1/2);

        this.mesh = MeshBuilder.CreateBox("bidSuitCube", {
            width: this.bidCubeHeight,
            height: this.bidCubeHeight,
            depth: this.bidCubeHeight,
            faceUV: faceUV,
            wrap: true
        });
        const bidSuitCubeMaterial = new StandardMaterial("bidSuitCubeMaterial", scene);
        bidSuitCubeMaterial.diffuseTexture = new Texture(iconTextures, scene);
        this.mesh.material = bidSuitCubeMaterial;

        this.button = new MeshButton3D(this.mesh, "bidSuitCubeButton");
        this.button.onPointerDownObservable.add(() => {
            if (this.isActiveCube)
                this.deactivate(scene);
            else
                this.activate(scene);
        });

        manager.addControl(this.button);

        this.mesh.parent = this.pivot;
        this.mesh.position = new Vector3(
            (2.5 - j) * this.bidCubeHeight,
            0.1,
            GameSettings.tableRadius * this.bidSuitCubeRatio
        );
    }

    toggleGlow (glow: boolean) {
        let cubeMaterial: StandardMaterial = this.mesh.material as StandardMaterial;
        if (glow)
            cubeMaterial.emissiveColor = Color3.White();
        else
            cubeMaterial.emissiveColor = Color3.Black();
    }

    activate (scene: Scene) {
        BidSuitCube.activeCube?.deactivate(scene);

        BidSuitCube.activeCube = this;
        this.isActiveCube = true;

        this.animateBidCube(scene, 1, true);
    }

    deactivate (scene: Scene) {
        BidSuitCube.activeCube = null;
        this.isActiveCube = false;

        this.animateBidCube(scene, 1, false);
    }

    animateBidCube (scene: Scene, duration: number, directionUp: boolean) {
        const frameRate: number = 60;
        const bidCubeBounceHeight = 2;
        var targetHeight: number = 0;
    
        if (directionUp) {
            targetHeight = this.mesh.position.y + bidCubeBounceHeight;
        }
        else {
            targetHeight = 0.1;
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

    disableAndHide () {
        this.disable();
        this.hide();
    }

    enableAndShow () {
        this.enable();
        this.show();
    }

    disable () {
        this.toggleGlow(false);
        this.mesh.isPickable = false;
    }

    enable () {
        this.mesh.isPickable = true;
        this.toggleGlow(true);
    }

    show () {
        this.mesh.visibility = 1;
    }

    hide () {
        this.mesh.visibility = 0;
    }
}

export { BidSuitCube };

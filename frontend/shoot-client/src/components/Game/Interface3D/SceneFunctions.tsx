import {
    ArcRotateCamera,
    HemisphericLight,
    Scene,
    Vector3,
    SSAORenderingPipeline,
    TransformNode,
    SceneLoader,
    GlowLayer
} from "@babylonjs/core";

import {
    AdvancedDynamicTexture,
    GUI3DManager
} from "@babylonjs/gui";

import {
    GameSettings
} from "./GameSettings3D";

import "@babylonjs/loaders/glTF";

import { Card3D } from "./Card3D";
import { CardStack3D } from "./CardStack3D";
import { BidNumberCube } from "./BidNumberCube";
import { BidSuitCube } from "./BidSuitCube";
import { SeatCube } from "./SeatCube";
import { ReadyCube } from "./ReadyCube";

// @ts-ignore TS6133
import sceneAssets from "./resources/stm.glb";

import { IGame } from "../Game.context";
import { SceneController } from "./SceneController";
import { Nameplate } from "./Nameplate";

// Get a random number between -1 and 1.
const gaussianRandom = () => {
    return (
        (1 / 3) *
        Math.sqrt(-2 * Math.log(1 - Math.random())) *
        Math.cos(2 * Math.PI * Math.random())
    );
};

const baseRotation = (seat: number) => {
    const x = 0;
    const y = 2 * Math.PI / GameSettings.players * seat + 1/2 * Math.PI;  //Rotations are offset by -PI/2
    const z = 0;

    return new Vector3(x, y, z);
}

const baseRotationQuaternion = (seat: number) => {
    return baseRotation(seat).toQuaternion();
}

//Create a deck of cards at the deck position
const buildDeck = (scene: Scene, manager: GUI3DManager, gameState: IGame) => {
    let numRanks: number = 6;
    let numSuits: number = 4;

    for (let k = 0; k < GameSettings.cardCopies; k++) { // Assuming 2 copies of each card.
        for (let i = 0; i < numRanks; i++) {
            for (let j = 0; j < numSuits; j++) {
                new Card3D(scene, manager, i+2, j, gameState); // Add 2 since we're not including 7s and 8s.
            }
        }
    }
};

const buildSeatCubes = (scene: Scene, manager: GUI3DManager, gameState: IGame) => {
    let seatCubes: SeatCube[] = [];

    for (var i = 0; i < GameSettings.players; i++) {
        seatCubes[i] = new SeatCube(scene, manager, i, gameState);
    }

    SceneController.seatCubes = seatCubes;
}

const buildBidCubes = (scene: Scene, manager: GUI3DManager) => {
    const allBidNumberCubes: BidNumberCube[][] = [];
    const allBidSuitCubes: BidSuitCube[][] = [];
    var pivot: TransformNode;

    let tricks: number;

    for (var i = 0; i < GameSettings.players; i++) {
        pivot = new TransformNode("tableCentre");
        pivot.position = new Vector3(0, GameSettings.tableHeight, 0);
    
        allBidNumberCubes[i] = [];
        for (var j = 0; j < 9; j++) {
            tricks = j + 1;

            allBidNumberCubes[i][j] = new BidNumberCube(scene, manager, pivot, i, j, tricks);
            allBidNumberCubes[i][j].disableAndHide();
        }

        allBidSuitCubes[i] = [];
        for (j = 0; j < 6; j++) {
            allBidSuitCubes[i][j] = new BidSuitCube(scene, manager, pivot, i, j, j);
            allBidSuitCubes[i][j].disableAndHide();
        }

        const axis = new Vector3(0, 1, 0);
        const angle = i * 2 * Math.PI / GameSettings.players;
        pivot.rotate(axis, angle);
    }
        
    SceneController.bidNumberCubes = allBidNumberCubes;
    SceneController.bidSuitCubes = allBidSuitCubes;
}

const buildNameplates = (manager2D: AdvancedDynamicTexture) => {
    const nameplates: Nameplate[] = [];

    for (let i = 0; i < GameSettings.players; i++) {
        nameplates[i] = new Nameplate(manager2D, i);
    }
    
    SceneController.nameplates = nameplates;
}

const buildReadyCubes = (scene: Scene, manager: GUI3DManager, gameState: IGame) => {
    let unreadyCubes: ReadyCube[] = [];
    let readyCubes: ReadyCube[] = [];

    for (var i = 0; i < GameSettings.players; i++) {
        unreadyCubes[i] = new ReadyCube(scene, manager, i, false, gameState);
        readyCubes[i] = new ReadyCube(scene, manager, i, true, gameState);
        readyCubes[i].disable();
    }

    SceneController.unreadyCubes = unreadyCubes;
    SceneController.readyCubes = readyCubes;
}

// const buildTurnLight = (scene: Scene) => {
//     let turnLight = new PointLight("turnLight", new Vector3(0, 10, 0), scene);
//     SceneController.turnLight = turnLight;
// }

const arrangeCardsInDeck = (scene: Scene, deck: CardStack3D) => {
    let card: Card3D;
    let targetPosition: Vector3;
    let targetY: number;

    for (let i: number = 0; i < GameSettings.deckSize; i++) {
        card = deck.index[i]!;

        targetY = CardStack3D.deck.position.y + CardStack3D.cardStackSpacing * i;
        targetPosition = new Vector3(card.mesh.position.x, targetY, card.mesh.position.z);

        card.animateCardSlide(targetPosition, card.mesh.rotationQuaternion!, i, 0, 48, 0, scene);
    }
}

export const onSceneReady = (scene: Scene, gameState: IGame) => {
    // SceneController.clientIn3DMode = true;
    const engine = scene.getEngine();
    const canvas = engine.getRenderingCanvas();
    // if (canvas !== null) canvas.addEventListener("resize", function(){ engine.resize(); })

    console.log("onSceneReady shows " + gameState.seats.size + " players");
    // if (gameState) GameSettings.players = gameState.numPlayers; // This is how it should work
    // if (gameState) GameSettings.players = gameState.seats.size; // For now, just count number of seats
    // GameSettings.initializeGame();
    CardStack3D.initializeCardStacks();
    // console.log(GameSettings.players);

    // Add interactive layer
    const manager3D = new GUI3DManager(scene);
    const manager2D = AdvancedDynamicTexture.CreateFullscreenUI("UI");

    const camera = new ArcRotateCamera(
        "camera",
        GameSettings.cameraAlpha,
        GameSettings.cameraBeta,
        GameSettings.cameraRadius,
        GameSettings.cameraTargets[0],
        scene
    );
    camera.upperBetaLimit = Math.PI / 2.2;
    camera.attachControl(canvas, true);
    // camera.inputs.clear();
    GameSettings.camera = camera;
    SceneController.moveCameraToSeat(0);

    const lightVector1 = new Vector3(3 * Math.cos(-1*Math.PI/3), GameSettings.tableHeight+2, 3 * Math.sin(-1*Math.PI/3));
    const lightVector2 = new Vector3(3 * Math.cos(1*Math.PI/3), GameSettings.tableHeight+1, 3 * Math.sin(1*Math.PI/3));
    const lightVector3 = new Vector3(3 * Math.cos(3*Math.PI/3), GameSettings.tableHeight, 3 * Math.sin(3*Math.PI/3));
    const light1 = new HemisphericLight("light1", lightVector1, scene);
    const light2 = new HemisphericLight("light2", lightVector2, scene);
    const light3 = new HemisphericLight("light3", lightVector3, scene);
    const glow = new GlowLayer("glow", scene);
    glow.intensity = 0.2;

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // Default intensity is 1
    light1.intensity = 0.3;
    light2.intensity = 0.3;
    light3.intensity = 0.3;

    SceneLoader.Append(sceneAssets, "", scene, function (scene) { });

    SceneController.scene = scene;
    buildSeatCubes(scene, manager3D, gameState);
    buildBidCubes(scene, manager3D);
    buildDeck(scene, manager3D, gameState);
    buildNameplates(manager2D);
    buildReadyCubes(scene, manager3D, gameState);
    // buildTurnLight(scene);

    // SSAO code from https://playground.babylonjs.com/#N96NXC
    // Create SSAO and configure all properties (for the example)
    var ssaoRatio = {
        ssaoRatio: 0.5, // Ratio of the SSAO post-process, in a lower resolution
        combineRatio: 1.0 // Ratio of the combine post-process (combines the SSAO and the scene)
    };

    var ssao = new SSAORenderingPipeline("ssao", scene, ssaoRatio);
    ssao.fallOff = 0.000001;
    ssao.area = 1;
    ssao.radius = 0.0001;
    ssao.totalStrength = 1.0;
    ssao.base = 0.5;

    // Attach camera to the SSAO render pipeline
    scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);
    scene.postProcessRenderPipelineManager.enableEffectInPipeline("ssao", ssao.SSAOCombineRenderEffect, camera);
};

/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
export const onRender = (scene: Scene) => {
    // Example code
    // if (box !== undefined) {
    //     var deltaTimeInMillis = scene.getEngine().getDeltaTime();
    //     const rpm = 10;
    //     box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
    // }
};

export { arrangeCardsInDeck, baseRotation, baseRotationQuaternion, gaussianRandom };

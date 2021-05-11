import {
    ArcRotateCamera,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    Scene,
    Vector3,
    StandardMaterial,
    Texture,
    SSAORenderingPipeline,
    TransformNode,
    PBRMaterial,
    PBRMetallicRoughnessMaterial,
    CubeTexture,
    SceneLoader
} from "@babylonjs/core";

import {
    GUI3DManager
} from "@babylonjs/gui";

import {
    GameSettings
} from "./GameSettings3D";

import "@babylonjs/loaders/glTF";

import { Card } from "./Card3D";
import { CardStack } from "./CardStack3D";
import { BidNumberCube } from "./BidNumberCube";
import { BidSuitCube } from "./BidSuitCube";
import { SeatCube } from "./SeatCube";

// import wallTexture from "./resources/images/wall.png";
// import groundTexture from "./resources/images/ground.png";
// import wallNormalTexture from "./resources/images/wall_normal.png";
// import groundNormalTexture from "./resources/images/ground_normal.png";
// import ceilingTexture from "./resources/images/ceiling.jpg";
// import ceilingNormalTexture from "./resources/images/ceiling_normal.jpg";
import tableTexture from "./resources/images/table.png";
import tableNormalTexture from "./resources/images/table_normal.png";

// import plankTexture from "./resources/images/irregular+wood+planks-1024x1024.png";
// import plankHeightTexture from "./resources/images/irregular+wood+planks-1024x1024_height.png";
// import plankNormalTexture from "./resources/images/irregular+wood+planks-1024x1024_normal.png";
// import plankMetallicTexture from "./resources/images/irregular+wood+planks-1024x1024_metallic.png";
// import plankSmoothnessTexture from "./resources/images/irregular+wood+planks-1024x1024_smoothness.png";
// import plankAOTexture from "./resources/images/irregular+wood+planks-1024x1024_ao.png";
// import plankEdgeTexture from "./resources/images/irregular+wood+planks-1024x1024_edge.png";
// import plankMetallicRoughnessTexture from "./resources/images/irregular+wood+planks-1024x1024_MR.png";

// @ts-ignore TS6133
import sceneAssets from "./resources/stm.glb";

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
    const y = 1/2 * Math.PI + 2 * Math.PI * seat / GameSettings.players;  //Rotations are offset by -PI/2
    const z = 0;

    return new Vector3(x, y, z);
}

const baseRotationQuaternion = (seat: number) => {
    return baseRotation(seat).toQuaternion();
}

// const buildRoom = (scene: Scene) => {
//     const wallMaterial = new StandardMaterial("wallMaterial", scene);
//     wallMaterial.diffuseTexture = new Texture(wallTexture, scene);
//     wallMaterial.bumpTexture = new Texture(wallNormalTexture, scene);
//     wallMaterial.bumpTexture.level = 3;
//     wallMaterial.useParallax = true;
//     wallMaterial.useParallaxOcclusion = true;
//     wallMaterial.parallaxScaleBias = 0.2;

//     const backWall = MeshBuilder.CreatePlane("backWall", {size:GameSettings.roomSize});
//     backWall.position.z = GameSettings.roomSize / 2;
//     backWall.position.y = GameSettings.roomSize / 2;
//     backWall.material = wallMaterial;

//     const frontWall = MeshBuilder.CreatePlane("frontWall", {size:GameSettings.roomSize});
//     frontWall.position.z = -1 * GameSettings.roomSize / 2;
//     frontWall.position.y = GameSettings.roomSize / 2;
//     frontWall.rotation.y = Math.PI;
//     frontWall.material = wallMaterial;

//     const leftWall = MeshBuilder.CreatePlane("leftWall", {size:GameSettings.roomSize});
//     leftWall.position.x = -GameSettings.roomSize / 2;
//     leftWall.position.y = GameSettings.roomSize / 2;
//     leftWall.rotation.y = -Math.PI / 2;
//     leftWall.material = wallMaterial;

//     const rightWall = MeshBuilder.CreatePlane("rightWall", {size:GameSettings.roomSize});
//     rightWall.position.x = GameSettings.roomSize / 2;
//     rightWall.position.y = GameSettings.roomSize / 2;
//     rightWall.rotation.y = Math.PI / 2;
//     rightWall.material = wallMaterial;

//     // const groundMaterial = new StandardMaterial("groundMaterial", scene);
//     // groundMaterial.diffuseTexture = new Texture(groundTexture, scene);
//     // groundMaterial.diffuseTexture.scale(1/5);
//     // groundMaterial.bumpTexture = new Texture(groundNormalTexture, scene);
//     // groundMaterial.useParallax = true;
//     // groundMaterial.useParallaxOcclusion = true;
//     // groundMaterial.parallaxScaleBias = 0.2;

//     const groundMaterial = new PBRMetallicRoughnessMaterial("groundMaterial", scene);
//     groundMaterial.baseTexture = new Texture(plankTexture, scene);
//     groundMaterial.normalTexture = new Texture(plankNormalTexture, scene);
//     // groundMaterial.metallicTexture = new Texture(plankMetallicTexture, scene);
//     groundMaterial.occlusionTexture = new Texture(plankAOTexture, scene);
//     groundMaterial.metallicRoughnessTexture = new Texture(plankMetallicRoughnessTexture, scene);
//     groundMaterial.environmentTexture = CubeTexture.CreateFromPrefilteredData("/textures/environment.dds", scene);
//     groundMaterial.metallic = 0;
//     groundMaterial.roughness = 1.0;
//     groundMaterial.invertNormalMapY = true;

//     // const ground = MeshBuilder.CreateGround("ground", {width:GameSettings.roomSize, height:GameSettings.roomSize});
//     const ground = MeshBuilder.CreateGroundFromHeightMap(
//         "ground",
//         plankHeightTexture,
//         {
//             width:GameSettings.roomSize,
//             height:GameSettings.roomSize,
//             subdivisions: 250,
//             minHeight: 0,
//             maxHeight: 1.5
//         }
//     )
//     ground.material = groundMaterial;
        
//     const ceilingMaterial = new StandardMaterial("ceilingMaterial", scene);
//     ceilingMaterial.diffuseTexture = new Texture(ceilingTexture, scene);
//     ceilingMaterial.bumpTexture = new Texture(ceilingNormalTexture, scene);
//     ceilingMaterial.useParallax = true;
//     ceilingMaterial.useParallaxOcclusion = true;
//     ceilingMaterial.parallaxScaleBias = 0.2;

//     const ceiling = MeshBuilder.CreatePlane("ceiling", {size:GameSettings.roomSize});
//     ceiling.position.y = GameSettings.roomSize;
//     ceiling.rotation.x = -Math.PI / 2;
//     ceiling.material = ceilingMaterial;

// }

const buildTable = (scene: Scene) => {
    const table = MeshBuilder.CreateCylinder("tableTop", {
        height: GameSettings.tableHeight / 20,
        diameter: 2 * GameSettings.tableRadius,
        tessellation: 64
    });
    const tableMaterial = new StandardMaterial("tableMaterial", scene);
    tableMaterial.diffuseTexture = new Texture(tableTexture, scene);
    tableMaterial.bumpTexture = new Texture(tableNormalTexture, scene);
    tableMaterial.useParallax = true;
    tableMaterial.useParallaxOcclusion = true;
    tableMaterial.parallaxScaleBias = 0.2;
    table.material = tableMaterial;

    // const tableTrunk = MeshBuilder.CreateCylinder("tableTrunk", {
    //     height: GameSettings.tableHeight * 19 / 20,
    //     diameter: 1 / 4 * GameSettings.tableRadius
    // });
    // tableTrunk.material = tableMaterial;
    // tableTrunk.parent = table;
    // tableTrunk.position.y = -GameSettings.tableHeight * 19 / 20 / 2

    table.position.x = 0;
    table.position.z = 0;
    table.position.y = GameSettings.tableHeight - GameSettings.tableHeight / 20 / 2;

    // // Flat part of table foot
    // const legOutline = [new Vector3(-3, 0, -1), new Vector3(2, 0, -1)];

    // //Curved part of table foot
    // for (var i = 0; i < 20; i++) {
    //     legOutline.push(
    //         new Vector3(
    //             2 * Math.cos((i * Math.PI) / 40),
    //             0,
    //             2 * Math.sin((i * Math.PI) / 40) - 1
    //         )
    //     );
    // }

    // //Top of table foot
    // legOutline.push(new Vector3(0, 0, 1));
    // legOutline.push(new Vector3(-3, 0, 1));

    // //Extrude table foot
    // const tableLeg1 = MeshBuilder.ExtrudePolygon(
    //     "tableLeg1",
    //     { shape: legOutline, depth: 1 },
    //     scene
    // );

    // //Position first table foot
    // tableLeg1.rotation.x = -Math.PI / 2;
    // tableLeg1.parent = table;
    // tableLeg1.position.y = -8.5;
    // tableLeg1.position.x = 1.5;
    // tableLeg1.position.z = -0.5;
    // tableLeg1.scaling = new Vector3(1, 1, 0.5);
    // tableLeg1.material = tableMaterial;

    // //Create other table feet
    // const tableLeg2 = tableLeg1.clone("tableLeg2");
    // tableLeg2.position.x = -0.5;
    // tableLeg2.position.z = -1.5;
    // tableLeg2.rotation.y = Math.PI / 2;

    // const tableLeg3 = tableLeg1.clone("tableLeg3");
    // tableLeg3.position.x = -1.5;
    // tableLeg3.position.z = 0.5;
    // tableLeg3.rotation.y = Math.PI;

    // const tableLeg4 = tableLeg1.clone("tableLeg4");
    // tableLeg4.position.x = 0.5;
    // tableLeg4.position.z = 1.5;
    // tableLeg4.rotation.y = -Math.PI / 2;

    // //Spin table so feet are offset
    // table.rotation.y = Math.PI / 4;

    return table;
};

//Create a deck of cards at the deck position
const buildDeck = (scene: Scene, manager: GUI3DManager) => {
    var card: Card;

    for (var i = 0; i < GameSettings.deckSize; i++) {
        card = new Card(scene, manager, i % 6, i % 4);
        CardStack.deck.addToStack(card);
    }
};

const buildSeatCubes = (scene: Scene, manager: GUI3DManager, camera: ArcRotateCamera) => {
    var seatCube: SeatCube;

    for (var i = 0; i < GameSettings.players; i++) {
        seatCube = new SeatCube(scene, manager, camera, i);
    }
}

const buildBidCubes = (scene: Scene, manager: GUI3DManager) => {
    var pivot: TransformNode;
    var bidNumberCube: BidNumberCube;
    var bidSuitCube: BidSuitCube;

    for (var i = 0; i < GameSettings.players; i++) {
        pivot = new TransformNode("tableCentre");
        pivot.position = new Vector3(0, GameSettings.tableHeight, 0);
    
        for (var j = 0; j < 9; j++) {
            bidNumberCube = new BidNumberCube(scene, manager, pivot, i, j);
        }

        for (var j = 0; j < 6; j++) {
            bidSuitCube = new BidSuitCube(scene, manager, pivot, i, j);
        }

        const axis = new Vector3(0, 1, 0);
        const angle = i * 2 * Math.PI / GameSettings.players;
        pivot.rotate(axis, angle);
    }
}

const dealCards = (scene: Scene) => {
    var deck: CardStack = CardStack.deck;
    var card: Card | null;

    for (var i = 0; i < GameSettings.deckSize; i++) {
        card = deck.index[deck.cardsInStack - 1];
        debugger;
        if (card !== null) {
            card.dealCard(
                scene,
                i % GameSettings.players,
                i
            );
        }
    }
};

export const onSceneReady = (scene: Scene, settings: GameSettings) => {
    const engine = scene.getEngine();
    const canvas = engine.getRenderingCanvas();
    // if (canvas !== null) canvas.addEventListener("resize", function(){ engine.resize(); })

    // Add interactive layer
    const manager = new GUI3DManager(scene);

    const camera = new ArcRotateCamera(
        "camera",
        GameSettings.cameraAlpha,
        GameSettings.cameraBeta,
        GameSettings.cameraRadius,
        GameSettings.cameraTargets[3],
        scene
    );
    camera.upperBetaLimit = Math.PI / 2.2;
    camera.attachControl(canvas, true);
    camera.inputs.clear();
    const light = new HemisphericLight("light", new Vector3(2, 1, 2), scene);
    const light2 = new HemisphericLight("light2", new Vector3(-2, 1, 2), scene);
    const light3 = new HemisphericLight("light3", new Vector3(-2, 1, -2), scene);
    const light4 = new HemisphericLight("light4", new Vector3(2, 1, -2), scene);

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // Default intensity is 1
    light.intensity = 0.3;
    light2.intensity = 0.3;
    light3.intensity = 0.3;
    light4.intensity = 0.3;

    // buildRoom(scene);
    SceneLoader.Append(sceneAssets, "", scene, function (scene) {});
    buildTable(scene);
    buildSeatCubes(scene, manager, camera);
    buildBidCubes(scene, manager);
    buildDeck(scene, manager);
    // dealCards(scene);

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

export { baseRotation, baseRotationQuaternion, gaussianRandom };
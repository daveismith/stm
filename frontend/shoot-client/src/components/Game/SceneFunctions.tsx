import {
    Animation,
    ArcRotateCamera,
    CircleEase,
    EasingFunction,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    PointerEventTypes,
    Scene,
    Vector3,
    Vector4,
    StandardMaterial,
    CubeTexture,
    Color3,
    Texture,
    Quaternion,
    SSAORenderingPipeline
} from "@babylonjs/core";

import {
    GUI3DManager,
    MeshButton3D
} from "@babylonjs/gui";

import wallTexture from "./resources/images/wall.jpg";
import groundTexture from "./resources/images/ground.png";
import wallNormalTexture from "./resources/images/wall_normal.jpg";
import groundNormalTexture from "./resources/images/ground_normal.png";
import ceilingTexture from "./resources/images/ceiling.jpg";
import ceilingNormalTexture from "./resources/images/ceiling_normal.jpg";
import tableTexture from "./resources/images/table.png";
import cardTextures from "./resources/images/cards.png";

export {};

class GameSettings {
    static roomSize = 72;
    static tableRadius = 5;
    static tableHeight = 9;
    static players = 6;
    static deck: Mesh[] = [];
    static deckPosition = new Vector3(1.5, GameSettings.tableHeight + 0.01, 1.5);
    static deckSize = 48;
    static playerDealPositions: Vector3[] = [];
    static playMatPositions: Vector3[] = [];
    static handPositions: Vector3[] = [];
    static handRadius = new Vector3(2, 0, 1);
    static handCounter: number = 0; //FOR DEVELOPMENT ONLY
}

const gaussianRandom = () => {
    return (
        (1 / 3) *
        Math.sqrt(-2 * Math.log(1 - Math.random())) *
        Math.cos(2 * Math.PI * Math.random())
    );
};

const baseRotation = (seat: number) => {
    const x = 0;
    const y = -1/2 * Math.PI + 2 * Math.PI * seat / GameSettings.players;  //Rotations are offset by -PI/2
    const z = 0;

    return new Vector3(x, y, z);
}

const buildRoom = (scene: Scene) => {
    const wallMaterial = new StandardMaterial("wallMaterial", scene);
    wallMaterial.diffuseTexture = new Texture(wallTexture, scene);
    wallMaterial.bumpTexture = new Texture(wallNormalTexture, scene);
    wallMaterial.bumpTexture.level = 3;
    wallMaterial.useParallax = true;
    wallMaterial.useParallaxOcclusion = true;
    wallMaterial.parallaxScaleBias = 0.2;

    const backWall = MeshBuilder.CreatePlane("backWall", {size:GameSettings.roomSize});
    backWall.position.z = GameSettings.roomSize / 2;
    backWall.position.y = GameSettings.roomSize / 2;
    backWall.material = wallMaterial;

    const frontWall = MeshBuilder.CreatePlane("frontWall", {size:GameSettings.roomSize});
    frontWall.position.z = -1 * GameSettings.roomSize / 2;
    frontWall.position.y = GameSettings.roomSize / 2;
    frontWall.rotation.y = Math.PI;
    frontWall.material = wallMaterial;

    const leftWall = MeshBuilder.CreatePlane("leftWall", {size:GameSettings.roomSize});
    leftWall.position.x = -GameSettings.roomSize / 2;
    leftWall.position.y = GameSettings.roomSize / 2;
    leftWall.rotation.y = -Math.PI / 2;
    leftWall.material = wallMaterial;

    const rightWall = MeshBuilder.CreatePlane("rightWall", {size:GameSettings.roomSize});
    rightWall.position.x = GameSettings.roomSize / 2;
    rightWall.position.y = GameSettings.roomSize / 2;
    rightWall.rotation.y = Math.PI / 2;
    rightWall.material = wallMaterial;

    const groundMaterial = new StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseTexture = new Texture(groundTexture, scene);
    groundMaterial.bumpTexture = new Texture(groundNormalTexture, scene);
    groundMaterial.useParallax = true;
    groundMaterial.useParallaxOcclusion = true;
    groundMaterial.parallaxScaleBias = 0.2;

    const ground = MeshBuilder.CreateGround("ground", {width:GameSettings.roomSize, height:GameSettings.roomSize});
    ground.material = groundMaterial;

    const ceilingMaterial = new StandardMaterial("ceilingMaterial", scene);
    ceilingMaterial.diffuseTexture = new Texture(ceilingTexture, scene);
    ceilingMaterial.bumpTexture = new Texture(ceilingNormalTexture, scene);
    ceilingMaterial.useParallax = true;
    ceilingMaterial.useParallaxOcclusion = true;
    ceilingMaterial.parallaxScaleBias = 0.2;

    const ceiling = MeshBuilder.CreatePlane("ceiling", {size:GameSettings.roomSize});
    ceiling.position.y = GameSettings.roomSize;
    ceiling.rotation.x = -Math.PI / 2;
    ceiling.material = ceilingMaterial;

}

const buildTable = (scene: Scene) => {
    const table = MeshBuilder.CreateCylinder("tableTop", {
        height: GameSettings.tableHeight / 20,
        diameter: 2 * GameSettings.tableRadius,
        tessellation: 64
    });
    const tableMat = new StandardMaterial("tableMat", scene);
    tableMat.diffuseTexture = new Texture(tableTexture, scene);
    table.material = tableMat;

    const tableTrunk = MeshBuilder.CreateCylinder("tableTrunk", {
        height: GameSettings.tableHeight * 19 / 20,
        diameter: 1 / 4 * GameSettings.tableRadius
    });
    tableTrunk.material = tableMat;
    tableTrunk.parent = table;
    tableTrunk.position.y = -GameSettings.tableHeight * 19 / 20 / 2

    table.position.x = 0;
    table.position.z = 0;
    table.position.y = GameSettings.tableHeight - GameSettings.tableHeight / 20 / 2;

    // Flat part of table foot
    const legOutline = [new Vector3(-3, 0, -1), new Vector3(2, 0, -1)];

    //Curved part of table foot
    for (var i = 0; i < 20; i++) {
        legOutline.push(
            new Vector3(
                2 * Math.cos((i * Math.PI) / 40),
                0,
                2 * Math.sin((i * Math.PI) / 40) - 1
            )
        );
    }

    //Top of table foot
    legOutline.push(new Vector3(0, 0, 1));
    legOutline.push(new Vector3(-3, 0, 1));

    //Extrude table foot
    const tableLeg1 = MeshBuilder.ExtrudePolygon(
        "tableLeg1",
        { shape: legOutline, depth: 1 },
        scene
    );

    //Position first table foot
    tableLeg1.rotation.x = -Math.PI / 2;
    tableLeg1.parent = table;
    tableLeg1.position.y = -8.5;
    tableLeg1.position.x = 1.5;
    tableLeg1.position.z = -0.5;
    tableLeg1.scaling = new Vector3(1, 1, 0.5);
    tableLeg1.material = tableMat;

    //Create other table feet
    const tableLeg2 = tableLeg1.clone("tableLeg2");
    tableLeg2.position.x = -0.5;
    tableLeg2.position.z = -1.5;
    tableLeg2.rotation.y = Math.PI / 2;

    const tableLeg3 = tableLeg1.clone("tableLeg3");
    tableLeg3.position.x = -1.5;
    tableLeg3.position.z = 0.5;
    tableLeg3.rotation.y = Math.PI;

    const tableLeg4 = tableLeg1.clone("tableLeg4");
    tableLeg4.position.x = 0.5;
    tableLeg4.position.z = 1.5;
    tableLeg4.rotation.y = -Math.PI / 2;

    //Spin table so feet are offset
    table.rotation.y = Math.PI / 4;

    return table;
};

//Create a card at the deck position
const buildCard = (scene: Scene, manager: GUI3DManager, rank: number, suit: number) => {
    var faceUV = new Array(6);

    faceUV[5] = new Vector4(rank * 128 / 1024, suit * 128 / 1024, rank * 128 / 1024 + 77 / 1024, suit * 128 / 1024 + 115 / 1024);

    const card = MeshBuilder.CreateBox("card", {
        width: (1.4 * 3) / 4,
        height: 0.007,
        depth: (1 * 3) / 4,
        faceUV: faceUV
    });
    card.position = GameSettings.deckPosition.clone();
    card.rotation.y = -Math.PI / 2;

    const cardMat = new StandardMaterial("cardMat", scene);
    cardMat.diffuseTexture = new Texture(cardTextures, scene);
    card.material = cardMat;

    const cardButton = new MeshButton3D(card, "cardButton");
    cardButton.onPointerDownObservable.add(() => {
        if (card.position.z === GameSettings.deckPosition.z)
            dealCard(scene, card, 3, GameSettings.playerDealPositions[3], 0);
        else if (card.position.z > GameSettings.playerDealPositions[3].z - 0.3 && card.position.z < GameSettings.playerDealPositions[3].z + 0.3)
            animateCardToHand(card, 3, 1, scene);
        else if (card.position.z > GameSettings.handPositions[3].z - 0.3 && card.position.z < GameSettings.handPositions[3].z + 0.3
            && card.position.y === GameSettings.handPositions[3].y)
            animateAddCardToFan(card, 3, GameSettings.handCounter++, 1, scene);
        else if (card.position.z > GameSettings.handPositions[3].z - 0.5 && card.position.z < GameSettings.handPositions[3].z + 0.5)
           {
                playCard(card, 3, scene);
                GameSettings.handCounter--;
            }
    });

    manager.addControl(cardButton);

    return card;
};

//Create a deck of cards at the deck position
const buildDeck = (scene: Scene, manager: GUI3DManager) => {
    var card;

    for (var i = 0; i < GameSettings.deckSize; i++) {
        card = buildCard(scene, manager, i % 6, i % 4);
        card.position.y += i * 0.0072;
        GameSettings.deck.push(card);
    }
};

const setPositions = () => {
    //Radius ratio of position to deal cards to
    const dealPositionRatio = 3 / 5;
    //Radius ratio of position to play cards to
    const playMatRatio = 1 / 3;
    //Radius ratio of position to hold cards in hand
    const handRatio = 5 / 6;

    //Populate all card positions
    for (var i = 0; i < GameSettings.players; i++) {
        GameSettings.playerDealPositions.push(
            new Vector3(
                GameSettings.tableRadius *
                dealPositionRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.01,
                GameSettings.tableRadius *
                dealPositionRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            )
        );
        GameSettings.playMatPositions.push(
            new Vector3(
                GameSettings.tableRadius *
                playMatRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.01,
                GameSettings.tableRadius *
                playMatRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            )
        );
        GameSettings.handPositions.push(
            new Vector3(
                GameSettings.tableRadius *
                handRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.05,
                GameSettings.tableRadius *
                handRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            )
        );
    }
};

const animateCardSlide = (
    card: Mesh,
    targetPlayer: number,
    targetPosition: Vector3,
    targetRotation: Vector3,
    QueuePosition: number,
    cardsPerSecond: number,
    scene: Scene
) => {
    const frameRate: number = 60;
    const maxDriftDistance: number = 0.3;

    var xSlide = new Animation(
        "xSlide",
        "position.x",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var xSlideEase = new CircleEase();
    xSlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    var keyFramesPX = [];

    var xDrift = (gaussianRandom() - 1/2) * maxDriftDistance;

    keyFramesPX.push({
        frame: 0,
        value: card.position.x,
    });

    keyFramesPX.push({
        frame: 0 + (frameRate * QueuePosition) / cardsPerSecond,
        value: card.position.x,
    });

    keyFramesPX.push({
        frame: (frameRate + frameRate * QueuePosition) / cardsPerSecond,
        value: targetPosition.x + xDrift,
    });

    xSlide.setKeys(keyFramesPX);
    xSlide.setEasingFunction(xSlideEase);

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
        value: card.position.y,
    });

    keyFramesPY.push({
        frame: 0 + (frameRate * QueuePosition) / cardsPerSecond,
        value: card.position.y,
    });

    keyFramesPY.push({
        frame: (frameRate / 2 + frameRate * QueuePosition) / cardsPerSecond,
        value: targetPosition.y + 0.25,
    });

    keyFramesPY.push({
        frame: (frameRate + frameRate * QueuePosition) / cardsPerSecond,
        value:
            targetPosition.y + Math.floor(QueuePosition / GameSettings.players) * 0.0072,
    });

    ySlide.setKeys(keyFramesPY);
    ySlide.setEasingFunction(ySlideEase);

    var zSlide = new Animation(
        "zSlide",
        "position.z",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesPZ = [];

    var zSlideEase = new CircleEase();
    zSlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    var zDrift = (gaussianRandom() - 1/2) * maxDriftDistance;

    keyFramesPZ.push({
        frame: 0,
        value: card.position.z,
    });

    keyFramesPZ.push({
        frame: 0 + (frameRate * QueuePosition) / cardsPerSecond,
        value: card.position.z,
    });

    keyFramesPZ.push({
        frame: (frameRate + frameRate * QueuePosition) / cardsPerSecond,
        value: targetPosition.z + zDrift,
    });

    zSlide.setKeys(keyFramesPZ);
    zSlide.setEasingFunction(ySlideEase);

    var xRotate = new Animation(
        "xRotate",
        "rotation.x",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesRX = [];

    // limit to a quarter turn, and then add enough to compensate for seat number
    // var rotations = baseRotation(targetPlayer).x;

    // const axis = new Vector3(1, 1, 1);
    // const angle = targetRotation.x;
    // const quaternion = Quaternion.RotationAxis(axis, angle);
    // card.rotationQuaternion = quaternion;

    var xRotateEase = new CircleEase();
    xRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    keyFramesRX.push({
        frame: 0,
        value: card.rotation.x,
    });

    keyFramesRX.push({
        frame: 0 + (frameRate * QueuePosition) / cardsPerSecond,
        value: card.rotation.x,
    });

    keyFramesRX.push({
        frame: (frameRate + frameRate * QueuePosition) / cardsPerSecond,
        value: targetRotation.x,
    });

    xRotate.setKeys(keyFramesRX);
    xRotate.setEasingFunction(xSlideEase);

    var yRotate = new Animation(
        "yRotate",
        "rotation.y",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesRY = [];

    var yRotateEase = new CircleEase();
    yRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    keyFramesRY.push({
        frame: 0,
        value: card.rotation.y,
    });

    keyFramesRY.push({
        frame: 0 + (frameRate * QueuePosition) / cardsPerSecond,
        value: card.rotation.y,
    });

    keyFramesRY.push({
        frame: (frameRate + frameRate * QueuePosition) / cardsPerSecond,
        value: targetRotation.y,
    });

    yRotate.setKeys(keyFramesRY);
    yRotate.setEasingFunction(ySlideEase);

    var zRotate = new Animation(
        "zRotate",
        "rotation.z",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesRZ = [];

    var zRotateEase = new CircleEase();
    zRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    keyFramesRZ.push({
        frame: 0,
        value: card.rotation.z,
    });

    keyFramesRZ.push({
        frame: frameRate / cardsPerSecond,
        value: targetRotation.z,
    });

    zRotate.setKeys(keyFramesRZ);
    zRotate.setEasingFunction(zRotateEase);

    scene.beginDirectAnimation(
        card,
        [xSlide, ySlide, zSlide, xRotate, yRotate, zRotate],
        0,
        (frameRate + frameRate * QueuePosition) / cardsPerSecond,
        true
    );
};

const animateCardSlideQuaternion = (
    card: Mesh,
    targetPlayer: number,
    targetPosition: Vector3,
    targetRotation: Quaternion,
    QueuePosition: number,
    cardsPerSecond: number,
    scene: Scene
) => {
    const frameRate: number = 60;
    const maxDriftDistance: number = 0.3;

    var xSlide = new Animation(
        "xSlide",
        "position.x",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var xSlideEase = new CircleEase();
    xSlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    var keyFramesPX = [];

    var xDrift = (gaussianRandom() - 1/2) * maxDriftDistance;

    keyFramesPX.push({
        frame: 0,
        value: card.position.x,
    });

    keyFramesPX.push({
        frame: 0 + (frameRate * QueuePosition) / cardsPerSecond,
        value: card.position.x,
    });

    keyFramesPX.push({
        frame: (frameRate + frameRate * QueuePosition) / cardsPerSecond,
        value: targetPosition.x + xDrift,
    });

    xSlide.setKeys(keyFramesPX);
    xSlide.setEasingFunction(xSlideEase);

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
        value: card.position.y,
    });

    keyFramesPY.push({
        frame: 0 + (frameRate * QueuePosition) / cardsPerSecond,
        value: card.position.y,
    });

    keyFramesPY.push({
        frame: (frameRate / 2 + frameRate * QueuePosition) / cardsPerSecond,
        value: targetPosition.y + 0.25,
    });

    keyFramesPY.push({
        frame: (frameRate + frameRate * QueuePosition) / cardsPerSecond,
        value:
            targetPosition.y + Math.floor(QueuePosition / GameSettings.players) * 0.0072,
    });

    ySlide.setKeys(keyFramesPY);
    ySlide.setEasingFunction(ySlideEase);

    var zSlide = new Animation(
        "zSlide",
        "position.z",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesPZ = [];

    var zSlideEase = new CircleEase();
    zSlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    var zDrift = (gaussianRandom() - 1/2) * maxDriftDistance;

    keyFramesPZ.push({
        frame: 0,
        value: card.position.z,
    });

    keyFramesPZ.push({
        frame: 0 + (frameRate * QueuePosition) / cardsPerSecond,
        value: card.position.z,
    });

    keyFramesPZ.push({
        frame: (frameRate + frameRate * QueuePosition) / cardsPerSecond,
        value: targetPosition.z + zDrift,
    });

    zSlide.setKeys(keyFramesPZ);
    zSlide.setEasingFunction(ySlideEase);

    var qRotate = new Animation(
        "qRotate",
        "rotationQuaternion",
        frameRate,
        Animation.ANIMATIONTYPE_QUATERNION,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesRQ = [];

    // limit to a quarter turn, and then add enough to compensate for seat number
    // var rotations = baseRotation(targetPlayer).x;

    var qRotateEase = new CircleEase();
    qRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    keyFramesRQ.push({
        frame: 0,
        value: card.rotationQuaternion,
    });

    keyFramesRQ.push({
        frame: 0 + (frameRate * QueuePosition) / cardsPerSecond,
        value: card.rotationQuaternion,
    });

    keyFramesRQ.push({
        frame: (frameRate + frameRate * QueuePosition) / cardsPerSecond,
        value: targetRotation,
    });

    qRotate.setKeys(keyFramesRQ);
    qRotate.setEasingFunction(qRotateEase);

    scene.beginDirectAnimation(
        card,
        [xSlide, ySlide, zSlide, qRotate],
        0,
        (frameRate + frameRate * QueuePosition) / cardsPerSecond,
        true
    );
};

//Deal all cards
const dealCards = (scene: Scene) => {
    for (var i = 0; i < GameSettings.deckSize; i++) {
        dealCard(
            scene,
            GameSettings.deck[GameSettings.deckSize - 1 - i],
            i % GameSettings.players,
            GameSettings.playerDealPositions[i % GameSettings.players],
            i
        );
    }
};

const dealCard = (scene: Scene, card: Mesh, playerNumber: number, position: Vector3, QueuePosition: number) => {
    const rotations = new Vector3(
        baseRotation(playerNumber).x,
        baseRotation(playerNumber).y,
        baseRotation(playerNumber).z
    )

    animateCardSlide(
        card,
        playerNumber,
        position,
        baseRotation(playerNumber),
        QueuePosition,
        8,
        scene
    );
}

//Play a card to a player's mat
const playCard = (card: Mesh, player: number, scene: Scene) => {
    const rotationDriftFactor = new Vector3(0, 0.1, 0);
    const randomDrift = new Vector3(gaussianRandom(), gaussianRandom(), gaussianRandom());

    const rotations = new Vector3(
        baseRotation(player).x - Math.PI + 2 * Math.PI * rotationDriftFactor.x * (randomDrift.x - 1/2),
        baseRotation(player).y - Math.PI + 2 * Math.PI * rotationDriftFactor.y * (randomDrift.y - 1/2),
        baseRotation(player).z + 2 * Math.PI * rotationDriftFactor.z * (randomDrift.z - 1/2)
    )

    const rotationQuaternion = Quaternion.RotationYawPitchRoll(rotations.y, rotations.x, rotations.z);

    card.rotationQuaternion = card.rotation.toQuaternion();

    animateCardSlideQuaternion(card, player, GameSettings.playMatPositions[player], rotationQuaternion, 0, 1, scene);

    card.rotation = new Vector3(0, 0, 0);
};

//Bring a card from player's deal position to player's hand
const animateCardToHand = (
    card: Mesh,
    player: number,
    cardsPerSecond: number,
    scene: Scene
) => {
    const frameRate: number = 60;

    var xSlide = new Animation(
        "xSlide",
        "position.x",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var xSlideEase = new CircleEase();
    xSlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    var ySlideEase = new CircleEase();
    ySlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    var keyFramesPX = [];

    keyFramesPX.push({
        frame: 0,
        value: card.position.x,
    });

    keyFramesPX.push({
        frame: ((1 / 2) * frameRate) / cardsPerSecond,
        value: GameSettings.handPositions[player].x,
    });

    keyFramesPX.push({
        frame: (1 * frameRate) / cardsPerSecond,
        value: GameSettings.handPositions[player].x,
    });

    xSlide.setKeys(keyFramesPX);
    xSlide.setEasingFunction(ySlideEase);

    var ySlide = new Animation(
        "ySlide",
        "position.y",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesPY = [];

    keyFramesPY.push({
        frame: 0,
        value: card.position.y,
    });

    keyFramesPY.push({
        frame: ((1 / 2) * frameRate) / cardsPerSecond,
        value: GameSettings.handPositions[player].y,
    });

    keyFramesPY.push({
        frame: ((3 / 5) * frameRate) / cardsPerSecond,
        value: GameSettings.handPositions[player].y,
    });

    keyFramesPY.push({
        frame: ((4 / 5) * frameRate) / cardsPerSecond,
        value: GameSettings.handPositions[player].y + 1.2,
    });

    keyFramesPY.push({
        frame: (1 * frameRate) / cardsPerSecond,
        value: GameSettings.handPositions[player].y,
    });

    ySlide.setKeys(keyFramesPY);
    ySlide.setEasingFunction(ySlideEase);

    var zSlide = new Animation(
        "zSlide",
        "position.z",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesPZ = [];

    var zSlideEase = new CircleEase();
    zSlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    keyFramesPZ.push({
        frame: 0,
        value: card.position.z,
    });

    keyFramesPZ.push({
        frame: ((1 / 2) * frameRate) / cardsPerSecond,
        value: GameSettings.handPositions[player].z,
    });

    keyFramesPZ.push({
        frame: ((3 / 5) * frameRate) / cardsPerSecond,
        value: GameSettings.handPositions[player].z - 1.2,
    });

    keyFramesPZ.push({
        frame: ((4 / 5) * frameRate) / cardsPerSecond,
        value: GameSettings.handPositions[player].z,
    });

    keyFramesPZ.push({
        frame: (1 * frameRate) / cardsPerSecond,
        value: GameSettings.handPositions[player].z,
    });

    zSlide.setKeys(keyFramesPZ);
    zSlide.setEasingFunction(ySlideEase);

    var xRotate = new Animation(
        "xRotate",
        "rotation.x",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesRX = [];

    var xRotateEase = new CircleEase();
    xRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    keyFramesRX.push({
        frame: 0,
        value: card.rotation.x,
    });

    keyFramesRX.push({
        frame: ((1 / 2) * frameRate) / cardsPerSecond,
        value: card.rotation.x,
    });

    keyFramesRX.push({
        frame: ((3 / 4) * frameRate) / cardsPerSecond,
        value: (1 / 2) * (card.rotation.x + Math.PI),
    });

    keyFramesRX.push({
        frame: (1 * frameRate) / cardsPerSecond,
        value: Math.PI,
    });

    xRotate.setKeys(keyFramesRX);
    xRotate.setEasingFunction(xSlideEase);

    var yRotate = new Animation(
        "yRotate",
        "rotation.y",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesRY = [];

    var yRotateEase = new CircleEase();
    yRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    keyFramesRY.push({
        frame: 0,
        value: card.rotation.y,
    });

    keyFramesRY.push({
        frame: ((1 / 2) * frameRate) / cardsPerSecond,
        value: -Math.PI / 2,
    });

    keyFramesRY.push({
        frame: (1 * frameRate) / cardsPerSecond,
        value: -Math.PI / 2,
    });

    yRotate.setKeys(keyFramesRY);
    yRotate.setEasingFunction(ySlideEase);

    var zRotate = new Animation(
        "zRotate",
        "rotation.z",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesRZ = [];

    var zRotateEase = new CircleEase();
    zRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    keyFramesRZ.push({
        frame: 0,
        value: card.rotation.z,
    });

    keyFramesRZ.push({
        frame: frameRate / cardsPerSecond,
        value: 0,
    });

    zRotate.setKeys(keyFramesRZ);
    zRotate.setEasingFunction(zRotateEase);

    scene.beginDirectAnimation(
        card,
        [xSlide, ySlide, zSlide, xRotate, yRotate, zRotate],
        0,
        frameRate / cardsPerSecond,
        true
    );
};

const animateAddCardToFan = (
    card: Mesh,
    player: number,
    fanPosition: number,
    cardsPerSecond: number,
    scene: Scene
) => {
    var frameRate = 60;

    var xSlide = new Animation(
        "xSlide",
        "position.x",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesPX = [];

    var xSlideEase = new CircleEase();
    xSlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    keyFramesPX.push({
        frame: 0,
        value: card.position.x,
    });

    keyFramesPX.push({
        frame: frameRate / cardsPerSecond,
        value:
            GameSettings.handPositions[player].x +
            ((fanPosition - GameSettings.deckSize / GameSettings.players / 2) * GameSettings.handRadius.x) /
            (GameSettings.deckSize / GameSettings.players),
    });

    xSlide.setKeys(keyFramesPX);
    xSlide.setEasingFunction(xSlideEase);

    var ySlide = new Animation(
        "ySlide",
        "position.y",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesPY = [];

    var ySlideEase = new CircleEase();
    ySlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    keyFramesPY.push({
        frame: 0,
        value: card.position.y,
    });

    keyFramesPY.push({
        frame: frameRate / cardsPerSecond,
        value:
            GameSettings.handPositions[player].y +
            (0.016 * GameSettings.deckSize) / GameSettings.players -
            0.0072 * (fanPosition + 1),
    });

    ySlide.setKeys(keyFramesPY);
    ySlide.setEasingFunction(ySlideEase);

    var zSlide = new Animation(
        "zSlide",
        "position.z",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesPZ = [];

    var zSlideEase = new CircleEase();
    zSlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    keyFramesPZ.push({
        frame: 0,
        value: card.position.z,
    });

    keyFramesPZ.push({
        frame: frameRate / cardsPerSecond,
        value:
            GameSettings.handPositions[player].z +
            ((-1 / 64) *
                Math.pow(fanPosition + 0.5 - GameSettings.deckSize / GameSettings.players / 2, 2) +
                0.5) *
            GameSettings.handRadius.z,
    });

    zSlide.setKeys(keyFramesPZ);
    zSlide.setEasingFunction(zSlideEase);

    var xRotate = new Animation(
        "xRotate",
        "rotation.x",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesRX = [];

    var xRotateEase = new CircleEase();
    xRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    keyFramesRX.push({
        frame: 0,
        value: card.rotation.x,
    });

    keyFramesRX.push({
        frame: frameRate / cardsPerSecond,
        value: (15 / 16) * Math.PI,
    });

    xRotate.setKeys(keyFramesRX);
    xRotate.setEasingFunction(xRotateEase);

    var yRotate = new Animation(
        "yRotate",
        "rotation.y",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesRY = [];

    var yRotateEase = new CircleEase();
    yRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    keyFramesRY.push({
        frame: 0,
        value: card.rotation.y,
    });

    keyFramesRY.push({
        frame: frameRate / cardsPerSecond,
        // to do: add seat rotation
        value:
            -Math.PI / 2 + ((fanPosition + 0.5 - GameSettings.deckSize / GameSettings.players / 2) * Math.PI) / 16,
    });

    yRotate.setKeys(keyFramesRY);
    yRotate.setEasingFunction(yRotateEase);

    var zRotate = new Animation(
        "zRotate",
        "rotation.z",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesRZ = [];

    var zRotateEase = new CircleEase();
    zRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    keyFramesRZ.push({
        frame: 0,
        value: card.rotation.z,
    });

    keyFramesRZ.push({
        frame: frameRate / cardsPerSecond,
        value: -Math.PI / 32,
        // value: (fanPosition + 0.5 - deckSize / players / 2) * Math.PI/16
    });

    zRotate.setKeys(keyFramesRZ);
    zRotate.setEasingFunction(zRotateEase);

    scene.beginDirectAnimation(
        card,
        [xSlide, ySlide, zSlide, xRotate, yRotate, zRotate],
        0,
        frameRate / cardsPerSecond,
        true
    );
};

export const onSceneReady = (scene: Scene, settings: GameSettings) => {
    const engine = scene.getEngine();
    const canvas = engine.getRenderingCanvas();
    // if (canvas !== null) canvas.addEventListener("resize", function(){ engine.resize(); })

    // Add interactive layer
    const manager = new GUI3DManager(scene);

    const camera = new ArcRotateCamera(
        "camera",
        -Math.PI / 2,
        Math.PI / 4,
        17,
        new Vector3(0, 4, 3),
        scene
    );
    camera.upperBetaLimit = Math.PI / 2.2;
    camera.attachControl(canvas, true);
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

    buildRoom(scene);
    buildTable(scene);
    setPositions();
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

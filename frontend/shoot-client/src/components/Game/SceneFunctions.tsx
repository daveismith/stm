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
    StandardMaterial,
    CubeTexture,
    Color3,
    Texture
} from "@babylonjs/core";

import skyTexture1 from "./resources/images/skybox/skybox_nx.jpg";
import skyTexture2 from "./resources/images/skybox/skybox_ny.jpg";
import skyTexture3 from "./resources/images/skybox/skybox_nz.jpg";
import skyTexture4 from "./resources/images/skybox/skybox_px.jpg";
import skyTexture5 from "./resources/images/skybox/skybox_py.jpg";
import skyTexture6 from "./resources/images/skybox/skybox_pz.jpg";
import cardTextures from "./resources/images/cards.png";

class GameSettings {
    static roomSize = 48;
    static tableRadius = 5;
    static tableHeight = 9;
    static players = 6;
    static deck: Mesh[] = [];
    static deckPosition = new Vector3(1.5, GameSettings.tableHeight + 0.01, -1.5);
    static deckSize = 48;
    static playerDealPositions: Vector3[] = [];
    static playMatPositions: Vector3[] = [];
    static handPositions: Vector3[] = [];
    static handRadius = new Vector3(2, 0, 1);
}

const gaussianRandom = () => {
    return (
        (1 / 3) *
        Math.sqrt(-2 * Math.log(1 - Math.random())) *
        Math.cos(2 * Math.PI * Math.random())
    );
};

const buildSky = (scene: Scene) => {
    const skybox = MeshBuilder.CreateBox("skyBox", {size:GameSettings.roomSize}, scene);
    skybox.position.y = GameSettings.roomSize/2;
    const skyboxMaterial = new StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new CubeTexture("", scene, null, false, [skyTexture1, skyTexture2, skyTexture3, skyTexture4, skyTexture5, skyTexture6]);
    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
    skyboxMaterial.specularColor = new Color3(0, 0, 0);
    skybox.material = skyboxMaterial;
}

const buildTable = (scene: Scene) => {
    //Build cross-section of table
    const tableOutline = [
        new Vector3(0, 0, 0),
        new Vector3(GameSettings.tableRadius, 0, 0),
        new Vector3(GameSettings.tableRadius, -0.5, 0),
        new Vector3(1, -0.5, 0),
        new Vector3(1, -1 * GameSettings.tableHeight, 0),
    ];

    //Create table body
    const table = MeshBuilder.CreateLathe("table", {
        shape: tableOutline,
        sideOrientation: Mesh.DOUBLESIDE,
    });
    table.position.x = 0;
    table.position.z = 0;
    table.position.y = GameSettings.tableHeight;

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
const buildCard = (scene: Scene) => {
    const card = MeshBuilder.CreateBox("card", {
        width: (1 * 3) / 4,
        height: 0.007,
        depth: (1.4 * 3) / 4,
    });
    card.position = GameSettings.deckPosition.clone();

    // const textureFile = new File()
    // const textureURL = URL.createObjectURL(cardTextures);

    const cardMat = new StandardMaterial("cardMat", scene);
    cardMat.diffuseTexture = new Texture(cardTextures, scene);
    card.material = cardMat;
    
    return card;
};

//Create a deck of cards at the deck position
const buildDeck = (scene: Scene) => {
    var card;

    for (var i = 0; i < GameSettings.deckSize; i++) {
        card = buildCard(scene);
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
                GameSettings.tableHeight + 0.01,
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
    QueuePosition: number,
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

    var xSlideEase = new CircleEase();
    xSlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

    var keyFramesPX = [];

    var xDrift = gaussianRandom() * 0.3;

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

    var zDrift = gaussianRandom() * 0.3;

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

    var yRotate = new Animation(
        "yRotate",
        "rotation.y",
        frameRate,
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    var keyFramesRY = [];

    // limit to a quarter turn, and then add enough to compensate for seat number
    var rotations =
        (1 / 4) * (gaussianRandom() - 1 / 4) * Math.PI +
        (((2 * targetPlayer) % GameSettings.players) * Math.PI) / GameSettings.players;

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
        value: rotations,
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
        [xSlide, ySlide, zSlide, yRotate, zRotate],
        0,
        (frameRate + frameRate * QueuePosition) / cardsPerSecond,
        true
    );
};

//Deal all cards
const dealCards = (scene: Scene) => {
    for (var i = 0; i < GameSettings.deckSize; i++) {
        animateCardSlide(
            GameSettings.deck[GameSettings.deckSize - 1 - i],
            i,
            GameSettings.playerDealPositions[i % GameSettings.players],
            i,
            8,
            scene
        );
    }
};

//Play a card to a player's mat
const playCard = (card: Mesh, player: number, scene: Scene) => {
    animateCardSlide(card, player, GameSettings.playMatPositions[player], 0, 4, scene);
};

//Bring a card from player's deal position to player's hand
const animateCardToHand = (
    card: Mesh,
    player: number,
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
        value: 0,
    });

    keyFramesRY.push({
        frame: (1 * frameRate) / cardsPerSecond,
        value: 0,
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
            ((fanPosition + 0.5 - GameSettings.deckSize / GameSettings.players / 2) * Math.PI) / 16,
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

    buildSky(scene);
    buildTable(scene);
    setPositions();
    buildDeck(scene);

    for (var i = 2; i < GameSettings.deckSize; i += GameSettings.players) {
        animateCardToHand(GameSettings.deck[i], 3, 1, scene);
    }
    for (var i = 2; i < GameSettings.deckSize; i += GameSettings.players) {
        animateAddCardToFan(GameSettings.deck[i], 3, (i - 2) / GameSettings.players, 1, scene);
    }

    scene.onPointerObservable.add((pointerInfo) => {
        switch (pointerInfo.type) {
            case PointerEventTypes.POINTERDOUBLETAP:
                if (pointerInfo?.pickInfo?.hit) {
                    playCard(GameSettings.deck[2], 3, scene);
                }
                break;
        }
    });
};

/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
export const onRender = (scene: Scene) => {
    // if (box !== undefined) {
    //     var deltaTimeInMillis = scene.getEngine().getDeltaTime();
    //     const rpm = 10;
    //     box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
    // }
};

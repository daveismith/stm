import {
    Animation,
    ArcRotateCamera,
    CircleEase,
    EasingFunction,
    HemisphericLight,
    Mesh,
    MeshBuilder,
    Scene,
    Vector2,
    Vector3,
    Vector4,
    StandardMaterial,
    Texture,
    Quaternion,
    SSAORenderingPipeline,
    Color3,
    Space,
    TransformNode
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
import tableNormalTexture from "./resources/images/table_normal.png";
import cardTextures from "./resources/images/cards.png";
import cardNormalTexture from "./resources/images/cards_normal.png";
import iconTextures from "./resources/images/icons.png";

export {};

class GameSettings {
    static roomSize = 72;
    static tableRadius = 5;
    static tableHeight = 9;
    static players = 6;
    static deck: Mesh[] = [];
    static deckSize = 48;
    static handRadius = new Vector3(2, 0, 1);
    static currentPlayer: number = 3;
}

class CardStack {
    cardsInStack: number = 0;
    position: Vector3 = new Vector3(0, 0, 0);
    index: Card[] | null[] = new Array(GameSettings.deckSize);

    static cardStackSpacing = 0.008;
    static deck: CardStack;
    static dealMatStacks: CardStack[] = [];
    static playMatStacks: CardStack[] = [];
    static handStacks: CardStack[] = [];
    static fanStacks: CardStack[] = [];

    private static _initialize = (() => {
        //Radius ratio of position to deal cards to
        const dealPositionRatio = 3 / 5;
        //Radius ratio of position to play cards to
        const playMatRatio = 1 / 3;
        //Radius ratio of position to hold cards in hand
        const handRatio = 5 / 6;

        for(var i = 0; i < GameSettings.players; i++) {
            CardStack.dealMatStacks[i] = new CardStack();
            CardStack.playMatStacks[i] = new CardStack();
            CardStack.handStacks[i] = new CardStack();
            CardStack.fanStacks[i] = new CardStack();
        }

        CardStack.deck = new CardStack();
        CardStack.deck.position = new Vector3(1.5, GameSettings.tableHeight + 0.01, 1.5);

        //Populate all card positions
        for (var i = 0; i < GameSettings.players; i++) {
            CardStack.dealMatStacks[i].position = new Vector3(
                GameSettings.tableRadius *
                dealPositionRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.01,
                GameSettings.tableRadius *
                dealPositionRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            );
            CardStack.playMatStacks[i].position = new Vector3(
                GameSettings.tableRadius *
                playMatRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.01,
                GameSettings.tableRadius *
                playMatRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            );
            CardStack.handStacks[i].position = new Vector3(
                GameSettings.tableRadius *
                handRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.05,
                GameSettings.tableRadius *
                handRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            );
            CardStack.fanStacks[i].position = new Vector3(
                GameSettings.tableRadius *
                handRatio *
                Math.sin((2 / GameSettings.players) * Math.PI * i),
                GameSettings.tableHeight + 0.05,
                GameSettings.tableRadius *
                handRatio *
                Math.cos((2 / GameSettings.players) * Math.PI * i)
            );
        }
    })();

    removeFromStack (card: Card) {
        if (card.positionInDeck >= 0) this.index[card.positionInDeck] = null;
        card.positionInDeck = -1;
        this.cardsInStack--;
    }

    addToStack (card: Card) {
        if (card.cardStack !== null) card.cardStack.removeFromStack(card);
        this.index[this.cardsInStack] = card;
        card.positionInDeck = this.cardsInStack;
        card.cardStack = this;
        this.cardsInStack++;
    }
}

class Card {
    cardStack: CardStack | null = null;
    positionInDeck: number = -1;
    mesh: Mesh;
    static cardHeight = 0.007;
    static cardBaseRotation: Quaternion = Quaternion.RotationYawPitchRoll(-Math.PI / 2, 0, 0);

    constructor(scene: Scene, manager: GUI3DManager, rank: number, suit: number) {
        var faceUV = new Array(6);

        faceUV[5] = new Vector4(rank * 128 / 1024, suit * 128 / 1024, rank * 128 / 1024 + 77 / 1024, suit * 128 / 1024 + 115 / 1024);
    
        this.mesh = MeshBuilder.CreateBox("card", {
            width: (1.4 * 3) / 4,
            height: Card.cardHeight,
            depth: (1 * 3) / 4,
            faceUV: faceUV
        });
        this.mesh.position = CardStack.deck.position.clone();
        this.mesh.position.y += CardStack.deck.cardsInStack * CardStack.cardStackSpacing;
        this.mesh.rotationQuaternion = Card.cardBaseRotation;
    
        const cardMaterial = new StandardMaterial("cardMaterial", scene);
        cardMaterial.diffuseTexture = new Texture(cardTextures, scene);
        // cardMaterial.bumpTexture = new Texture(cardNormalTexture, scene);
        // cardMaterial.specularColor = new Color3(1,1,0);
        // cardMaterial.useParallax = true;
        // cardMaterial.useParallaxOcclusion = true;
        // cardMaterial.parallaxScaleBias = 0.2;
        this.mesh.material = cardMaterial;
    
        const cardButton = new MeshButton3D(this.mesh, "cardButton");
        cardButton.onPointerDownObservable.add(() => {
            if (this.mesh.position.z === CardStack.deck.position.z)
                this.dealCard(scene, 3, 0);
            else if (this.mesh.position.z > CardStack.dealMatStacks[3].position.z - 0.3 && this.mesh.position.z < CardStack.dealMatStacks[3].position.z + 0.3)
                this.pickUpCard(3, scene);
            else if (this.mesh.position.z > CardStack.handStacks[3].position.z - 0.3 && this.mesh.position.z < CardStack.handStacks[3].position.z + 0.3
                && this.mesh.position.y === CardStack.handStacks[3].position.y)
                this.fanCard(3, scene);
            else if (this.mesh.position.z > CardStack.handStacks[3].position.z - 0.5 && this.mesh.position.z < CardStack.handStacks[3].position.z + 0.5) {
                this.playCard(3, scene);
            }
        });
    
        manager.addControl(cardButton);
    }

    animateCardSlide (
        targetPosition: Vector3,
        targetRotation: Quaternion,
        QueuePosition: number,
        cardsPerSecond: number,
        scene: Scene
    ) {
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
    
        var keyFramesPX = [];
    
        keyFramesPX.push({
            frame: 0,
            value: this.mesh.position.x,
        });
    
        keyFramesPX.push({
            frame: 0 + (frameRate * QueuePosition) / cardsPerSecond,
            value: this.mesh.position.x,
        });
    
        keyFramesPX.push({
            frame: (frameRate + frameRate * QueuePosition) / cardsPerSecond,
            value: targetPosition.x,
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
            value: this.mesh.position.y,
        });
    
        keyFramesPY.push({
            frame: 0 + (frameRate * QueuePosition) / cardsPerSecond,
            value: this.mesh.position.y,
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
    
        keyFramesPZ.push({
            frame: 0,
            value: this.mesh.position.z,
        });
    
        keyFramesPZ.push({
            frame: 0 + (frameRate * QueuePosition) / cardsPerSecond,
            value: this.mesh.position.z,
        });
    
        keyFramesPZ.push({
            frame: (frameRate + frameRate * QueuePosition) / cardsPerSecond,
            value: targetPosition.z,
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
    
        var qRotateEase = new CircleEase();
        qRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    
        keyFramesRQ.push({
            frame: 0,
            value: this.mesh.rotationQuaternion,
        });
    
        keyFramesRQ.push({
            frame: 0 + (frameRate * QueuePosition) / cardsPerSecond,
            value: this.mesh.rotationQuaternion,
        });
    
        keyFramesRQ.push({
            frame: (frameRate + frameRate * QueuePosition) / cardsPerSecond,
            value: targetRotation,
        });
    
        qRotate.setKeys(keyFramesRQ);
        qRotate.setEasingFunction(qRotateEase);

        scene.beginDirectAnimation(
            this.mesh,
            [xSlide, ySlide, zSlide, qRotate],
            0,
            (frameRate + frameRate * QueuePosition) / cardsPerSecond,
            true
        );    
    }

    //Bring a card from player's deal position to player's hand
    animateCardToHand (
        player: number,
        cardsPerSecond: number,
        scene: Scene
    ) {
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
            value: this.mesh.position.x,
        });

        keyFramesPX.push({
            frame: ((1 / 2) * frameRate) / cardsPerSecond,
            value: CardStack.handStacks[player].position.x,
        });

        keyFramesPX.push({
            frame: (1 * frameRate) / cardsPerSecond,
            value: CardStack.handStacks[player].position.x,
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
            value: this.mesh.position.y,
        });

        keyFramesPY.push({
            frame: ((1 / 2) * frameRate) / cardsPerSecond,
            value: CardStack.handStacks[player].position.y,
        });

        keyFramesPY.push({
            frame: ((3 / 5) * frameRate) / cardsPerSecond,
            value: CardStack.handStacks[player].position.y,
        });

        keyFramesPY.push({
            frame: ((4 / 5) * frameRate) / cardsPerSecond,
            value: CardStack.handStacks[player].position.y + 1.2,
        });

        keyFramesPY.push({
            frame: (1 * frameRate) / cardsPerSecond,
            value: CardStack.handStacks[player].position.y,
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
            value: this.mesh.position.z,
        });

        keyFramesPZ.push({
            frame: ((1 / 2) * frameRate) / cardsPerSecond,
            value: CardStack.handStacks[player].position.z,
        });

        keyFramesPZ.push({
            frame: ((3 / 5) * frameRate) / cardsPerSecond,
            value: CardStack.handStacks[player].position.z - 1.2,
        });

        keyFramesPZ.push({
            frame: ((4 / 5) * frameRate) / cardsPerSecond,
            value: CardStack.handStacks[player].position.z,
        });

        keyFramesPZ.push({
            frame: (1 * frameRate) / cardsPerSecond,
            value: CardStack.handStacks[player].position.z,
        });

        zSlide.setKeys(keyFramesPZ);
        zSlide.setEasingFunction(ySlideEase);

        const handStackPosition = CardStack.handStacks[player].position;
        const rotationAxis = new Vector3(handStackPosition.x, 0, handStackPosition.z);
        const targetQuaternion: Quaternion = Quaternion.RotationAxis(rotationAxis.normalize(), Math.PI).multiply(baseRotation(player).toQuaternion());

        var qRotate = new Animation(
            "qRotate",
            "rotationQuaternion",
            frameRate,
            Animation.ANIMATIONTYPE_QUATERNION,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        var keyFramesRQ = [];

        var qRotateEase = new CircleEase();
        qRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);

        keyFramesRQ.push({
            frame: 0,
            value: this.mesh.rotationQuaternion,
        });

        // keyFramesRQ.push({
        //     frame: ((1 / 2) * frameRate) / cardsPerSecond,
        //     value: card.rotation.x,
        // });

        // keyFramesRQ.push({
        //     frame: ((3 / 4) * frameRate) / cardsPerSecond,
        //     value: (1 / 2) * (card.rotation.x + Math.PI),
        // });

        keyFramesRQ.push({
            frame: (1 * frameRate) / cardsPerSecond,
            value: targetQuaternion,
        });

        qRotate.setKeys(keyFramesRQ);
        qRotate.setEasingFunction(qRotateEase);

        scene.beginDirectAnimation(
            this.mesh,
            [xSlide, ySlide, zSlide, qRotate],
            0,
            frameRate / cardsPerSecond,
            true
        );
    }

    animateAddCardToFan (
        player: number,
        fanPosition: number,
        cardsPerSecond: number,
        scene: Scene
    ) {
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
            value: this.mesh.position.x,
        });
    
        keyFramesPX.push({
            frame: frameRate / cardsPerSecond,
            value:
                CardStack.handStacks[player].position.x +
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
            value: this.mesh.position.y,
        });
    
        keyFramesPY.push({
            frame: frameRate / cardsPerSecond,
            value:
                CardStack.handStacks[player].position.y +
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
            value: this.mesh.position.z,
        });
    
        keyFramesPZ.push({
            frame: frameRate / cardsPerSecond,
            value:
                CardStack.handStacks[player].position.z +
                ((-1 / 64) *
                    Math.pow(fanPosition + 0.5 - GameSettings.deckSize / GameSettings.players / 2, 2) +
                    0.5) *
                GameSettings.handRadius.z,
        });
    
        zSlide.setKeys(keyFramesPZ);
        zSlide.setEasingFunction(zSlideEase);
    
        const targetQuaternion: Quaternion = Quaternion.RotationYawPitchRoll(
            -Math.PI + ((fanPosition + 0.5 - GameSettings.deckSize / GameSettings.players / 2) * Math.PI) / 16,
            -(15 / 16) * Math.PI,
            -Math.PI / 32
            ).multiply(baseRotationQuaternion(player));
    
        var qRotate = new Animation(
            "qRotate",
            "rotationQuaternion",
            frameRate,
            Animation.ANIMATIONTYPE_QUATERNION,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
    
        var keyFramesRQ = [];
    
        var qRotateEase = new CircleEase();
        qRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
    
        keyFramesRQ.push({
            frame: 0,
            value: this.mesh.rotationQuaternion,
        });
    
        keyFramesRQ.push({
            frame: frameRate / cardsPerSecond,
            value: targetQuaternion,
        });
    
        qRotate.setKeys(keyFramesRQ);
        qRotate.setEasingFunction(qRotateEase);
    
        scene.beginDirectAnimation(
            this.mesh,
            [xSlide, ySlide, zSlide, qRotate],
            0,
            frameRate / cardsPerSecond,
            true
        )
    }
    
    dealCard (scene: Scene, player: number, QueuePosition: number) {
        const targetStack = CardStack.dealMatStacks[player];
        targetStack.addToStack(this);

        const rotationDriftFactor = new Vector3(0, 0.1, 0);
        const rotationDrift = new Vector3(gaussianRandom(), gaussianRandom(), gaussianRandom());
        const rotations = new Vector3(
            2 * Math.PI * rotationDriftFactor.x * rotationDrift.x,
            2 * Math.PI * rotationDriftFactor.y * rotationDrift.y,
            2 * Math.PI * rotationDriftFactor.z * rotationDrift.z
        )
        const rotationQuaternion = baseRotationQuaternion(player).multiply(Quaternion.RotationYawPitchRoll(rotations.y, rotations.x, rotations.z));
    
        const stackHeightCompensation = new Vector3(0, targetStack.cardsInStack * CardStack.cardStackSpacing, 0);
        const positionDriftFactor = new Vector3(0.3, 0, 0.3);
        const positionDrift = new Vector3(
            gaussianRandom() * positionDriftFactor.x,
            gaussianRandom() * positionDriftFactor.y,
            gaussianRandom() * positionDriftFactor.z
        );
        const position = targetStack.position.add(stackHeightCompensation).add(positionDrift);
            
        this.animateCardSlide(position, rotationQuaternion, QueuePosition, 8, scene);
    }

    playCard (player: number, scene: Scene) {
        const targetStack = CardStack.playMatStacks[player];
        targetStack.addToStack(this);

        const rotationDriftFactor = new Vector3(0, 0.1, 0);
        const rotationDrift = new Vector3(gaussianRandom(), gaussianRandom(), gaussianRandom());
        const rotations = new Vector3(
            -Math.PI + 2 * Math.PI * rotationDriftFactor.x * rotationDrift.x, // -Math.PI to flip card over.
            2 * Math.PI * rotationDriftFactor.y * rotationDrift.y,
            2 * Math.PI * rotationDriftFactor.z * rotationDrift.z
        )
        const rotationQuaternion = baseRotationQuaternion(player).multiply(Quaternion.RotationYawPitchRoll(rotations.y, rotations.x, rotations.z));
    
        const stackHeightCompensation = new Vector3(0, targetStack.cardsInStack * CardStack.cardStackSpacing, 0);
        const positionDriftFactor = new Vector3(0.3, 0, 0.3);
        const positionDrift = new Vector3(
            gaussianRandom() * positionDriftFactor.x,
            gaussianRandom() * positionDriftFactor.y,
            gaussianRandom() * positionDriftFactor.z
        );
        const position = targetStack.position.add(stackHeightCompensation).add(positionDrift);
            
        this.animateCardSlide(position, rotationQuaternion, 0, 1, scene);
    }

    pickUpCard (player: number, scene: Scene) {
        const targetStack = CardStack.handStacks[player];
        targetStack.addToStack(this);

        this.animateCardToHand(player, 1, scene);
    }

    fanCard (player: number, scene: Scene) {
        const targetStack = CardStack.fanStacks[player];
        targetStack.addToStack(this);

        const fanPosition: number = targetStack.cardsInStack;

        this.animateAddCardToFan(player, fanPosition, 1, scene);
    }
}

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
            targetHeight = this.mesh.position.y - bidCubeBounceHeight;
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

class BidSuitCube {
    bidNumberCubeRatio = 1/2;
    bidSuitCubeRatio = 7/16;
    bidCubeHeight = 1/4;
    mesh: Mesh;
    pivot: TransformNode;

    constructor(scene: Scene, manager: GUI3DManager, pivot: TransformNode, i: number, j: number) {
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

        const bidSuitCubeButton = new MeshButton3D(this.mesh, "bidSuitCubeButton");
        bidSuitCubeButton.onPointerDownObservable.add(() => {
            this.animateBidCube(scene, 1);
        });

        manager.addControl(bidSuitCubeButton);

        this.mesh.parent = this.pivot;
        this.mesh.position = new Vector3(
            (2.5 - j) * this.bidCubeHeight,
            0.1 - this.bidCubeHeight/2,
            GameSettings.tableRadius * this.bidSuitCubeRatio
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
            targetHeight = this.mesh.position.y - bidCubeBounceHeight;
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
        debugger;
        scene.beginDirectAnimation(
            this.mesh,
            [ySlide],
            0,
            frameRate * duration,
            true
        );    
    }
}

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
            camera.alpha = -1 * baseRotation(player).y + Math.PI;
            camera.beta = Math.PI / 4;
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
    const tableMaterial = new StandardMaterial("tableMaterial", scene);
    tableMaterial.diffuseTexture = new Texture(tableTexture, scene);
    tableMaterial.bumpTexture = new Texture(tableNormalTexture, scene);
    tableMaterial.useParallax = true;
    tableMaterial.useParallaxOcclusion = true;
    tableMaterial.parallaxScaleBias = 0.2;
    table.material = tableMaterial;

    const tableTrunk = MeshBuilder.CreateCylinder("tableTrunk", {
        height: GameSettings.tableHeight * 19 / 20,
        diameter: 1 / 4 * GameSettings.tableRadius
    });
    tableTrunk.material = tableMaterial;
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
    tableLeg1.material = tableMaterial;

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
        3 * Math.PI / 2,
        Math.PI / 4,
        12,
        // new Vector3(0, 4, 3),
        new Vector3(0, GameSettings.tableHeight, 0),
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

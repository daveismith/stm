import {
    Animation,
    CircleEase,
    Color3,
    EasingFunction,
    Mesh,
    MeshBuilder,
    Node,
    Nullable,
    Quaternion,
    Scene,
    StandardMaterial,
    Texture,
    Vector3,
    Vector4
} from "@babylonjs/core";

import {
    GUI3DManager,
    MeshButton3D
} from "@babylonjs/gui";

import { GameSettings } from "./GameSettings3D";
import { CardStack3D } from "./CardStack3D";
import { baseRotation, baseRotationQuaternion, gaussianRandom } from "./SceneFunctions";
import { Card as ProtoCard } from "../../../proto/shoot_pb";

import cardTextures from "./resources/images/cards.png";
import { GameState, SceneController } from "./SceneController";
import { IGame, cardFromProto } from "../../Game/Game.context";

class Card3D {
    cardStack: CardStack3D | null = null;
    positionInStack: number = -1;
    mesh: Mesh;
    static cardHeight = 0.007;
    static cardBaseRotation: Quaternion = Quaternion.RotationYawPitchRoll(-Math.PI / 2, 0, 0);
    card: ProtoCard;
    gameState: IGame;

    constructor(scene: Scene, manager: GUI3DManager, rank: number, suit: number, gameState: IGame) {
        this.gameState = gameState;
        this.card = new ProtoCard();
        this.card.setRank(rank ?? 0);
        this.card.setSuit(suit ?? 0);

        var faceUV = new Array(6);

        // Use rank-2 below because we're not playing with 7s and 8s.
        faceUV[5] = new Vector4((rank-2) * 128 / 1024, suit * 128 / 1024, (rank-2) * 128 / 1024 + 77 / 1024, suit * 128 / 1024 + 115 / 1024);
    
        this.mesh = MeshBuilder.CreateBox("card", {
            width: (1.4 * 3) / 4,
            height: Card3D.cardHeight,
            depth: (1 * 3) / 4,
            faceUV: faceUV
        });
        this.addToDeck();

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
            if (SceneController.gameState === GameState.ChoosingPlay)
                { this.playCard(); }
            else if (SceneController.gameState === GameState.ChoosingTransfer)
                { this.transferCard(); }
            else if (SceneController.gameState === GameState.ChoosingThrowaway)
                { this.throwAwayCard(); }
            else { console.log("skip card play attempt: not our turn"); }
        //     // if (this.mesh.position.z === CardStack3D.deck.position.z)
        //     //     this.dealCard(scene, 3, 0);
        //     if (this.mesh.position.z > CardStack3D.dealMatStacks[3].position.z - 0.3 && this.mesh.position.z < CardStack3D.dealMatStacks[3].position.z + 0.3)
        //         this.pickUpCard(3, scene);
        //     else if (this.mesh.position.z > CardStack3D.handStacks[3].position.z - 0.3 && this.mesh.position.z < CardStack3D.handStacks[3].position.z + 0.3
        //         && this.mesh.position.y === CardStack3D.handStacks[3].position.y)
        //         this.fanCard(3, scene);
        //     else if (this.mesh.position.z > CardStack3D.handStacks[3].position.z - 0.5 && this.mesh.position.z < CardStack3D.handStacks[3].position.z + 0.5) {
        //         this.playCard(3, scene);
        //     }
        });
    
        manager.addControl(cardButton);
    }

    addToDeck () {
        CardStack3D.deck.addToStack(this);
        this.mesh.position = CardStack3D.deck.position.clone();
        this.mesh.position.y += CardStack3D.deck.cardsInStack * CardStack3D.cardStackSpacing;
        this.mesh.rotationQuaternion = Card3D.cardBaseRotation.clone();
    }

    toggleGlow (glow: boolean) {
        let cardMaterial: StandardMaterial = this.mesh.material as StandardMaterial;
        if (glow)
            cardMaterial.emissiveColor = Color3.White();
        else
            cardMaterial.emissiveColor = Color3.Black();
    }

    animateCardSlide (
        targetPosition: Vector3,
        targetRotation: Quaternion,
        queuePosition: number,
        stackPosition: number,
        cardsPerSecond: number,
        arc: number,
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
            frame: 0 + (frameRate * queuePosition) / cardsPerSecond,
            value: this.mesh.position.x,
        });
    
        keyFramesPX.push({
            frame: (frameRate + frameRate * queuePosition) / cardsPerSecond,
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
            frame: 0 + (frameRate * queuePosition) / cardsPerSecond,
            value: this.mesh.position.y,
        });
    
        keyFramesPY.push({
            frame: (frameRate / 2 + frameRate * queuePosition) / cardsPerSecond,
            value: targetPosition.y + arc,
        });
    
        keyFramesPY.push({
            frame: (frameRate + frameRate * queuePosition) / cardsPerSecond,
            value:
                targetPosition.y + Math.floor(stackPosition / GameSettings.players) * 0.0072,
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
            frame: 0 + (frameRate * queuePosition) / cardsPerSecond,
            value: this.mesh.position.z,
        });
    
        keyFramesPZ.push({
            frame: (frameRate + frameRate * queuePosition) / cardsPerSecond,
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
            frame: 0 + (frameRate * queuePosition) / cardsPerSecond,
            value: this.mesh.rotationQuaternion,
        });
    
        keyFramesRQ.push({
            frame: (frameRate + frameRate * queuePosition) / cardsPerSecond,
            value: targetRotation,
        });
    
        qRotate.setKeys(keyFramesRQ);
        qRotate.setEasingFunction(qRotateEase);

        scene.beginDirectAnimation(
            this.mesh,
            [xSlide, ySlide, zSlide, qRotate],
            0,
            (frameRate + frameRate * queuePosition) / cardsPerSecond,
            true
        );    
    }

    //Bring a card from player's deal position to player's hand
    animateCardToHand (
        player: number,
        cardsPerSecond: number,
        scene: Scene,
        flipToVisible: boolean
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
            value: CardStack3D.handStacks[player].position.x,
        });

        keyFramesPX.push({
            frame: (1 * frameRate) / cardsPerSecond,
            value: CardStack3D.handStacks[player].position.x,
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
            value: CardStack3D.handStacks[player].position.y,
        });

        keyFramesPY.push({
            frame: ((3 / 5) * frameRate) / cardsPerSecond,
            value: CardStack3D.handStacks[player].position.y,
        });

        keyFramesPY.push({
            frame: ((4 / 5) * frameRate) / cardsPerSecond,
            value: CardStack3D.handStacks[player].position.y + 1.2,
        });

        keyFramesPY.push({
            frame: (1 * frameRate) / cardsPerSecond,
            value: CardStack3D.handStacks[player].position.y,
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
            value: CardStack3D.handStacks[player].position.z,
        });

        keyFramesPZ.push({
            frame: ((3 / 5) * frameRate) / cardsPerSecond,
            value: CardStack3D.handStacks[player].position.z - 1.2,
        });

        keyFramesPZ.push({
            frame: ((4 / 5) * frameRate) / cardsPerSecond,
            value: CardStack3D.handStacks[player].position.z,
        });

        keyFramesPZ.push({
            frame: (1 * frameRate) / cardsPerSecond,
            value: CardStack3D.handStacks[player].position.z,
        });

        zSlide.setKeys(keyFramesPZ);
        zSlide.setEasingFunction(ySlideEase);

        const handStackPosition = CardStack3D.handStacks[player].position;
        const rotationAxis = new Vector3(handStackPosition.x, 0, handStackPosition.z);
        const targetQuaternion: Quaternion = flipToVisible?
            Quaternion.RotationAxis(rotationAxis.normalize(), Math.PI).multiply(baseRotation(player).toQuaternion())
            : this.mesh.rotationQuaternion!;

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
                // CardStack3D.handStacks[player].position.x +
                // (Math.cos((2 / GameSettings.players) * Math.PI * (player + 1)) *
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
                // CardStack3D.handStacks[player].position.y +
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
                    // CardStack3D.handStacks[player].position.z +
                    // (Math.cos((2 / GameSettings.players) * Math.PI * (player + 1)) *
                    ((-1 / 64) * Math.pow(fanPosition + 0.5 - GameSettings.deckSize / GameSettings.players / 2, 2) + 0.5) *
                        GameSettings.handRadius.z,
        });
    
        zSlide.setKeys(keyFramesPZ);
        zSlide.setEasingFunction(zSlideEase);
    
        const targetQuaternion: Quaternion = Quaternion.RotationYawPitchRoll(
            Math.PI/2 + ((fanPosition + 0.5 - GameSettings.deckSize / GameSettings.players / 2) * Math.PI) / 16,
            -(15 / 16) * Math.PI,
            -Math.PI / 32
            );//.multiply(baseRotationQuaternion(player));
    
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
    
    dealCard (scene: Scene, player: number, queuePosition: number) {
        const targetStack = CardStack3D.dealMatStacks[player];
        targetStack.addToStack(this);

        const rotationDriftFactor = new Vector3(0, 0.1, 0);
        const rotationDrift = new Vector3(gaussianRandom(), gaussianRandom(), gaussianRandom());
        const rotations = new Vector3(
            2 * Math.PI * rotationDriftFactor.x * rotationDrift.x,
            2 * Math.PI * rotationDriftFactor.y * rotationDrift.y,
            2 * Math.PI * rotationDriftFactor.z * rotationDrift.z
        )
        const rotationQuaternion = baseRotationQuaternion(player).multiply(Quaternion.RotationYawPitchRoll(rotations.y, rotations.x, rotations.z));
    
        const stackHeightCompensation = new Vector3(0, targetStack.cardsInStack * CardStack3D.cardStackSpacing, 0);
        const positionDriftFactor = new Vector3(0.3, 0, 0.3);
        const positionDrift = new Vector3(
            gaussianRandom() * positionDriftFactor.x,
            gaussianRandom() * positionDriftFactor.y,
            gaussianRandom() * positionDriftFactor.z
        );
        const position = targetStack.position.add(stackHeightCompensation).add(positionDrift);
            
        this.animateCardSlide(position, rotationQuaternion, queuePosition, queuePosition, 8, 0.25, scene);
    }

    playCard () {
        SceneController.currentCard = this;
        console.log("attempting to play card: " + this.card.getRank() + this.card.getSuit());
        if (this.gameState.playCard) {
            this.gameState.playCard(cardFromProto(this.card));
            SceneController.awaitingServerResponse = true;
        }
    }

    playCardAnimation (player: number, scene: Scene, faceUp: boolean) {
        const targetStack = CardStack3D.playMatStacks[player];
        targetStack.addToStack(this);

        const flip: number = faceUp ? 1 : 0; // If 1, flip card face up.  Otherwise keep it face down.

        const rotationDriftFactor = new Vector3(0, 0.1, 0);
        const rotationDrift = new Vector3(gaussianRandom(), gaussianRandom(), gaussianRandom());
        const rotations = new Vector3(
            -Math.PI * flip + 2 * Math.PI * rotationDriftFactor.x * rotationDrift.x, // -Math.PI to flip card over.
            2 * Math.PI * rotationDriftFactor.y * rotationDrift.y,
            2 * Math.PI * rotationDriftFactor.z * rotationDrift.z
        )
        const rotationQuaternion = baseRotationQuaternion(player).multiply(Quaternion.RotationYawPitchRoll(rotations.y, rotations.x, rotations.z));
    
        const stackHeightCompensation = new Vector3(0, targetStack.cardsInStack * CardStack3D.cardStackSpacing, 0);
        const positionDriftFactor = new Vector3(0.3, 0, 0.3);
        const positionDrift = new Vector3(
            gaussianRandom() * positionDriftFactor.x,
            gaussianRandom() * positionDriftFactor.y,
            gaussianRandom() * positionDriftFactor.z
        );
        const position = targetStack.position.add(stackHeightCompensation).add(positionDrift);

        this.mesh.setParent(null);
            
        this.animateCardSlide(position, rotationQuaternion, 0, 0, 1, 0.25, scene);
    }

    transferCard () {
        SceneController.currentCard = this;
        console.log("attempting to transfer card: " + this.card.getRank() + this.card.getSuit() + " to " + SceneController.transferRecipient);
        if (this.gameState.transferCard) {
            this.gameState.transferCard(GameSettings.currentPlayer, SceneController.transferRecipient, cardFromProto(this.card));
            SceneController.awaitingServerResponse = true;
        }
    }

    throwAwayCard () {
        SceneController.currentCard = this;
        console.log("attempting to throw away card: " + this.card.getRank() + this.card.getSuit());
        if (this.gameState.throwAwayCard) {
            this.gameState.throwAwayCard(cardFromProto(this.card));
            SceneController.awaitingServerResponse = true;
        }
    }

    equals (comparator: ProtoCard) {
        return (this.card.getRank() ?? 0) === (comparator.getRank() ?? 0)
            && (this.card.getSuit() ?? 0) === (comparator.getSuit() ?? 0);
    }

    pickUpCard (player: number, scene: Scene) {
        const targetStack = CardStack3D.handStacks[player];
        const revealCards = player === GameSettings.currentPlayer;

        targetStack.addToStack(this);

        SceneController.hand[SceneController.hand.length] = this;

        this.animateCardToHand(player, 1, scene, revealCards);
    }

    static pickUpCards (player: number, scene: Scene) {
        const targetStack: CardStack3D = CardStack3D.dealMatStacks[player];
        const cardsInStack: number = targetStack.cardsInStack;

        for (let i: number = 0; i < cardsInStack; i++) {
            targetStack.index[i]?.pickUpCard(player, scene);
        }
    }

    fanCard (player: number, scene: Scene) {
        const targetStack: CardStack3D = CardStack3D.fanStacks[player];
        targetStack.addToStack(this);

        const fanPosition: number = targetStack.cardsInStack;

        this.mesh.setParent(CardStack3D.fanStacks[player].pivot);

        this.animateAddCardToFan(player, fanPosition, 1, scene);
    }

    static fanCards (player: number, scene: Scene) {
        const targetStack: CardStack3D = CardStack3D.handStacks[player];
        const cardsInStack: number = targetStack.cardsInStack;

        for (let i: number = 0; i < cardsInStack; i++) {
            targetStack.index[i]?.fanCard(player, scene);
        }
    }

    static dealCards (scene: Scene) {
        var deck: CardStack3D = CardStack3D.deck;
        var card: Card3D | null;

        // console.log(deck.index);
    
        for (var i = GameSettings.deckSize - 1; i >= 0; i--) {
            card = deck.index[i];
            
            if (card !== null) {
                card.dealCard(
                    scene,
                    i % GameSettings.players,
                    GameSettings.deckSize - 1 - i
                );
            }
        }
    }

    static clearCards (scene: Scene) {
        for (var i = 0; i < GameSettings.players; i++) {
            for (let card of CardStack3D.playMatStacks[i].index) {
                if (card) {
                    CardStack3D.trashStack.addToStack(card);
                    let newPosition: Vector3 = CardStack3D.trashStack.position.clone();
                    let newRotationQuaternion: Quaternion = card.mesh.rotationQuaternion ?? Card3D.cardBaseRotation;
                    card.animateCardSlide(newPosition, newRotationQuaternion, 0, CardStack3D.trashStack.cardsInStack, 1, 0, scene);
                }
            }
        }
    }

    static findCardInHands (targetCard: ProtoCard)
    {
        let cardStack: CardStack3D;
        let potentialMatch: Card3D | null;

        for (let i: number = 0; i < CardStack3D.fanStacks.length; i++) {
            cardStack = CardStack3D.fanStacks[i];

            if (i !== GameSettings.currentPlayer) // Skip searching our own hand.

                for (let j: number = 0; j < cardStack.index.length; j++) {
                    potentialMatch = cardStack.index[j];
                    console.log("checking source card " + j + ": " +  + potentialMatch?.card.getRank() + potentialMatch?.card.getSuit());

                    if (potentialMatch && potentialMatch.equals(targetCard)) {
                        return [i, j];
                    }
                }
        }

        return null;
    }

    static findCardInDeck (targetCard: ProtoCard) {
        let cardStack: CardStack3D = CardStack3D.deck;
        let potentialMatch: Card3D | null;

        for (let i: number = 0; i < cardStack.index.length; i++) {
            potentialMatch = cardStack.index[i];
            console.log('potential match ' + potentialMatch);

            if (potentialMatch && potentialMatch.equals(targetCard)) {
                return [-1, i];
            }
        }

        throw new Error('card not found in deck');
    }

    static swapCards (sourceCardLocation: number[], destinationCardLocation: number[]) {
        // if the card is already in the correct spot, do nothing
        if (sourceCardLocation[0] === destinationCardLocation[0] && sourceCardLocation[1] === destinationCardLocation[1])
            return;

        let sourcePlayer: number;
        let sourceIndexInStack: number;
        let sourceCard: Card3D | null;
        let sourcePosition: Vector3 = new Vector3(0, 0, 0);
        let sourceQuaternion: Quaternion | null = null;
        let sourceParent: Nullable<Node> = null;
        let sourceCardStack: CardStack3D | null = null;

        let destinationPlayer: number;
        let destinationIndexInStack: number;
        let destinationCard: Card3D | null;
        let destinationPosition: Vector3 = new Vector3(0, 0, 0);
        let destinationQuaternion: Quaternion | null = null;
        let destinationParent: Nullable<Node> = null;
        let destinationCardStack: CardStack3D | null = null;

        sourcePlayer = sourceCardLocation[0];
        sourceIndexInStack = sourceCardLocation[1];
        sourceCardStack = CardStack3D.fanStacks[sourcePlayer];

        sourceCard = sourceCardStack.index[sourceIndexInStack];
        if (sourceCard) {
            sourcePosition = sourceCard.mesh.position;
            sourceQuaternion = sourceCard.mesh.rotationQuaternion;
            sourceParent = sourceCard.mesh.parent;
        }
        else throw new Error('error swapping cards: problem with sourceCard');

        destinationPlayer = destinationCardLocation[0];
        destinationIndexInStack = destinationCardLocation[1];
        destinationCardStack = CardStack3D.fanStacks[destinationPlayer];

        destinationCard = destinationCardStack.index[destinationIndexInStack];
        if (destinationCard) {
            destinationPosition = destinationCard.mesh.position;
            destinationQuaternion = destinationCard.mesh.rotationQuaternion;
            destinationParent = destinationCard.mesh.parent;
        }
        else throw new Error('error swapping cards: problem with destinationCard');

        if (sourceCard && destinationCard) {
            sourceCard.mesh.position = destinationPosition;
            sourceCard.mesh.rotationQuaternion = destinationQuaternion;
            sourceCard.mesh.parent = destinationParent;
            sourceCard.cardStack = destinationCardStack;
            sourceCard.positionInStack = destinationIndexInStack;
            sourceCardStack.index[sourceIndexInStack] = destinationCard;

            destinationCard.mesh.position = sourcePosition;
            destinationCard.mesh.rotationQuaternion = sourceQuaternion;
            destinationCard.mesh.parent = sourceParent;
            destinationCard.cardStack = sourceCardStack;
            destinationCard.positionInStack = sourceIndexInStack;
            destinationCardStack.index[destinationIndexInStack] = sourceCard;
        }
        else throw new Error('error swapping cards: problem with swap');
    }
}

export { Card3D };

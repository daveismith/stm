// @ts-nocheck
import React from 'react';
import logo from './logo.svg';
import './App.css';
import SceneComponent from './SceneComponent.jsx';
import { FreeCamera, Vector3, HemisphericLight, MeshBuilder, Scene, ArcRotateCamera, EasingFunction, CircleEase, PointerEventTypes, Mesh, Animation } from "@babylonjs/core";

let box : any;

const onSceneReady = (scene : Scene) => {
  // // This creates and positions a free camera (non-mesh)
  // var camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);
  // // This targets the camera to scene origin
  // camera.setTarget(Vector3.Zero());
  // const canvas = scene.getEngine().getRenderingCanvas();
  // // This attaches the camera to the canvas
  // camera.attachControl(canvas, true);
  // // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
  // var light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
  // // Default intensity is 1. Let's dim the light a small amount
  // light.intensity = 0.7;
  // // Our built-in 'box' shape.
  // box = MeshBuilder.CreateBox("box", { size: 2 }, scene);
  // // Move the box upward 1/2 its height
  // box.position.y = 1;
  // // Our built-in 'ground' shape.
  // MeshBuilder.CreateGround("ground", { width: 6, height: 6 }, scene);
      // This creates a basic Babylon Scene object (non-mesh)
      // var scene = new Scene(engine);

      const canvas = scene.getEngine().getRenderingCanvas();

      const camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 4, 17, new Vector3(0, 4, 3), scene);
      camera.upperBetaLimit = Math.PI / 2.2;
      camera.attachControl(canvas, true);
      const light = new HemisphericLight("light", new Vector3(2, 1, 2), scene);
      const light2 = new HemisphericLight("light2", new Vector3(-2, 1, 2), scene);
      const light3 = new HemisphericLight("light3", new Vector3(-2, 1, -2), scene);
      const light4 = new HemisphericLight("light4", new Vector3(2, 1, -2), scene);
  
      // This attaches the camera to the canvas
      camera.attachControl(canvas, true);
  
      // Default intensity is 1. Let's dim the light a small amount
      light.intensity = 0.3;
      light2.intensity = 0.3;
      light3.intensity = 0.3;
      light4.intensity = 0.3;
  
      // Our built-in 'ground' shape.
      var ground = MeshBuilder.CreateGround("ground", {width: 16, height: 16}, scene);
  
      const tableRadius = 5;
      const tableHeight = 9;
      var playerSettings = [];
      const players = 6;
      const deck = [];
      const deckPosition = new Vector3(1.5, tableHeight + 0.01, -1.5);
      const deckSize = 48;
      const playMatPositions = [];
      const handPositions = [];
      const handRadius = new Vector3(2, 0, 1);
  
      const gaussianRandom = () => {
          return 1/3 * Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random())
      }
  
      const buildTable = () => {
          
          const tableOutline = [
              new Vector3(0, 0, 0),
              new Vector3(tableRadius, 0, 0),
              new Vector3(tableRadius, -0.5, 0),
              new Vector3(1, -0.5, 0),
              new Vector3(1, -1 * tableHeight, 0)
          ];
  
          //Create table body
          const table = MeshBuilder.CreateLathe("table", {shape: tableOutline, sideOrientation: Mesh.DOUBLESIDE});
          table.position.x = 0;
          table.position.z = 0;
          table.position.y = tableHeight;
  
          //base
          const legOutline = [
              new Vector3(-3, 0, -1),
              new Vector3(2, 0, -1),
          ]
  
          //curved front
          for (var i = 0; i < 20; i++) {
              legOutline.push(new Vector3(2 * Math.cos(i * Math.PI / 40), 0, 2 * Math.sin(i * Math.PI / 40) - 1));
          }
  
          //top
          legOutline.push(new Vector3(0, 0, 1));
          legOutline.push(new Vector3(-3, 0, 1));
  
          //back formed automatically
  
          const tableLeg1 = MeshBuilder.ExtrudePolygon("tableLeg1", {shape: legOutline, depth: 1}, scene);
          tableLeg1.rotation.x = -Math.PI / 2;
          tableLeg1.parent = table;
          tableLeg1.position.y = -8.5;
          tableLeg1.position.x = 1.5;
          tableLeg1.position.z = -0.5;
          tableLeg1.scaling = new Vector3(1, 1, 0.5);
  
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
  
          table.rotation.y = Math.PI / 4;
  
          return table;
      }
  
      const buildCard = () => {
          const card = MeshBuilder.CreateBox("card", {width: 1*3/4, height: 0.007, depth: 1.4*3/4})
          card.position = deckPosition.clone();
  
          return card;
      }
  
      const buildDeck = () => {
          var card;
  
          for (var i = 0; i < deckSize; i++) {
              card = buildCard();
              card.position.y += i*0.0072;
              // card.position.x += i*0.01;
              deck.push(card);
          }
      }
  
      const setPlaces = () => {
          var playerCube = [];
          var playerCubeName = [];
          const settingRatio = 3/5;
          const playMatRatio = 1/3;
          const handRatio = 5/6;
  
          for (var i = 0; i < players; i++) {
              playerSettings.push(new Vector3(tableRadius * settingRatio * Math.sin(2 / players * Math.PI * i), tableHeight + 0.01, tableRadius * settingRatio * Math.cos(2 / players * Math.PI * i)));
              playMatPositions.push(new Vector3(tableRadius * playMatRatio * Math.sin(2 / players * Math.PI * i), tableHeight + 0.01, tableRadius * playMatRatio * Math.cos(2 / players * Math.PI * i)));
              handPositions.push(new Vector3(tableRadius * handRatio * Math.sin(2 / players * Math.PI * i), tableHeight + 0.01, tableRadius * handRatio * Math.cos(2 / players * Math.PI * i)));
              // playerCubeName.push("setting"+i);
              // playerCube.push(MeshBuilder.CreateBox(playerCubeName[i],{width:0.5,height:0.5,depth:0.5}));
              // playerCube[i].position = handPositions[i];
          }
      }
  
      const animateCardSlide = (card, targetPosition, frameOffset, cardsPerSecond) => {
          var frameRate = 60;

          var xSlide = new Animation("xSlide", "position.x", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesPX = []; 
  
          var xSlideEase = new CircleEase();
          xSlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          var xDrift = gaussianRandom() * 0.3;
  
          keyFramesPX.push({
              frame: 0,
              value: card.position.x
          });
  
          keyFramesPX.push({
              frame: 0 + frameRate * frameOffset / cardsPerSecond,
              value: card.position.x
          });
  
          keyFramesPX.push({
              frame: (frameRate + frameRate * frameOffset) / cardsPerSecond,
              value: targetPosition.x + xDrift
          });
  
          xSlide.setKeys(keyFramesPX);
          xSlide.setEasingFunction(ySlideEase);
  
          var ySlide = new Animation("ySlide", "position.y", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesPY = []; 
  
          var ySlideEase = new CircleEase();
          ySlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          keyFramesPY.push({
              frame: 0,
              value: card.position.y
          });
  
          keyFramesPY.push({
              frame: 0 + frameRate * frameOffset / cardsPerSecond,
              value: card.position.y
          });
  
          keyFramesPY.push({
              frame: (frameRate/2 + frameRate * frameOffset) / cardsPerSecond,
              value: targetPosition.y + 0.25
          });
  
          keyFramesPY.push({
              frame: (frameRate + frameRate * frameOffset) / cardsPerSecond,
              value: targetPosition.y + Math.floor(frameOffset / players) * 0.0072
          });
  
          ySlide.setKeys(keyFramesPY);
          ySlide.setEasingFunction(ySlideEase);
  
          var zSlide = new Animation("zSlide", "position.z", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesPZ = []; 
  
          var zSlideEase = new CircleEase();
          zSlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          var zDrift = gaussianRandom() * 0.3;
  
          keyFramesPZ.push({
              frame: 0,
              value: card.position.z
          });
  
          keyFramesPZ.push({
              frame: 0 + frameRate * frameOffset / cardsPerSecond,
              value: card.position.z
          });
  
          keyFramesPZ.push({
              frame: (frameRate + frameRate * frameOffset) / cardsPerSecond,
              value: targetPosition.z + zDrift
          });
  
          zSlide.setKeys(keyFramesPZ);
          zSlide.setEasingFunction(ySlideEase);
  
          var yRotate = new Animation("yRotate", "rotation.y", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesRY = [];
          
          // limit to a quarter turn, and then add enough to compensate for seat number
          var rotations = 1/4 * (gaussianRandom() - 1/4) * Math.PI + 2 * i % players * Math.PI / players;
  
          var yRotateEase = new CircleEase();
          yRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          keyFramesRY.push({
              frame: 0,
              value: card.rotation.y
          });
  
          keyFramesRY.push({
              frame: 0 + frameRate * frameOffset / cardsPerSecond,
              value: card.rotation.y
          });
  
          keyFramesRY.push({
              frame: (frameRate + frameRate * frameOffset) / cardsPerSecond,
              value: rotations
          });
  
          yRotate.setKeys(keyFramesRY);
          yRotate.setEasingFunction(ySlideEase);
  
          var zRotate = new Animation("zRotate", "rotation.z", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesRZ = [];
          
          var zRotateEase = new CircleEase();
          zRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          keyFramesRZ.push({
              frame: 0,
              value: card.rotation.z
          });
  
          keyFramesRZ.push({
              frame: frameRate / cardsPerSecond,
              value: 0
          });
  
          zRotate.setKeys(keyFramesRZ);
          zRotate.setEasingFunction(zRotateEase);
  
          scene.beginDirectAnimation(card, [xSlide, ySlide, zSlide, yRotate, zRotate], 0, (frameRate + frameRate * frameOffset) / cardsPerSecond, true);
      }
  
      const dealCards = () => {
          for(var i = 0; i < deckSize; i++) {
              animateCardSlide(deck[deckSize - 1 - i], playerSettings[i % players], i, 8);
          }
      }
  
      const playCard = (card, player) => {
          animateCardSlide(card, playMatPositions[player], 0, 4);
      }
  
      const animateCardToHand = (card, player, cardsPerSecond) => {
          var frameRate = 60;
  
          var xSlide = new Animation("xSlide", "position.x", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesPX = []; 
  
          var xSlideEase = new CircleEase();
          xSlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          keyFramesPX.push({
              frame: 0,
              value: card.position.x
          });
  
          keyFramesPX.push({
              frame: 1/2 * frameRate / cardsPerSecond,
              value: handPositions[player].x
          });
  
          keyFramesPX.push({
              frame: 1 * frameRate / cardsPerSecond,
              value: handPositions[player].x
          });
  
          xSlide.setKeys(keyFramesPX);
          xSlide.setEasingFunction(ySlideEase);
  
          var ySlide = new Animation("ySlide", "position.y", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesPY = []; 
  
          var ySlideEase = new CircleEase();
          ySlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          keyFramesPY.push({
              frame: 0,
              value: card.position.y
          });
  
          keyFramesPY.push({
              frame: 1/2 * frameRate / cardsPerSecond,
              value: handPositions[player].y
          });
  
          keyFramesPY.push({
              frame: 3/5 * frameRate / cardsPerSecond,
              value: handPositions[player].y
          });
  
          keyFramesPY.push({
              frame: 4/5 * frameRate / cardsPerSecond,
              value: handPositions[player].y + 1.2
          });
  
          keyFramesPY.push({
              frame: 1 * frameRate / cardsPerSecond,
              value: handPositions[player].y
          });
  
          ySlide.setKeys(keyFramesPY);
          ySlide.setEasingFunction(ySlideEase);
  
          var zSlide = new Animation("zSlide", "position.z", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesPZ = []; 
  
          var zSlideEase = new CircleEase();
          zSlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          keyFramesPZ.push({
              frame: 0,
              value: card.position.z
          });
  
          keyFramesPZ.push({
              frame: 1/2 * frameRate / cardsPerSecond,
              value: handPositions[player].z
          });
  
          keyFramesPZ.push({
              frame: 3/5 * frameRate / cardsPerSecond,
              value: handPositions[player].z - 1.2
          });
  
          keyFramesPZ.push({
              frame: 4/5 * frameRate / cardsPerSecond,
              value: handPositions[player].z
          });
  
          keyFramesPZ.push({
              frame: 1 * frameRate / cardsPerSecond,
              value: handPositions[player].z
          });
  
          zSlide.setKeys(keyFramesPZ);
          zSlide.setEasingFunction(ySlideEase);
  
          var xRotate = new Animation("xRotate", "rotation.x", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesRX = [];
          
          var xRotateEase = new CircleEase();
          xRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          keyFramesRX.push({
              frame: 0,
              value: card.rotation.x
          });
  
          keyFramesRX.push({
              frame: 1/2 * frameRate / cardsPerSecond,
              value: card.rotation.x
          });
  
          keyFramesRX.push({
              frame: 3/4 * frameRate / cardsPerSecond,
              value: 1/2 * (card.rotation.x + Math.PI)
          });
  
          keyFramesRX.push({
              frame: 1 * frameRate / cardsPerSecond,
              value: Math.PI
          });
  
          xRotate.setKeys(keyFramesRX);
          xRotate.setEasingFunction(xSlideEase);
  
          var yRotate = new Animation("yRotate", "rotation.y", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesRY = [];
          
          var yRotateEase = new CircleEase();
          yRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          keyFramesRY.push({
              frame: 0,
              value: card.rotation.y
          });
  
          keyFramesRY.push({
              frame: 1/2 * frameRate / cardsPerSecond,
              value: 0
          });
  
          keyFramesRY.push({
              frame: 1 * frameRate / cardsPerSecond,
              value: 0
          });
  
          yRotate.setKeys(keyFramesRY);
          yRotate.setEasingFunction(ySlideEase);
  
          var zRotate = new Animation("zRotate", "rotation.z", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesRZ = [];
          
          var zRotateEase = new CircleEase();
          zRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          keyFramesRZ.push({
              frame: 0,
              value: card.rotation.z
          });
  
          keyFramesRZ.push({
              frame: frameRate / cardsPerSecond,
              value: 0
          });
  
          zRotate.setKeys(keyFramesRZ);
          zRotate.setEasingFunction(zRotateEase);
  
          scene.beginDirectAnimation(card, [xSlide, ySlide, zSlide, xRotate, yRotate, zRotate], 0, frameRate / cardsPerSecond, true);
      }
  
      const animateAddCardToFan = (card, player, fanPosition, cardsPerSecond) => {
          var frameRate = 60;
  
          var xSlide = new Animation("xSlide", "position.x", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesPX = [];
  
          var xSlideEase = new CircleEase();
          xSlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          keyFramesPX.push({
              frame: 0,
              value: card.position.x
          });
  
          keyFramesPX.push({
              frame: frameRate / cardsPerSecond,
              value: handPositions[player].x + (fanPosition - deckSize / players / 2) * handRadius.x / (deckSize / players)
          });
  
          xSlide.setKeys(keyFramesPX);
          xSlide.setEasingFunction(xSlideEase);
  
          var ySlide = new Animation("ySlide", "position.y", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesPY = []; 
  
          var ySlideEase = new CircleEase();
          ySlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          keyFramesPY.push({
              frame: 0,
              value: card.position.y
          });
  
          keyFramesPY.push({
              frame: frameRate / cardsPerSecond,
              value: handPositions[player].y + 0.016 * deckSize / players - 0.0072 * (fanPosition + 1)
          });
  
          ySlide.setKeys(keyFramesPY);
          ySlide.setEasingFunction(ySlideEase);
  
          var zSlide = new Animation("zSlide", "position.z", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesPZ = []; 
  
          var zSlideEase = new CircleEase();
          zSlideEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          keyFramesPZ.push({
              frame: 0,
              value: card.position.z
          });
  
          keyFramesPZ.push({
              frame: frameRate / cardsPerSecond,
              value: handPositions[player].z + (-1/64 * Math.pow(fanPosition + 0.5 - deckSize / players / 2, 2) + 0.5) * handRadius.z
          });
  
          zSlide.setKeys(keyFramesPZ);
          zSlide.setEasingFunction(zSlideEase);
  
          var xRotate = new Animation("xRotate", "rotation.x", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesRX = [];
          
          var xRotateEase = new CircleEase();
          xRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          keyFramesRX.push({
              frame: 0,
              value: card.rotation.x
          });
  
          keyFramesRX.push({
              frame: frameRate / cardsPerSecond,
              value: 15/16*Math.PI
          });
  
          xRotate.setKeys(keyFramesRX);
          xRotate.setEasingFunction(xRotateEase);
  
          var yRotate = new Animation("yRotate", "rotation.y", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesRY = [];
          
          var yRotateEase = new CircleEase();
          yRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          keyFramesRY.push({
              frame: 0,
              value: card.rotation.y
          });
  
          keyFramesRY.push({
              frame: frameRate / cardsPerSecond,
              // to do: add seat rotation
              value: (fanPosition + 0.5 - deckSize / players / 2) * Math.PI/16
          });
  
          yRotate.setKeys(keyFramesRY);
          yRotate.setEasingFunction(yRotateEase);
  
          var zRotate = new Animation("zRotate", "rotation.z", frameRate, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
          
          var keyFramesRZ = [];
          
          var zRotateEase = new CircleEase();
          zRotateEase.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
  
          keyFramesRZ.push({
              frame: 0,
              value: card.rotation.z
          });
  
          keyFramesRZ.push({
              frame: frameRate / cardsPerSecond,
              value: -Math.PI/32
              // value: (fanPosition + 0.5 - deckSize / players / 2) * Math.PI/16
          });
  
          zRotate.setKeys(keyFramesRZ);
          zRotate.setEasingFunction(zRotateEase);
  
          scene.beginDirectAnimation(card, [xSlide, ySlide, zSlide, xRotate, yRotate, zRotate], 0, frameRate / cardsPerSecond, true);
      }
  
      buildTable();
      buildDeck();
      setPlaces(6);
      // dealCards();
      // playCard(deck[0], 0);
      for (var i = 2; i < deckSize; i += players) {
          animateCardToHand(deck[i],3,1);
      }
      for (var i = 2; i < deckSize; i += players) {
          animateAddCardToFan(deck[i],3,(i-2)/players,1);
      }
  
      scene.onPointerObservable.add((pointerInfo) => {            
          switch (pointerInfo.type) {
             case PointerEventTypes.POINTERDOUBLETAP:
                  if(pointerInfo.pickInfo.hit) {
                      playCard(deck[2], 3);
                  }
              break;
          }
      });  
};
/**
 * Will run on every frame render.  We are spinning the box on y-axis.
 */
const onRender = (scene : any) => {
  if (box !== undefined) {
    var deltaTimeInMillis = scene.getEngine().getDeltaTime();
    const rpm = 10;
    box.rotation.y += (rpm / 60) * Math.PI * 2 * (deltaTimeInMillis / 1000);
  }
};

const divStyle = {
  height: '100%',
  width: '100%',
};

function App() {
  return (
    <div className="App" style={divStyle}>
        <SceneComponent antialias onSceneReady={onSceneReady} onRender={onRender} id="my-canvas" style={divStyle} />
    </div>
  );
}

export default App;

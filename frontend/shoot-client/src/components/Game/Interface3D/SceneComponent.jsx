import { Engine, Scene } from "@babylonjs/core";
import React, { useEffect, useRef } from "react";
import { useGame } from "../Game.context";
import { useApp } from "../../App/App.context";

const SceneComponent = (props) => {
  const reactCanvas = useRef(null);

  const [ gameState ] = useGame();

  const [ appState ] = useApp();

const {
    antialias,
    engineOptions,
    adaptToDeviceRatio,
    sceneOptions,
    onRender,
    onSceneReady,
    ...rest
  } = props;

  useEffect(() => {
    if (reactCanvas.current) {
      const engine = new Engine(
        reactCanvas.current,
        antialias,
        engineOptions,
        adaptToDeviceRatio
      );
      const scene = new Scene(engine, sceneOptions);
      if (scene.isReady()) {
        props.onSceneReady(scene, gameState, appState);
      } else {
        scene.onReadyObservable.addOnce((scene) =>
          props.onSceneReady(scene, gameState, appState)
        );
      }
      engine.runRenderLoop(() => {
        if (typeof onRender === "function") {
          onRender(scene);
        }
        scene.render();
      });
      const resize = () => {
        scene.getEngine().resize();
      };
      if (window) {
        window.addEventListener("resize", resize);
      }
      return () => {
        scene.getEngine().dispose();
        if (window) {
          window.removeEventListener("resize", resize);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reactCanvas]);
  return <canvas ref={reactCanvas} {...rest} />;
};

export default SceneComponent;

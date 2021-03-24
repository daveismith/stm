import React from "react";
import GameControls from "./GameControls";
import SceneComponent from "./SceneComponent";
import { onSceneReady, onRender } from "./SceneFunctions";
import "./Game.css";

const Game: React.FC = () => {
      
    return (  
        <div className="game">
            <div className="row">
                <div className="column-3">
                    <SceneComponent className="scene" antialias onSceneReady={onSceneReady} onRender={onRender} id="my-canvas" />
                </div>
                <div className="column-1">
                    <GameControls></GameControls>
                </div>
            </div>
        </div>
    );
};

export default Game;

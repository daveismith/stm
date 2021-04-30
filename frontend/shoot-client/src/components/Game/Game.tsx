import React from "react";
import { useGame } from "./Game.context";
import { onSceneReady, onRender } from "./SceneFunctions";
import GameControls from "./GameControls/GameControls";
import SceneComponent from "./SceneComponent";
import GameBoard from "./GameBoard/GameBoard";

import "./Game.css";
import { useApp } from "../App/App.context";

const Game: React.FC = () => {
      
    const [ gameState ] = useGame();
    const [ appState ] = useApp();

    const getView = () => {
        if (gameState.sceneView) {
            return <SceneComponent className="scene" antialias onSceneReady={onSceneReady} onRender={onRender} id="my-canvas" />;
        }
        return <GameBoard
            hand={gameState.hand}
        />;
    }

    return (
        <div className="game">
            <div className="row">
                <div className="column-3">
                    {getView()}
                </div>
                <div className="column-1">
                    <GameControls
                        score={gameState.score}
                        tricks={gameState.tricks}
					/>
                </div>
            </div>
        </div>
    );
};

export default Game;

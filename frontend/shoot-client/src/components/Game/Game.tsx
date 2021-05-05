import React from "react";
import { useGame } from "./Game.context";
import { onSceneReady, onRender } from "./SceneFunctions";
import GameControls from "./GameControls/GameControls";
import SceneComponent from "./SceneComponent";
import GameBoard from "./GameBoard/GameBoard";
import NameDialog from "../Common/NameDialog"
import "./Game.css";

const Game: React.FC = () => {
      
    const [ gameState ] = useGame();

    const getView = () => {
        if (gameState.sceneView) {
            return <SceneComponent 
                        className="scene" 
                        antialias 
                        onSceneReady={onSceneReady} 
                        onRender={onRender} 
                        id="my-canvas" 
                    />;
        }
        return <GameBoard
                    hand={gameState.hand}
                />;
    }

    const getContent = () => {
        if(gameState.playerName) {
            return (<div className="row">
                <div className="column-3">
                    {getView()}
                </div>
                <div className="column-1">
                    <GameControls
                        score={gameState.score}
                        tricks={gameState.tricks}
                    />
                </div>
            </div>);
        }
        return (<NameDialog isOpen={true}/>)
    }

    return (
        <div className="game">
            { getContent() }
        </div>
    );
};

export default Game;

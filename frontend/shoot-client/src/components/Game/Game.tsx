import React from "react";
import { useGame } from "./Game.context";
import { onSceneReady, onRender } from "./Interface3D/SceneFunctions";
import GameControls from "./GameControls/GameControls";
import SceneComponent from "./Interface3D/SceneComponent";
import GameBoard from "./GameBoard/GameBoard";
import NameDialog from "./GameBoard/NameDialog"
import "./Game.css";
import SelectSeat from "../SelectSeat/SelectSeat";
import { GameSettings } from "../Game/Interface3D/GameSettings3D";
import { SceneController } from "./Interface3D/SceneController";

const Game: React.FC = () => {

    const [ gameState ] = useGame();
    const { started } = gameState;

    const getView = () => {
        if (gameState.sceneView) {
            SceneController.clientIn3DMode = true;
            GameSettings.initializeGame(gameState.seats.size);
            return <SceneComponent 
                        className="scene" 
                        antialias 
                        onSceneReady={onSceneReady} 
                        onRender={onRender}
                        gameState={gameState}
                        id="my-canvas" 
                    />;
        } else {
            SceneController.clientIn3DMode = false;
        }
        if (!started) {
            return <SelectSeat  />
        } else {
            return <GameBoard
                hand={gameState.hand}
                seats={gameState.seats}
                mySeat={gameState.mySeat}
                currentSeat={gameState.currentSeat}
                playedCards={gameState.playedCards}
                highBid={gameState.highBid}
                bids={gameState.bids}
                currentBidder={gameState.currentBidder}
                bidTricksSelected={gameState.bidTricksSelected}
                bidTrumpSelected={gameState.bidTrumpSelected}
            />;
        }
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
        return (<NameDialog />)
    }

    return (
        <div className="game">
            { getContent() }
        </div>
    );
};

export default Game;

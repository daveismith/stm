import React, { useEffect } from "react";
import { useHistory } from "react-router-dom";

import { useApp } from "../App/App.context";
import "./CreateGame.css";

const CreateGame: React.FC = () => {
    const [ appState ] = useApp();
    const { gameId, createGame }  = appState;
    const history = useHistory();

    useEffect(() => {
        if (appState.gameId) {
            history.push('/game/' + appState.gameId);
        }
    });

    return (  
        <div>
            <button onClick={ () => createGame(2) }>Create 2 Player Game</button><br />
            <button onClick={ () => createGame(4) }>Create 4 Player Game</button><br />
            <button onClick={ () => createGame(6) }>Create 6 Player Game</button><br />
            <strong>Game Id: </strong> {gameId}
        </div>
    );
};

export default CreateGame;

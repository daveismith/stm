import { join } from "node:path";
import React, { createContext, useContext, useState } from "react";
import { useParams } from "react-router-dom";
import { useApp } from "../App/App.context";

import { Card } from "../../proto/shoot_pb";

export interface IGame {
    numPlayers: number;
    sceneView: boolean;
    score: number[];
    tricks: number[];
    hand: Card[];
}

interface ParamTypes{ 
    id: string 
};

type GameContextType = (IGame | ((param: any) => void))[];

const card1 = new Card();
card1.setRank(Card.Rank.ACE);
card1.setSuit(Card.Suit.SPADES);

const card2 = new Card();
card2.setRank(Card.Rank.JACK);
card2.setSuit(Card.Suit.HEARTS);

const initialState: IGame = {
    numPlayers: 6,
    sceneView: false,
    score: [27, 9],
    tricks: [3, 2],
    hand: [card1, card2]
}

export const GameContext: React.Context<GameContextType> = createContext<GameContextType>([{ ...initialState }]);

export const GameProvider: React.FC = ({ children }) => {
    const [ appState, setAppState ] = useApp();
    const [ state, setState ] = useState(initialState);
    const { id } = useParams<ParamTypes>();

    const { joinGame } = appState;

    console.log(appState);

    if (!appState.joined) {
        console.log('joining game');

        //joinGame(id, 'name')
    } else {
        appState.stream.on('data', (notification: Notification) => {
            console.log(notification);
        });
    }

    return (
        <GameContext.Provider value={ [state, setState] }>
            { children }
        </GameContext.Provider>
    );
};

export const useGame: any = () => {
    const contextValue: GameContextType = useContext(GameContext);
    return contextValue;
}

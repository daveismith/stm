import React, { createContext, useContext, useState } from "react";

export interface IGame {
    numPlayers: number;
    sceneView: boolean;
    score: number[];
    tricks: number[];
}

type GameContextType = (IGame | ((param: any) => void))[];

const initialState: IGame = {
    numPlayers: 6,
    sceneView: false,
    score: [27, 9],
    tricks: [3, 2]
}

export const GameContext: React.Context<GameContextType> = createContext<GameContextType>([{ ...initialState }]);

export const GameProvider: React.FC = ({ children }) => {
    const contextValue = useState(initialState);
    return (
        <GameContext.Provider value={ contextValue }>
            { children }
        </GameContext.Provider>
    );
};

export const useGame: any = () => {
    const contextValue: GameContextType = useContext(GameContext);
    return contextValue;
}

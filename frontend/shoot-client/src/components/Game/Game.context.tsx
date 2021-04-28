import React, { createContext, useContext, useState } from "react";

import { Card } from "../../proto/shoot_pb";

export interface IGame {
    numPlayers: number;
    sceneView: boolean;
    score: number[];
    tricks: number[];
    hand: Card[]
}

type GameContextType = (IGame | ((param: any) => void))[];

const card1 = new Card()
card1.setRank(Card.Rank.ACE)
card1.setSuit(Card.Suit.SPADES)

const card2 = new Card()
card2.setRank(Card.Rank.JACK)
card2.setSuit(Card.Suit.HEARTS)

const initialState: IGame = {
    numPlayers: 6,
    sceneView: false,
    score: [27, 9],
    tricks: [3, 2],
    hand: [card1, card2]
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

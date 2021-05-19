import React, { createContext, useContext, useEffect, useState } from "react";
import { produce } from "immer";
import { useParams } from "react-router-dom";
import { useApp } from "../App/App.context";
import { Notification, SeatDetails, SeatsList } from '../../proto/shoot_pb';

import { Card } from "../../proto/shoot_pb";

export interface ISeat {
    seat: number;
    ready: boolean;
    empty: boolean;
    human: boolean;
    name: string;
}

export interface IGame {
    playerName?: string;
    numPlayers: number;
    sceneView: boolean;
    score: number[];
    tricks: number[];
    hand: Card[];
    seats: ISeat[];
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
    playerName: undefined,
    numPlayers: 6,
    sceneView: false,
    score: [27, 9],
    tricks: [3, 2],
    hand: [card1, card2],
    seats: []
}

let registered: boolean = false;

export const GameContext: React.Context<GameContextType> = createContext<GameContextType>([{ ...initialState }]);

export const GameProvider: React.FC = ({ children }) => {
    const [ appState ] = useApp();
    const [ state, setState ] = useState(initialState);
    const { id } = useParams<ParamTypes>();

    const { joinGame } = appState;

    useEffect(() => {
        if (!state.playerName) return;
        if (!appState.joined) {
            joinGame(id, state.playerName);
        } else if (!registered) {
            appState.stream.on('data', (notification: Notification) => {
                if (notification.hasScores()) {
                    console.log('score update');
                    // Handle A Score Update
                    setState(produce(draft => {
                        draft.score[0] = notification.getScores()?.getTeam1() as number;
                        draft.score[1] = notification.getScores()?.getTeam2() as number;
                    }))
                } else if (notification.hasTricks()) {
                    console.log('tricks update');
                    // Handle A Tricks Update
                    setState(produce(draft => {
                        draft.tricks[0] = notification.getTricks()?.getTeam1() as number;
                        draft.tricks[1] = notification.getTricks()?.getTeam2() as number;
                    }));
                } else if (notification.hasSeatList()) {
                    console.log('seats list');
                    // Handle Seat List Update
                    const seatList: SeatDetails[] = notification.getSeatList()?.getSeatsList() as SeatDetails[];
                    let { seats } = { ...state };
                    seats.length = 0;   // Clear This Out
                    for (let value of seatList) {
                        seats.push(value.toObject());
                    };
                    setState({...state, seats: seats});
                } else {
                    console.log('game data');
                    const obj: object = notification.toObject();
                    console.log(obj);
                }
            });
    
            registered = true;
        }
    });

    

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

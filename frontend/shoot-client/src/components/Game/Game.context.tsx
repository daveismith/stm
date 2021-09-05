import React, { createContext, useContext, useEffect, useState } from "react";
import { produce } from "immer";
import { useParams } from "react-router-dom";
import { useApp } from "../App/App.context";
import { Notification, SeatDetails, Bid as BidDetails } from '../../proto/shoot_pb';
import { Card } from "./Models/Card";
import { Seat } from "./Models/Seat";
import { Bid } from "./Models/Bid";
import { EventEmitter3D } from "./Interface3D/EventEmitter3D";

export interface IGame {
    playerName?: string;
    numPlayers: number;
    sceneView: boolean;
    score: number[];
    tricks: number[];
    hand: Card[];
    seats: Map<number, Seat>;
    playedCards: Map<number, Card>;
    bids: Map<number, Bid>;
    bidTricksSelected: string | null;
    bidTrumpSelected: string | null;
    eventEmitter: EventEmitter3D;
}

interface ParamTypes{ 
    id: string 
};

type GameContextType = (IGame | ((param: any) => void))[];

const card1: Card = {
    rank: Card.Rank.ACE,
    suit: Card.Suit.SPADES
};

const card2: Card = {
    rank: Card.Rank.JACK,
    suit: Card.Suit.HEARTS
};

const bid2: Bid = {
    number: 6,
    trump: Bid.Trump.SPADES,
    shootNum: -1,
    seat: 1,
};

const initialState: IGame = {
    playerName: undefined,
    numPlayers: 6,
    sceneView: false,
    score: [27, 9],
    tricks: [3, 2],
    hand: [card1, card2],
    seats: new Map(),
    playedCards: new Map([[1, card1]]),
    bids: new Map([[2, bid2]]),
    bidTricksSelected: null,
    bidTrumpSelected: null,
    eventEmitter: new EventEmitter3D()
};

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
                    }));
                } else if (notification.hasTricks()) {
                    console.log('tricks update');
                    // Handle A Tricks Update
                    setState(produce(draft => {
                        draft.tricks[0] = notification.getTricks()?.getTeam1() as number;
                        draft.tricks[1] = notification.getTricks()?.getTeam2() as number;
                        state.eventEmitter.emit("tricks");
                    }));
                } else if (notification.hasSeatList()) {
                    console.log('seats list');
                    // Handle Seat List Update
                    setState(produce(draft => {
                        const seatDetailsList: SeatDetails[] = notification.getSeatList()?.getSeatsList() as SeatDetails[];
                        
                        draft.seats = new Map();
                        for (let seatDetails of seatDetailsList) {
                            const seat: Seat = {
                                index: seatDetails.getSeat(),
                                name: seatDetails.getName(),
                                empty: seatDetails.getEmpty(),
                                human: seatDetails.getHuman(),
                                ready: seatDetails.getReady(),
                            };
                            draft.seats.set(seat.index, seat);
                        }
                        state.eventEmitter.emit("seats", seatDetailsList);
                    }));
                } else if (notification.hasStartGame()) {
                    console.log('start game');
                    // const obj: object = notification.toObject();
                    // console.log(obj);
                    state.eventEmitter.emit('startGame');
                } else if (notification.hasBidRequest()) {
                    console.log('bid request');
                    // const obj: object = notification.toObject();
                    // console.log(obj);
                    state.eventEmitter.emit("bidRequest");
                } else if (notification.hasBidList()) {
                    console.log('bid list');
                    // const obj: object = notification.toObject();
                    // console.log(obj);
                    setState(produce(draft => {
                        const bidDetailsList: BidDetails[] = notification.getBidList()?.getBidsList() as BidDetails[];
                        
                        draft.bids = new Map();
                        for (let bidDetails of bidDetailsList) {
                            const bid: Bid = {
                                number: bidDetails.getTricks(),
                                shootNum: bidDetails.getShootNum(),
                                trump: bidDetails.getTrump(),
                                seat: bidDetails.getSeat(),
                            };
                            draft.bids.set(bid.seat, bid);
                        }
                    state.eventEmitter.emit("bids", bidDetailsList);
                }));
                } else if (notification.hasHand()) {
                    console.log('received hand');
                    // const obj: object = notification.toObject();
                    // console.log(obj);
                    state.eventEmitter.emit("hand", notification.getHand());
                } else {
                        console.log('game data');
                        // const obj: object = notification.toObject();
                        // console.log(obj);
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

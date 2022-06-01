import React, { createContext, useContext, useEffect, useState } from "react";
import { produce } from "immer";
import { useParams } from "react-router-dom";
import { useApp } from "../App/App.context";
import * as grpcWeb from 'grpc-web';
import { Notification, 
    SeatDetails, 
    Bid as BidDetails, 
    Hand, 
    Card as ProtoCard, 
    TakeSeatRequest, 
    StatusResponse,
    SetReadyStatusRequest,
    Trump,
    TrumpUpdate
} from '../../proto/shoot_pb';
import { Card } from "./Models/Card";
import { Seat } from "./Models/Seat";
import { Bid } from "./Models/Bid";
import { EventEmitter3D } from "./Interface3D/EventEmitter3D";
import { SceneController } from "./Interface3D/SceneController";
import { GameEvent3D } from "./Interface3D/GameEvent3D";

export interface IGame {
    playerName?: string;
    started: boolean;
    sceneView: boolean;
    score: number[];
    tricks: number[];
    hand: Card[];
    seats: Map<number, Seat>;
    mySeat?: number;
    currentSeat?: number;
    playedCards: Map<number, Card>;
    currentBidder: boolean;
    highBid: Bid | null;
    winningBid: Bid | null;
    bids: Map<number, Bid>;
    bidTricksSelected: string | null;
    bidTrumpSelected: string | null;
    eventEmitter: EventEmitter3D;

    takeSeat?(seat: number): void;
    setSeatReadyStatus?(ready: boolean): void;
    createBid?(tricks: number, shootNum: number, trump: Bid.Trump, seat: number): void;
    playCard?(card: Card): void;
}

interface ParamTypes{ 
    id: string 
};

export type GameContextType = (IGame | ((param: any) => void))[];

const cleanInitialState: IGame = {
    playerName: undefined,
    started: false,
    sceneView: false,
    score: [0, 0],
    tricks: [0, 0],
    hand: [],
    seats: new Map(),
    mySeat: -1,
    currentSeat: -1,
    playedCards: new Map(),
    currentBidder: false,
    highBid: null,
    winningBid: null,
    bids: new Map(),
    bidTricksSelected: null,
    bidTrumpSelected: null,
    eventEmitter: new EventEmitter3D(),

    takeSeat: undefined,
    setSeatReadyStatus: undefined,
    createBid: undefined,
    playCard: undefined
};

let registered: boolean = false;

export const GameContext: React.Context<GameContextType> = createContext<GameContextType>([{ ...cleanInitialState }]);

export const cardFromProto = (card: ProtoCard): Card => {
    const suit: number = card.getSuit() as number;
    const rank: number = card.getRank() as number;

    return {suit: suit as Card.Suit, rank: rank as Card.Rank};
}

export const cardToProto = (card: Card): ProtoCard => {
    const suit: Card.Suit = card.suit as Card.Suit;
    const rank: Card.Rank = card.rank as Card.Rank;

    const protoCard: ProtoCard = new ProtoCard();
    protoCard.setSuit(suit);
    protoCard.setRank(rank);

    return protoCard;
}

export const GameProvider: React.FC = ({ children }) => {
    const [ appState ] = useApp();
    const [ state, setState ] = useState(cleanInitialState);
    const { id } = useParams<ParamTypes>();

    const { joinGame } = appState;

    const { eventEmitter } = state;

    console.log(state)

    useEffect(() => {
        if (!state.playerName) return;
        if (!appState.joined) {
            joinGame(id, state.playerName);
        } else if (!registered) {
            appState.stream.on('data', (notification: Notification) => {
                console.log("rx notification sequence: " + notification.getSequence());
                SceneController.addNewEvent(new GameEvent3D(notification, state.eventEmitter));

                if (notification.hasScores()) {
                    console.log('score update');
                    // Handle A Score Update
                    setState(produce(draft => {
                        draft.score[0] = notification.getScores()?.getTeam1() as number;
                        draft.score[1] = notification.getScores()?.getTeam2() as number;
                    }));
                } else if (notification.hasTricks()) {
                    console.log('tricks update');
                    console.log(notification.getTricks());
                    // Handle A Tricks Update
                    setState(produce(draft => {
                        draft.tricks[0] = notification.getTricks()?.getTeam1() as number;
                        draft.tricks[1] = notification.getTricks()?.getTeam2() as number;
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
                    }));
                } else if (notification.hasStartGame()) {
                    console.log('start game');
                    setState(produce(draft => {
                        draft.started = true;
                    }));                    
                } else if (notification.hasBidRequest()) {
                    console.log('bid request');
                    setState(produce(draft => {
                        draft.currentBidder = true;
                    }));
                } else if (notification.hasBidList()) {
                    console.log('bid list');
                    setState(produce(draft => {
                        const bidDetailsList: BidDetails[] = notification.getBidList()?.getBidsList() as BidDetails[];
                        
                        let highBid = null;
                        draft.bids = new Map();
                        for (let bidDetails of bidDetailsList) {
                            const bid: Bid = {
                                number: bidDetails.getTricks(),
                                shootNum: bidDetails.getShootNum(),
                                trump: Bid.fromProtoTrump(bidDetails.getTrump()),
                                seat: bidDetails.getSeat(),
                            };
                            draft.bids.set(bid.seat, bid);

                            if (bidDetails.getSeat() === draft.mySeat) {
                                draft.currentBidder = false;
                            }

                            if (highBid == null ||  highBid.number < bid.number || highBid.shootNum < bid.shootNum) {
                                highBid = bid;
                            }
                        }
                        draft.highBid = highBid;
                }));
                } else if (notification.hasHand()) {
                    console.log('received hand');
                    const hand: Hand = notification.getHand()!;
                    const cards: Card[] = hand.getHandList().map(cardFromProto);
                    
                    setState(produce(draft => {
                        draft.hand = cards;
                    }));
                } else if (notification.hasTransferRequest()) {
                    console.log('transfer request');
                } else if (notification.hasTransfer()) {
                    console.log('transfer');
                } else if (notification.hasThrowawayRequest()) {
                    console.log('throwaway request');
                } else if (notification.hasTrumpUpdate()) {
                    console.log('trump update');
                    setState(produce(draft => {
                        const trump: TrumpUpdate = notification.getTrumpUpdate()!;

                        draft.bids = new Map();
                        draft.highBid = null;
                        draft.winningBid = {
                            number: trump.getTricks(),
                            shootNum: trump.getShootNum(),
                            trump: Bid.fromProtoTrump(trump.getTrump()),
                            seat: trump.getSeat(),
                        };

                    }));
                } else if (notification.hasPlayCardRequest()) {
                    console.log('play card request');
                    setState(produce(draft => {
                        draft.currentSeat = notification.getPlayCardRequest()?.getSeat();
                    }));
                } else if(notification.hasUpdateTimeout()) {
                    console.log('update timeout');
                } else if (notification.hasPlayedCards()) {
                    console.log('played cards');
                } else {
                        console.log('game data');
                        // const obj: object = notification.toObject();
                        // console.log(obj);
                }
            });
        
            registered = true;

            const takeSeat = (seat: number) => {
                if (!appState.joined) { return false; }
        
                console.log('take seat');
        
                const request: TakeSeatRequest = new TakeSeatRequest();
                request.setSeat(seat);
        
                appState.connection.takeSeat(request, appState.metadata).then((value: StatusResponse) => {
                    // Push Selected State Into The Seat
                    setState(produce(draft => { draft.mySeat = seat; }));
        
                    // Emit for 3D
                    eventEmitter.emit('takeSeatRequestResponse', seat, value.getSuccess());
                    return value.getSuccess();
                }).catch((reason: any) => {
                    eventEmitter.emit('takeSeatRequestResponse', seat, false);
                    return false;
                });
            };


            const setSeatReadyStatus = (ready: boolean) => {
                if (!appState.joined) { return false; }

                console.log('set ready status');

                const request: SetReadyStatusRequest = new SetReadyStatusRequest();
                request.setReady(ready);

                appState.connection.setReadyStatus(request, appState.metadata).then((value: StatusResponse) => {
                    eventEmitter.emit('setReadyStatusResponse', ready, value.getSuccess());
                    return value.getSuccess();
                }).catch((reason: any) => { 
                    eventEmitter.emit('setReadyStatusResponse', ready, false);
                    return false;
                });
            };

            const createBid = async (tricks: number, shootNum: number, trump: Bid.Trump, seat:number) => {
                if (!appState.joined) {
                    return false;
                }

                console.log('create bid');

                const request: BidDetails = new BidDetails();
                request.setTricks(tricks);
                request.setShootNum(shootNum);
                request.setTrump(Bid.toProtoTrump(trump));
                request.setSeat(seat);

                await appState.connection.createBid(request, appState.metadata).then((value: StatusResponse) => {
                    eventEmitter.emit('createBidResponse', tricks, shootNum, trump, seat, value.getSuccess());
                    console.log('bid response: ' + value.getSuccess());
                    setState(produce(draft => {
                        draft.currentBidder = false;
                    }));
                    return value.getSuccess();
                }).catch((reason: any) => { 
                    eventEmitter.emit('createBidResponse', tricks, shootNum, trump, seat, false);
                    console.log('bid failed: ' + (reason as grpcWeb.Error).message);
                    return false;
                });
            };

            const playCard = (card: Card) => {
                if (!appState.joined) {
                    return false;
                }

                console.log('play card');

                const request: ProtoCard = cardToProto(card);

                appState.connection.playCard(request, appState.metadata).then((value: StatusResponse) => {
                    eventEmitter.emit('playCardResponse', card, value.getSuccess());
                    console.log('play card result: ' + value.getSuccess());
                    return value.getSuccess();
                }).catch((reason: any) => { 
                    eventEmitter.emit('playCardResponse', card, false);
                    console.log('play card failed: ' + (reason as grpcWeb.Error).message);
                    return false;
                });
            };

        
            if (state.takeSeat === undefined) { 
                setState(produce(draft => {
                    draft.takeSeat = takeSeat; 
                    draft.setSeatReadyStatus = setSeatReadyStatus;
                    draft.createBid = createBid;
                    draft.playCard = playCard;
                })); 
            }

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

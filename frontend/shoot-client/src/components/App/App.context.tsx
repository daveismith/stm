import React, { createContext, useContext, useState } from "react";

import * as grpcWeb from 'grpc-web';
import { ShootServerClient } from '../../proto/ShootServiceClientPb';
import {
    Bid as BidDetails,
    Card,
    CreateGameRequest,
    CreateGameResponse, 
    JoinGameRequest,
    Notification,
    SetReadyStatusRequest,
    StatusResponse,
    TakeSeatRequest
} from '../../proto/shoot_pb';

import { EventEmitter3D } from "../Game/Interface3D/EventEmitter3D";
import { Bid } from "../Game/Models/Bid";

export interface IApp {
    connection?: ShootServerClient
    token?: string,
    gameId?: string,
    stream?: grpcWeb.ClientReadableStream<Notification>,
    createGame?(seats: number): void,
    joinGame?(gameId: string, name: string): boolean,
    takeSeat?(seat: number): void,
    setSeatReadyStatus?(ready: boolean): void,
    createBid?(tricks: number, shootNum: number, trump: Bid.Trump, seat: number): void,
    playCard?(card: Card): void,
    metadata: grpcWeb.Metadata,
    joined: boolean,
    registered: boolean,
    eventEmitter: EventEmitter3D
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  }

type AppContextType = (IApp | ((param: any) => void))[];

const clientId: string = uuidv4();
const connection: ShootServerClient = new ShootServerClient('http://localhost:8080', {'clientId': clientId}, null);

const initialState: IApp = {
    metadata: { }, 
    joined: false,
    registered: false,
    eventEmitter: new EventEmitter3D()
}

const AppContext: React.Context<AppContextType> = createContext<AppContextType>([{ ...initialState }]);

export const AppProvider: React.FC = ({ children }) => {
    const contextValue = useState(initialState);
    const [ appState, setState ] = contextValue;

    appState.createGame = (seats: number) => {
        const request: CreateGameRequest = new CreateGameRequest();
        request.setSeats(seats);

        connection.createGame(request, appState.metadata).then((response: CreateGameResponse) => {
            console.log('createGame returned ' + response.getUuid());
            let newState = {...appState};
            newState.gameId = response.getUuid();
            newState.metadata['x-game-id'] = response.getUuid();
            setState(newState);
        }).catch((reason) => {
            console.log('error' + reason);
        });        
    };

    appState.joinGame = (gameId: string, name: string) => {
        if (appState.joined) {
            return false;
        }

        console.log('join game ' + name);

        const request: JoinGameRequest = new JoinGameRequest();
        request.setName(name);
        request.setUuid(gameId);

        let newState = {...appState};
        newState.stream = connection.joinGame(request, appState.metadata);
        newState.joined = (newState.stream !== undefined);
        console.log('newState');
        console.log(newState);
        setState(newState);

        newState.stream.on('data', (response: Notification) => {

            if (response.hasJoinResponse()) {
                console.log('got join response');
                let updateState = {...newState};
                console.log(updateState);
                updateState.token = response.getJoinResponse()?.getToken() as string;
                updateState.metadata['x-game-token'] = updateState.token;
                updateState.gameId = gameId;
                updateState.metadata['x-game-id'] = gameId;
                setState(updateState);        
            }
        });

        console.log('joinGame ' + gameId);
        return newState.stream !== undefined;
    };

    appState.takeSeat = (seat: number) => {
        if (!appState.joined) {
            return false;
        }

        console.log('take seat');

        const request: TakeSeatRequest = new TakeSeatRequest();
        request.setSeat(seat);

        connection.takeSeat(request, appState.metadata).then((value: StatusResponse) => {
            appState.eventEmitter.emit('takeSeatRequestResponse', seat, value.getSuccess());
            return value.getSuccess();
        }).catch((reason: any) => {
            appState.eventEmitter.emit('takeSeatRequestResponse', seat, false);
            return false;
        });
    };

    appState.setSeatReadyStatus = (ready: boolean) => {
        if (!appState.joined) {
            return false;
        }

        console.log('set ready status');

        const request: SetReadyStatusRequest = new SetReadyStatusRequest();
        request.setReady(ready);

        connection.setReadyStatus(request, appState.metadata).then((value: StatusResponse) => {
            appState.eventEmitter.emit('setReadyStatusResponse', ready, value.getSuccess());
            return value.getSuccess();
        }).catch((reason: any) => { 
            appState.eventEmitter.emit('setReadyStatusResponse', ready, false);
            return false;
        });
    };

    appState.createBid = (tricks: number, shootNum: number, trump: Bid.Trump, seat:number) => {
        if (!appState.joined) {
            return false;
        }

        console.log('create bid');

        const request: BidDetails = new BidDetails();
        request.setTricks(tricks);
        request.setShootNum(shootNum);
        request.setTrump(trump);
        request.setSeat(seat);

        connection.createBid(request, appState.metadata).then((value: StatusResponse) => {
            appState.eventEmitter.emit('createBidResponse', tricks, shootNum, trump, seat, value.getSuccess());
            console.log('bid succeeded');
            return value.getSuccess();
        }).catch((reason: any) => { 
            appState.eventEmitter.emit('createBidResponse', tricks, shootNum, trump, seat, false);
            console.log('bid failed ' + reason);
            return false;
        });
    };

    appState.playCard = (card: Card) => {
        if (!appState.joined) {
            return false;
        }

        console.log('play card');

        const request: Card = card;

        connection.playCard(request, appState.metadata).then((value: StatusResponse) => {
            appState.eventEmitter.emit('playCardResponse', card, value.getSuccess());
            console.log('play card succeeded');
            return value.getSuccess();
        }).catch((reason: any) => { 
            appState.eventEmitter.emit('playCardResponse', card, false);
            console.log('play card failed ' + reason);
            return false;
        });
    };

    return (
        <AppContext.Provider value={ contextValue }>
            { children }
        </AppContext.Provider>
    );
};

export const useApp: any = () => {
    const contextValue: AppContextType = useContext(AppContext);
    return contextValue;
}

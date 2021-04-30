import React, { createContext, useContext, useState } from "react";

import * as grpcWeb from 'grpc-web';
import { ShootServerClient } from '../../proto/ShootServiceClientPb';
import { CreateGameRequest, CreateGameResponse, JoinGameRequest, Notification } from '../../proto/shoot_pb';
import { isNotEmittedStatement } from "typescript";

export interface IApp {
    connection?: ShootServerClient
    token?: string,
    gameId?: string,
    stream?: grpcWeb.ClientReadableStream<Notification>,
    createGame?(seats: number): void,
    joinGame?(gameId: string, name: string): boolean,
    metadata: grpcWeb.Metadata,
    joined: boolean
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

type AppContextType = (IApp | ((param: any) => void))[];

const clientId: string = uuidv4();
const connection: ShootServerClient = new ShootServerClient('http://localhost:8080', {'clientId': clientId}, null);

const initialState: IApp = {
    metadata: { }, 
    joined: false
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


        const request: JoinGameRequest = new JoinGameRequest();
        request.setName(name);
        request.setUuid(gameId);

        let newState = {... appState};
        newState.stream = connection.joinGame(request, appState.metadata);
        newState.joined = (newState.stream !== undefined);
        setState(newState);

        newState.stream.on('data', (response: Notification) => {
            if (response.hasJoinResponse()) {
                console.log('got join response');
                let newState = {...appState};
                newState.token = response.getJoinResponse()?.getToken() as string;
                newState.metadata['x-game-token'] = newState.token;
                setState(newState);        
            }
        });

        console.log('joinGame ' + gameId);
        return newState.stream !== undefined;
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

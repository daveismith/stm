import React, { createContext, useContext, useState } from "react";

import * as grpcWeb from 'grpc-web';
import { ShootServerClient } from '../../proto/ShootServiceClientPb';
import { CreateGameRequest, CreateGameResponse, Notification } from '../../proto/shoot_pb';

export interface IApp {
    //connection: ShootServerClient
    token?: string,
    gameId?: string,
    stream?: grpcWeb.ClientReadableStream<Notification>,
    createGame?(seats: number): void,
    joinGame?(gameId: string): boolean
}

type AppContextType = (IApp | ((param: any) => void))[];

const connection: ShootServerClient = new ShootServerClient('http://localhost:8080', {'clientId': 'my_client'}, null);

const initialState: IApp = {

}

const AppContext: React.Context<AppContextType> = createContext<AppContextType>([{ ...initialState }]);

export const AppProvider: React.FC = ({ children }) => {
    const contextValue = useState(initialState);
    const [ appState, setState ] = contextValue;

    appState.createGame = (seats: number) => {
        const request: CreateGameRequest = new CreateGameRequest();
        request.setSeats(seats);

        connection.createGame(request, {}).then((response: CreateGameResponse) => {
            console.log('createGame returned ' + response.getUuid());
            setState({gameId: response.getUuid()});
        }).catch((reason) => {
            console.log('error' + reason);
        });        
    };

    appState.joinGame = (gameId: string) => {
        console.log('joinGame ' + gameId);
        return true;
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

import React, { createContext, useContext, useState } from "react";

export interface IApp {

}

type AppContextType = (IApp | ((param: any) => void))[];

const initialState: IApp = {

}

const AppContext: React.Context<AppContextType> = createContext<AppContextType>([{ ...initialState }]);

export const AppProvider: React.FC = ({ children }) => {
    const contextValue = useState(initialState);
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

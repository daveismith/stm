import React from 'react';
import { Switch,  Route, Redirect } from "react-router";
import { HashRouter } from "react-router-dom";
import CreateGame from "../CreateGame/CreateGame";
import Game from "../Game/Game";
import './App.css';
import { GameProvider } from '../Game/Game.context';

const App: React.FC = () => {
  return (
    <div className="App">
      <HashRouter>
        <Switch>
          <Route exact path={"/create"} component= { CreateGame } />
          <Route exact path={"/game/:id"}>
            <GameProvider>
              <Game />
            </GameProvider>
          </Route>
          <Redirect to={{pathname: "/create"}} />
        </Switch>
      </HashRouter>
    </div>
  );
}

export default App;
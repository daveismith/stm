import React from 'react';
import { Route, Routes, Navigate } from "react-router";
import { HashRouter } from "react-router-dom";
import CreateGame from "../CreateGame/CreateGame";
import Game from "../Game/Game";
import './App.css';
import { GameProvider } from '../Game/Game.context';
import { ThemeProvider, createTheme, makeStyles } from '@material-ui/core/styles';

const theme = createTheme();

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <div className="App">
      <HashRouter>
        <Routes>
          <Route path="/">
            <Route path={"create"} element={<CreateGame /> } />
            <Route path={"/game/:id"} element={<GameProvider><Game /></GameProvider>} />
            <Route index path="*" element={<Navigate to="create" replace={true} /> } />
          </Route>
        </Routes>
      </HashRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
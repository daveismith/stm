import React from 'react';
import { Route, Routes, Navigate } from "react-router";
import { HashRouter } from "react-router-dom";
import CreateGame from "../CreateGame/CreateGame";
import Game from "../Game/Game";
import './App.css';
import { GameProvider } from '../Game/Game.context';
import { ThemeProvider, StyledEngineProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const App: React.FC = () => {
  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <div className="App">
        <HashRouter>
          <Routes>
              <Route path={"/create"} element={<CreateGame /> } />
              <Route path={"/game/:id"} element={<GameProvider><Game /></GameProvider>} />
              <Route path="*" element={<Navigate replace to="create" /> } />
          </Routes>
        </HashRouter>
        </div>
      </ThemeProvider>
    </StyledEngineProvider>
  );
}

export default App;
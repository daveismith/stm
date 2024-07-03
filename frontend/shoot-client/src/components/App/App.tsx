import React from 'react';
import { Route, Routes, Navigate } from "react-router";
import { HashRouter } from "react-router-dom";
import CreateGame from "../CreateGame/CreateGame";
import Game from "../Game/Game";
import './App.css';
import { GameProvider } from '../Game/Game.context';
import { ThemeProvider, Theme, StyledEngineProvider, createTheme, adaptV4Theme } from '@mui/material/styles';
import { grey } from '@mui/material/colors';


/*declare module '@mui/styles/defaultTheme' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface DefaultTheme extends Theme {}
}*/


const theme = createTheme({
 palette: {
    primary: {
      main: grey[300],
    }
  }
});

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
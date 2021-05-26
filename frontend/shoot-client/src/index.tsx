import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App/App';
import reportWebVitals from './reportWebVitals';
import { AppProvider } from "./components/App/App.context";
import { HashRouter } from "react-router-dom";
import { enableMapSet } from "immer";
import './index.css';

// Immer - enable support for Map and Set
enableMapSet();

ReactDOM.render(
    <AppProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </AppProvider>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

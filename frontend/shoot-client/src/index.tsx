import { createRoot } from 'react-dom/client';

import App from './components/App/App';
import reportWebVitals from './reportWebVitals';
import { AppProvider } from "./components/App/App.context";
import { enableMapSet } from "immer";
import './index.css';

// Immer - enable support for Map and Set
enableMapSet();

const container = document.getElementById('root');
const root = createRoot(container!); // createRoot(container!) if you use TypeScript
root.render(
    <AppProvider>
      <App />
    </AppProvider>);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

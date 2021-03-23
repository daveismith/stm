import React from 'react';
import * as grpcWeb from 'grpc-web';
import {ShootServerClient} from './ShootServiceClientPb';
import {JoinGameRequest, Notification} from './shoot_pb';
import logo from './logo.svg';
import './App.css';

const stmService = new ShootServerClient('http://localhost:8080', null, null);

function App() {

  const request = new JoinGameRequest();
  request.setId('1234');

  const stream = stmService.joinGame(request, {} ) as grpcWeb.ClientReadableStream<Notification>;

  stream.on('data', (response: Notification) => {
    if (response.hasStatus()) {
      console.log('status: ');
      console.log(response.getStatus()?.toObject());
    } else {
      console.log('data');
    }
  });

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;

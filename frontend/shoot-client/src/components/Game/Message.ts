import * as grpcWeb from 'grpc-web';
import { ShootServerClient } from '../../proto/ShootServiceClientPb';
import { JoinGameRequest, Notification, StatusResponse, TakeSeatRequest } from '../../proto/shoot_pb';

//const serviceUrl = location.protocol + '//' + location.host + ':8080';
//console.log('serviceUrl: ' + serviceUrl);
/*
const serviceUrl = 'https://39ac-66-207-211-10.ngrok.io';
const stmService = new ShootServerClient(serviceUrl, {"clientId": "my_client"}, null);

let token: string;
const request = new JoinGameRequest();
request.setUuid('1234');

const stream = stmService.joinGame(request, {'x-game-id': '1234'} ) as grpcWeb.ClientReadableStream<Notification>;

stream.on('data', (response: Notification) => {
if (response.hasJoinResponse()) {
    token = response.getJoinResponse()?.getToken() as string;
    console.log('got token: ' + token);
    const tsreq = new TakeSeatRequest();
    tsreq.setSeat(1);
    stmService.takeSeat(tsreq, {'x-game-id': '1234', 'x-game-token': token}, (err: grpcWeb.Error, resp: StatusResponse) => {
    console.log('take seat response: ');
    console.log(resp.toObject());
    });
} else if (response.hasStatus()) {
    console.log('status: ');
    console.log(response.getStatus()?.toObject());
} else {
    console.log('data');
}
}); 
*/
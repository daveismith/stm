/**
 * @fileoverview gRPC-Web generated client stub for 
 * @enhanceable
 * @public
 */

// GENERATED CODE -- DO NOT EDIT!


/* eslint-disable */
// @ts-nocheck


import * as grpcWeb from 'grpc-web';

import * as shoot_pb from './shoot_pb';


export class ShootServerClient {
  client_: grpcWeb.AbstractClientBase;
  hostname_: string;
  credentials_: null | { [index: string]: string; };
  options_: null | { [index: string]: any; };

  constructor (hostname: string,
               credentials?: null | { [index: string]: string; },
               options?: null | { [index: string]: any; }) {
    if (!options) options = {};
    if (!credentials) credentials = {};
    options['format'] = 'text';

    this.client_ = new grpcWeb.GrpcWebClientBase(options);
    this.hostname_ = hostname;
    this.credentials_ = credentials;
    this.options_ = options;
  }

  methodInfoJoinGame = new grpcWeb.AbstractClientBase.MethodInfo(
    shoot_pb.Notification,
    (request: shoot_pb.JoinGameRequest) => {
      return request.serializeBinary();
    },
    shoot_pb.Notification.deserializeBinary
  );

  joinGame(
    request: shoot_pb.JoinGameRequest,
    metadata?: grpcWeb.Metadata) {
    return this.client_.serverStreaming(
      this.hostname_ +
        '/ShootServer/JoinGame',
      request,
      metadata || {},
      this.methodInfoJoinGame);
  }

  methodInfoTakeSeat = new grpcWeb.AbstractClientBase.MethodInfo(
    shoot_pb.StatusResponse,
    (request: shoot_pb.TakeSeatRequest) => {
      return request.serializeBinary();
    },
    shoot_pb.StatusResponse.deserializeBinary
  );

  takeSeat(
    request: shoot_pb.TakeSeatRequest,
    metadata: grpcWeb.Metadata | null): Promise<shoot_pb.StatusResponse>;

  takeSeat(
    request: shoot_pb.TakeSeatRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: shoot_pb.StatusResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.StatusResponse>;

  takeSeat(
    request: shoot_pb.TakeSeatRequest,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: shoot_pb.StatusResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/TakeSeat',
        request,
        metadata || {},
        this.methodInfoTakeSeat,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/TakeSeat',
    request,
    metadata || {},
    this.methodInfoTakeSeat);
  }

  methodInfoAssignBot = new grpcWeb.AbstractClientBase.MethodInfo(
    shoot_pb.StatusResponse,
    (request: shoot_pb.AssignBotRequest) => {
      return request.serializeBinary();
    },
    shoot_pb.StatusResponse.deserializeBinary
  );

  assignBot(
    request: shoot_pb.AssignBotRequest,
    metadata: grpcWeb.Metadata | null): Promise<shoot_pb.StatusResponse>;

  assignBot(
    request: shoot_pb.AssignBotRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: shoot_pb.StatusResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.StatusResponse>;

  assignBot(
    request: shoot_pb.AssignBotRequest,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: shoot_pb.StatusResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/AssignBot',
        request,
        metadata || {},
        this.methodInfoAssignBot,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/AssignBot',
    request,
    metadata || {},
    this.methodInfoAssignBot);
  }

  methodInfoSetReadyStatus = new grpcWeb.AbstractClientBase.MethodInfo(
    shoot_pb.StatusResponse,
    (request: shoot_pb.SetReadyStatusRequest) => {
      return request.serializeBinary();
    },
    shoot_pb.StatusResponse.deserializeBinary
  );

  setReadyStatus(
    request: shoot_pb.SetReadyStatusRequest,
    metadata: grpcWeb.Metadata | null): Promise<shoot_pb.StatusResponse>;

  setReadyStatus(
    request: shoot_pb.SetReadyStatusRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: shoot_pb.StatusResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.StatusResponse>;

  setReadyStatus(
    request: shoot_pb.SetReadyStatusRequest,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: shoot_pb.StatusResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/SetReadyStatus',
        request,
        metadata || {},
        this.methodInfoSetReadyStatus,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/SetReadyStatus',
    request,
    metadata || {},
    this.methodInfoSetReadyStatus);
  }

  methodInfoCreateBid = new grpcWeb.AbstractClientBase.MethodInfo(
    shoot_pb.StatusResponse,
    (request: shoot_pb.Bid) => {
      return request.serializeBinary();
    },
    shoot_pb.StatusResponse.deserializeBinary
  );

  createBid(
    request: shoot_pb.Bid,
    metadata: grpcWeb.Metadata | null): Promise<shoot_pb.StatusResponse>;

  createBid(
    request: shoot_pb.Bid,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: shoot_pb.StatusResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.StatusResponse>;

  createBid(
    request: shoot_pb.Bid,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: shoot_pb.StatusResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/CreateBid',
        request,
        metadata || {},
        this.methodInfoCreateBid,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/CreateBid',
    request,
    metadata || {},
    this.methodInfoCreateBid);
  }

  methodInfoTransferCard = new grpcWeb.AbstractClientBase.MethodInfo(
    shoot_pb.StatusResponse,
    (request: shoot_pb.Transfer) => {
      return request.serializeBinary();
    },
    shoot_pb.StatusResponse.deserializeBinary
  );

  transferCard(
    request: shoot_pb.Transfer,
    metadata: grpcWeb.Metadata | null): Promise<shoot_pb.StatusResponse>;

  transferCard(
    request: shoot_pb.Transfer,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: shoot_pb.StatusResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.StatusResponse>;

  transferCard(
    request: shoot_pb.Transfer,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: shoot_pb.StatusResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/TransferCard',
        request,
        metadata || {},
        this.methodInfoTransferCard,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/TransferCard',
    request,
    metadata || {},
    this.methodInfoTransferCard);
  }

  methodInfoThrowawayCard = new grpcWeb.AbstractClientBase.MethodInfo(
    shoot_pb.ThrowawayResponse,
    (request: shoot_pb.Card) => {
      return request.serializeBinary();
    },
    shoot_pb.ThrowawayResponse.deserializeBinary
  );

  throwawayCard(
    request: shoot_pb.Card,
    metadata: grpcWeb.Metadata | null): Promise<shoot_pb.ThrowawayResponse>;

  throwawayCard(
    request: shoot_pb.Card,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: shoot_pb.ThrowawayResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.ThrowawayResponse>;

  throwawayCard(
    request: shoot_pb.Card,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: shoot_pb.ThrowawayResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/ThrowawayCard',
        request,
        metadata || {},
        this.methodInfoThrowawayCard,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/ThrowawayCard',
    request,
    metadata || {},
    this.methodInfoThrowawayCard);
  }

  methodInfoPlayCard = new grpcWeb.AbstractClientBase.MethodInfo(
    shoot_pb.StatusResponse,
    (request: shoot_pb.Card) => {
      return request.serializeBinary();
    },
    shoot_pb.StatusResponse.deserializeBinary
  );

  playCard(
    request: shoot_pb.Card,
    metadata: grpcWeb.Metadata | null): Promise<shoot_pb.StatusResponse>;

  playCard(
    request: shoot_pb.Card,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: shoot_pb.StatusResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.StatusResponse>;

  playCard(
    request: shoot_pb.Card,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: shoot_pb.StatusResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/PlayCard',
        request,
        metadata || {},
        this.methodInfoPlayCard,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/PlayCard',
    request,
    metadata || {},
    this.methodInfoPlayCard);
  }

  methodInfoLeaveGame = new grpcWeb.AbstractClientBase.MethodInfo(
    shoot_pb.StatusResponse,
    (request: shoot_pb.LeaveGameRequest) => {
      return request.serializeBinary();
    },
    shoot_pb.StatusResponse.deserializeBinary
  );

  leaveGame(
    request: shoot_pb.LeaveGameRequest,
    metadata: grpcWeb.Metadata | null): Promise<shoot_pb.StatusResponse>;

  leaveGame(
    request: shoot_pb.LeaveGameRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.Error,
               response: shoot_pb.StatusResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.StatusResponse>;

  leaveGame(
    request: shoot_pb.LeaveGameRequest,
    metadata: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.Error,
               response: shoot_pb.StatusResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/LeaveGame',
        request,
        metadata || {},
        this.methodInfoLeaveGame,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/LeaveGame',
    request,
    metadata || {},
    this.methodInfoLeaveGame);
  }

}


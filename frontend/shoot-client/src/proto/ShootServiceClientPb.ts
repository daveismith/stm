/**
 * @fileoverview gRPC-Web generated client stub for 
 * @enhanceable
 * @public
 */

// Code generated by protoc-gen-grpc-web. DO NOT EDIT.
// versions:
// 	protoc-gen-grpc-web v1.5.0
// 	protoc              v5.27.0
// source: shoot.proto


/* eslint-disable */
// @ts-nocheck


import * as grpcWeb from 'grpc-web';

import * as shoot_pb from './shoot_pb'; // proto import: "shoot.proto"


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
    this.hostname_ = hostname.replace(/\/+$/, '');
    this.credentials_ = credentials;
    this.options_ = options;
  }

  methodDescriptorCreateGame = new grpcWeb.MethodDescriptor(
    '/ShootServer/CreateGame',
    grpcWeb.MethodType.UNARY,
    shoot_pb.CreateGameRequest,
    shoot_pb.CreateGameResponse,
    (request: shoot_pb.CreateGameRequest) => {
      return request.serializeBinary();
    },
    shoot_pb.CreateGameResponse.deserializeBinary
  );

  createGame(
    request: shoot_pb.CreateGameRequest,
    metadata?: grpcWeb.Metadata | null): Promise<shoot_pb.CreateGameResponse>;

  createGame(
    request: shoot_pb.CreateGameRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: shoot_pb.CreateGameResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.CreateGameResponse>;

  createGame(
    request: shoot_pb.CreateGameRequest,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: shoot_pb.CreateGameResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/CreateGame',
        request,
        metadata || {},
        this.methodDescriptorCreateGame,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/CreateGame',
    request,
    metadata || {},
    this.methodDescriptorCreateGame);
  }

  methodDescriptorJoinGame = new grpcWeb.MethodDescriptor(
    '/ShootServer/JoinGame',
    grpcWeb.MethodType.SERVER_STREAMING,
    shoot_pb.JoinGameRequest,
    shoot_pb.Notification,
    (request: shoot_pb.JoinGameRequest) => {
      return request.serializeBinary();
    },
    shoot_pb.Notification.deserializeBinary
  );

  joinGame(
    request: shoot_pb.JoinGameRequest,
    metadata?: grpcWeb.Metadata): grpcWeb.ClientReadableStream<shoot_pb.Notification> {
    return this.client_.serverStreaming(
      this.hostname_ +
        '/ShootServer/JoinGame',
      request,
      metadata || {},
      this.methodDescriptorJoinGame);
  }

  methodDescriptorTakeSeat = new grpcWeb.MethodDescriptor(
    '/ShootServer/TakeSeat',
    grpcWeb.MethodType.UNARY,
    shoot_pb.TakeSeatRequest,
    shoot_pb.StatusResponse,
    (request: shoot_pb.TakeSeatRequest) => {
      return request.serializeBinary();
    },
    shoot_pb.StatusResponse.deserializeBinary
  );

  takeSeat(
    request: shoot_pb.TakeSeatRequest,
    metadata?: grpcWeb.Metadata | null): Promise<shoot_pb.StatusResponse>;

  takeSeat(
    request: shoot_pb.TakeSeatRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: shoot_pb.StatusResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.StatusResponse>;

  takeSeat(
    request: shoot_pb.TakeSeatRequest,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: shoot_pb.StatusResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/TakeSeat',
        request,
        metadata || {},
        this.methodDescriptorTakeSeat,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/TakeSeat',
    request,
    metadata || {},
    this.methodDescriptorTakeSeat);
  }

  methodDescriptorAssignBot = new grpcWeb.MethodDescriptor(
    '/ShootServer/AssignBot',
    grpcWeb.MethodType.UNARY,
    shoot_pb.AssignBotRequest,
    shoot_pb.StatusResponse,
    (request: shoot_pb.AssignBotRequest) => {
      return request.serializeBinary();
    },
    shoot_pb.StatusResponse.deserializeBinary
  );

  assignBot(
    request: shoot_pb.AssignBotRequest,
    metadata?: grpcWeb.Metadata | null): Promise<shoot_pb.StatusResponse>;

  assignBot(
    request: shoot_pb.AssignBotRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: shoot_pb.StatusResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.StatusResponse>;

  assignBot(
    request: shoot_pb.AssignBotRequest,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: shoot_pb.StatusResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/AssignBot',
        request,
        metadata || {},
        this.methodDescriptorAssignBot,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/AssignBot',
    request,
    metadata || {},
    this.methodDescriptorAssignBot);
  }

  methodDescriptorSetReadyStatus = new grpcWeb.MethodDescriptor(
    '/ShootServer/SetReadyStatus',
    grpcWeb.MethodType.UNARY,
    shoot_pb.SetReadyStatusRequest,
    shoot_pb.StatusResponse,
    (request: shoot_pb.SetReadyStatusRequest) => {
      return request.serializeBinary();
    },
    shoot_pb.StatusResponse.deserializeBinary
  );

  setReadyStatus(
    request: shoot_pb.SetReadyStatusRequest,
    metadata?: grpcWeb.Metadata | null): Promise<shoot_pb.StatusResponse>;

  setReadyStatus(
    request: shoot_pb.SetReadyStatusRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: shoot_pb.StatusResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.StatusResponse>;

  setReadyStatus(
    request: shoot_pb.SetReadyStatusRequest,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: shoot_pb.StatusResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/SetReadyStatus',
        request,
        metadata || {},
        this.methodDescriptorSetReadyStatus,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/SetReadyStatus',
    request,
    metadata || {},
    this.methodDescriptorSetReadyStatus);
  }

  methodDescriptorCreateBid = new grpcWeb.MethodDescriptor(
    '/ShootServer/CreateBid',
    grpcWeb.MethodType.UNARY,
    shoot_pb.Bid,
    shoot_pb.StatusResponse,
    (request: shoot_pb.Bid) => {
      return request.serializeBinary();
    },
    shoot_pb.StatusResponse.deserializeBinary
  );

  createBid(
    request: shoot_pb.Bid,
    metadata?: grpcWeb.Metadata | null): Promise<shoot_pb.StatusResponse>;

  createBid(
    request: shoot_pb.Bid,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: shoot_pb.StatusResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.StatusResponse>;

  createBid(
    request: shoot_pb.Bid,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: shoot_pb.StatusResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/CreateBid',
        request,
        metadata || {},
        this.methodDescriptorCreateBid,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/CreateBid',
    request,
    metadata || {},
    this.methodDescriptorCreateBid);
  }

  methodDescriptorTransferCard = new grpcWeb.MethodDescriptor(
    '/ShootServer/TransferCard',
    grpcWeb.MethodType.UNARY,
    shoot_pb.Transfer,
    shoot_pb.StatusResponse,
    (request: shoot_pb.Transfer) => {
      return request.serializeBinary();
    },
    shoot_pb.StatusResponse.deserializeBinary
  );

  transferCard(
    request: shoot_pb.Transfer,
    metadata?: grpcWeb.Metadata | null): Promise<shoot_pb.StatusResponse>;

  transferCard(
    request: shoot_pb.Transfer,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: shoot_pb.StatusResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.StatusResponse>;

  transferCard(
    request: shoot_pb.Transfer,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: shoot_pb.StatusResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/TransferCard',
        request,
        metadata || {},
        this.methodDescriptorTransferCard,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/TransferCard',
    request,
    metadata || {},
    this.methodDescriptorTransferCard);
  }

  methodDescriptorThrowawayCard = new grpcWeb.MethodDescriptor(
    '/ShootServer/ThrowawayCard',
    grpcWeb.MethodType.UNARY,
    shoot_pb.Card,
    shoot_pb.ThrowawayResponse,
    (request: shoot_pb.Card) => {
      return request.serializeBinary();
    },
    shoot_pb.ThrowawayResponse.deserializeBinary
  );

  throwawayCard(
    request: shoot_pb.Card,
    metadata?: grpcWeb.Metadata | null): Promise<shoot_pb.ThrowawayResponse>;

  throwawayCard(
    request: shoot_pb.Card,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: shoot_pb.ThrowawayResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.ThrowawayResponse>;

  throwawayCard(
    request: shoot_pb.Card,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: shoot_pb.ThrowawayResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/ThrowawayCard',
        request,
        metadata || {},
        this.methodDescriptorThrowawayCard,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/ThrowawayCard',
    request,
    metadata || {},
    this.methodDescriptorThrowawayCard);
  }

  methodDescriptorPlayCard = new grpcWeb.MethodDescriptor(
    '/ShootServer/PlayCard',
    grpcWeb.MethodType.UNARY,
    shoot_pb.Card,
    shoot_pb.StatusResponse,
    (request: shoot_pb.Card) => {
      return request.serializeBinary();
    },
    shoot_pb.StatusResponse.deserializeBinary
  );

  playCard(
    request: shoot_pb.Card,
    metadata?: grpcWeb.Metadata | null): Promise<shoot_pb.StatusResponse>;

  playCard(
    request: shoot_pb.Card,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: shoot_pb.StatusResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.StatusResponse>;

  playCard(
    request: shoot_pb.Card,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: shoot_pb.StatusResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/PlayCard',
        request,
        metadata || {},
        this.methodDescriptorPlayCard,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/PlayCard',
    request,
    metadata || {},
    this.methodDescriptorPlayCard);
  }

  methodDescriptorLeaveGame = new grpcWeb.MethodDescriptor(
    '/ShootServer/LeaveGame',
    grpcWeb.MethodType.UNARY,
    shoot_pb.LeaveGameRequest,
    shoot_pb.StatusResponse,
    (request: shoot_pb.LeaveGameRequest) => {
      return request.serializeBinary();
    },
    shoot_pb.StatusResponse.deserializeBinary
  );

  leaveGame(
    request: shoot_pb.LeaveGameRequest,
    metadata?: grpcWeb.Metadata | null): Promise<shoot_pb.StatusResponse>;

  leaveGame(
    request: shoot_pb.LeaveGameRequest,
    metadata: grpcWeb.Metadata | null,
    callback: (err: grpcWeb.RpcError,
               response: shoot_pb.StatusResponse) => void): grpcWeb.ClientReadableStream<shoot_pb.StatusResponse>;

  leaveGame(
    request: shoot_pb.LeaveGameRequest,
    metadata?: grpcWeb.Metadata | null,
    callback?: (err: grpcWeb.RpcError,
               response: shoot_pb.StatusResponse) => void) {
    if (callback !== undefined) {
      return this.client_.rpcCall(
        this.hostname_ +
          '/ShootServer/LeaveGame',
        request,
        metadata || {},
        this.methodDescriptorLeaveGame,
        callback);
    }
    return this.client_.unaryCall(
    this.hostname_ +
      '/ShootServer/LeaveGame',
    request,
    metadata || {},
    this.methodDescriptorLeaveGame);
  }

}


import * as jspb from 'google-protobuf'



export class Card extends jspb.Message {
  getSuit(): ard.Suit;
  setSuit(value: ard.Suit): Card;

  getRank(): ard.Rank;
  setRank(value: ard.Rank): Card;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Card.AsObject;
  static toObject(includeInstance: boolean, msg: Card): Card.AsObject;
  static serializeBinaryToWriter(message: Card, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Card;
  static deserializeBinaryFromReader(message: Card, reader: jspb.BinaryReader): Card;
}

export namespace Card {
  export type AsObject = {
    suit: ard.Suit,
    rank: ard.Rank,
  }

  export enum Suit { 
    SPADES = 0,
    HEARTS = 1,
    DIAMONDS = 2,
    CLUBS = 3,
  }

  export enum Rank { 
    SEVEN = 0,
    EIGHT = 1,
    NINE = 2,
    TEN = 3,
    JACK = 4,
    QUEEN = 5,
    KING = 6,
    ACE = 7,
  }
}

export class StatusResponse extends jspb.Message {
  getSuccess(): boolean;
  setSuccess(value: boolean): StatusResponse;

  getErrorNum(): number;
  setErrorNum(value: number): StatusResponse;

  getErrorText(): string;
  setErrorText(value: string): StatusResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StatusResponse.AsObject;
  static toObject(includeInstance: boolean, msg: StatusResponse): StatusResponse.AsObject;
  static serializeBinaryToWriter(message: StatusResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StatusResponse;
  static deserializeBinaryFromReader(message: StatusResponse, reader: jspb.BinaryReader): StatusResponse;
}

export namespace StatusResponse {
  export type AsObject = {
    success: boolean,
    errorNum: number,
    errorText: string,
  }
}

export class SeatDetails extends jspb.Message {
  getSeat(): number;
  setSeat(value: number): SeatDetails;

  getReady(): boolean;
  setReady(value: boolean): SeatDetails;

  getEmpty(): boolean;
  setEmpty(value: boolean): SeatDetails;

  getHuman(): boolean;
  setHuman(value: boolean): SeatDetails;

  getName(): string;
  setName(value: string): SeatDetails;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SeatDetails.AsObject;
  static toObject(includeInstance: boolean, msg: SeatDetails): SeatDetails.AsObject;
  static serializeBinaryToWriter(message: SeatDetails, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SeatDetails;
  static deserializeBinaryFromReader(message: SeatDetails, reader: jspb.BinaryReader): SeatDetails;
}

export namespace SeatDetails {
  export type AsObject = {
    seat: number,
    ready: boolean,
    empty: boolean,
    human: boolean,
    name: string,
  }
}

export class SeatsList extends jspb.Message {
  getSeatsList(): Array<SeatDetails>;
  setSeatsList(value: Array<SeatDetails>): SeatsList;
  clearSeatsList(): SeatsList;
  addSeats(value?: SeatDetails, index?: number): SeatDetails;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SeatsList.AsObject;
  static toObject(includeInstance: boolean, msg: SeatsList): SeatsList.AsObject;
  static serializeBinaryToWriter(message: SeatsList, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SeatsList;
  static deserializeBinaryFromReader(message: SeatsList, reader: jspb.BinaryReader): SeatsList;
}

export namespace SeatsList {
  export type AsObject = {
    seatsList: Array<SeatDetails.AsObject>,
  }
}

export class CreateGameRequest extends jspb.Message {
  getSeats(): number;
  setSeats(value: number): CreateGameRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateGameRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CreateGameRequest): CreateGameRequest.AsObject;
  static serializeBinaryToWriter(message: CreateGameRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateGameRequest;
  static deserializeBinaryFromReader(message: CreateGameRequest, reader: jspb.BinaryReader): CreateGameRequest;
}

export namespace CreateGameRequest {
  export type AsObject = {
    seats: number,
  }
}

export class CreateGameResponse extends jspb.Message {
  getUuid(): string;
  setUuid(value: string): CreateGameResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CreateGameResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CreateGameResponse): CreateGameResponse.AsObject;
  static serializeBinaryToWriter(message: CreateGameResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CreateGameResponse;
  static deserializeBinaryFromReader(message: CreateGameResponse, reader: jspb.BinaryReader): CreateGameResponse;
}

export namespace CreateGameResponse {
  export type AsObject = {
    uuid: string,
  }
}

export class JoinGameRequest extends jspb.Message {
  getUuid(): string;
  setUuid(value: string): JoinGameRequest;

  getName(): string;
  setName(value: string): JoinGameRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): JoinGameRequest.AsObject;
  static toObject(includeInstance: boolean, msg: JoinGameRequest): JoinGameRequest.AsObject;
  static serializeBinaryToWriter(message: JoinGameRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): JoinGameRequest;
  static deserializeBinaryFromReader(message: JoinGameRequest, reader: jspb.BinaryReader): JoinGameRequest;
}

export namespace JoinGameRequest {
  export type AsObject = {
    uuid: string,
    name: string,
  }
}

export class JoinGameResponse extends jspb.Message {
  getToken(): string;
  setToken(value: string): JoinGameResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): JoinGameResponse.AsObject;
  static toObject(includeInstance: boolean, msg: JoinGameResponse): JoinGameResponse.AsObject;
  static serializeBinaryToWriter(message: JoinGameResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): JoinGameResponse;
  static deserializeBinaryFromReader(message: JoinGameResponse, reader: jspb.BinaryReader): JoinGameResponse;
}

export namespace JoinGameResponse {
  export type AsObject = {
    token: string,
  }
}

export class SetReadyStatusRequest extends jspb.Message {
  getReady(): boolean;
  setReady(value: boolean): SetReadyStatusRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): SetReadyStatusRequest.AsObject;
  static toObject(includeInstance: boolean, msg: SetReadyStatusRequest): SetReadyStatusRequest.AsObject;
  static serializeBinaryToWriter(message: SetReadyStatusRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): SetReadyStatusRequest;
  static deserializeBinaryFromReader(message: SetReadyStatusRequest, reader: jspb.BinaryReader): SetReadyStatusRequest;
}

export namespace SetReadyStatusRequest {
  export type AsObject = {
    ready: boolean,
  }
}

export class StartGame extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): StartGame.AsObject;
  static toObject(includeInstance: boolean, msg: StartGame): StartGame.AsObject;
  static serializeBinaryToWriter(message: StartGame, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): StartGame;
  static deserializeBinaryFromReader(message: StartGame, reader: jspb.BinaryReader): StartGame;
}

export namespace StartGame {
  export type AsObject = {
  }
}

export class Hand extends jspb.Message {
  getHandList(): Array<Card>;
  setHandList(value: Array<Card>): Hand;
  clearHandList(): Hand;
  addHand(value?: Card, index?: number): Card;

  getDealer(): number;
  setDealer(value: number): Hand;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Hand.AsObject;
  static toObject(includeInstance: boolean, msg: Hand): Hand.AsObject;
  static serializeBinaryToWriter(message: Hand, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Hand;
  static deserializeBinaryFromReader(message: Hand, reader: jspb.BinaryReader): Hand;
}

export namespace Hand {
  export type AsObject = {
    handList: Array<Card.AsObject>,
    dealer: number,
  }
}

export class BidRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BidRequest.AsObject;
  static toObject(includeInstance: boolean, msg: BidRequest): BidRequest.AsObject;
  static serializeBinaryToWriter(message: BidRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BidRequest;
  static deserializeBinaryFromReader(message: BidRequest, reader: jspb.BinaryReader): BidRequest;
}

export namespace BidRequest {
  export type AsObject = {
  }
}

export class Bid extends jspb.Message {
  getTricks(): number;
  setTricks(value: number): Bid;

  getShootNum(): number;
  setShootNum(value: number): Bid;

  getTrump(): rump;
  setTrump(value: rump): Bid;

  getSeat(): number;
  setSeat(value: number): Bid;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Bid.AsObject;
  static toObject(includeInstance: boolean, msg: Bid): Bid.AsObject;
  static serializeBinaryToWriter(message: Bid, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Bid;
  static deserializeBinaryFromReader(message: Bid, reader: jspb.BinaryReader): Bid;
}

export namespace Bid {
  export type AsObject = {
    tricks: number,
    shootNum: number,
    trump: rump,
    seat: number,
  }
}

export class BidList extends jspb.Message {
  getBidsList(): Array<Bid>;
  setBidsList(value: Array<Bid>): BidList;
  clearBidsList(): BidList;
  addBids(value?: Bid, index?: number): Bid;

  getCurrentBidder(): number;
  setCurrentBidder(value: number): BidList;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BidList.AsObject;
  static toObject(includeInstance: boolean, msg: BidList): BidList.AsObject;
  static serializeBinaryToWriter(message: BidList, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BidList;
  static deserializeBinaryFromReader(message: BidList, reader: jspb.BinaryReader): BidList;
}

export namespace BidList {
  export type AsObject = {
    bidsList: Array<Bid.AsObject>,
    currentBidder: number,
  }
}

export class TakeSeatRequest extends jspb.Message {
  getSeat(): number;
  setSeat(value: number): TakeSeatRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TakeSeatRequest.AsObject;
  static toObject(includeInstance: boolean, msg: TakeSeatRequest): TakeSeatRequest.AsObject;
  static serializeBinaryToWriter(message: TakeSeatRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TakeSeatRequest;
  static deserializeBinaryFromReader(message: TakeSeatRequest, reader: jspb.BinaryReader): TakeSeatRequest;
}

export namespace TakeSeatRequest {
  export type AsObject = {
    seat: number,
  }
}

export class AssignBotRequest extends jspb.Message {
  getSeat(): number;
  setSeat(value: number): AssignBotRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AssignBotRequest.AsObject;
  static toObject(includeInstance: boolean, msg: AssignBotRequest): AssignBotRequest.AsObject;
  static serializeBinaryToWriter(message: AssignBotRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AssignBotRequest;
  static deserializeBinaryFromReader(message: AssignBotRequest, reader: jspb.BinaryReader): AssignBotRequest;
}

export namespace AssignBotRequest {
  export type AsObject = {
    seat: number,
  }
}

export class TransferRequest extends jspb.Message {
  getFromSeat(): number;
  setFromSeat(value: number): TransferRequest;

  getToSeat(): number;
  setToSeat(value: number): TransferRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TransferRequest.AsObject;
  static toObject(includeInstance: boolean, msg: TransferRequest): TransferRequest.AsObject;
  static serializeBinaryToWriter(message: TransferRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TransferRequest;
  static deserializeBinaryFromReader(message: TransferRequest, reader: jspb.BinaryReader): TransferRequest;
}

export namespace TransferRequest {
  export type AsObject = {
    fromSeat: number,
    toSeat: number,
  }
}

export class Transfer extends jspb.Message {
  getFromSeat(): number;
  setFromSeat(value: number): Transfer;

  getToSeat(): number;
  setToSeat(value: number): Transfer;

  getCard(): Card | undefined;
  setCard(value?: Card): Transfer;
  hasCard(): boolean;
  clearCard(): Transfer;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Transfer.AsObject;
  static toObject(includeInstance: boolean, msg: Transfer): Transfer.AsObject;
  static serializeBinaryToWriter(message: Transfer, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Transfer;
  static deserializeBinaryFromReader(message: Transfer, reader: jspb.BinaryReader): Transfer;
}

export namespace Transfer {
  export type AsObject = {
    fromSeat: number,
    toSeat: number,
    card?: Card.AsObject,
  }
}

export class ThrowawayRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ThrowawayRequest.AsObject;
  static toObject(includeInstance: boolean, msg: ThrowawayRequest): ThrowawayRequest.AsObject;
  static serializeBinaryToWriter(message: ThrowawayRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ThrowawayRequest;
  static deserializeBinaryFromReader(message: ThrowawayRequest, reader: jspb.BinaryReader): ThrowawayRequest;
}

export namespace ThrowawayRequest {
  export type AsObject = {
  }
}

export class ThrowawayResponse extends jspb.Message {
  getFinished(): boolean;
  setFinished(value: boolean): ThrowawayResponse;

  getCardRemoved(): Card | undefined;
  setCardRemoved(value?: Card): ThrowawayResponse;
  hasCardRemoved(): boolean;
  clearCardRemoved(): ThrowawayResponse;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): ThrowawayResponse.AsObject;
  static toObject(includeInstance: boolean, msg: ThrowawayResponse): ThrowawayResponse.AsObject;
  static serializeBinaryToWriter(message: ThrowawayResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): ThrowawayResponse;
  static deserializeBinaryFromReader(message: ThrowawayResponse, reader: jspb.BinaryReader): ThrowawayResponse;
}

export namespace ThrowawayResponse {
  export type AsObject = {
    finished: boolean,
    cardRemoved?: Card.AsObject,
  }
}

export class TrumpUpdate extends jspb.Message {
  getTricks(): number;
  setTricks(value: number): TrumpUpdate;

  getShootNum(): number;
  setShootNum(value: number): TrumpUpdate;

  getTrump(): rump;
  setTrump(value: rump): TrumpUpdate;

  getSeat(): number;
  setSeat(value: number): TrumpUpdate;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): TrumpUpdate.AsObject;
  static toObject(includeInstance: boolean, msg: TrumpUpdate): TrumpUpdate.AsObject;
  static serializeBinaryToWriter(message: TrumpUpdate, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): TrumpUpdate;
  static deserializeBinaryFromReader(message: TrumpUpdate, reader: jspb.BinaryReader): TrumpUpdate;
}

export namespace TrumpUpdate {
  export type AsObject = {
    tricks: number,
    shootNum: number,
    trump: rump,
    seat: number,
  }
}

export class PlayCardRequest extends jspb.Message {
  getSeat(): number;
  setSeat(value: number): PlayCardRequest;

  getTimeout(): number;
  setTimeout(value: number): PlayCardRequest;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PlayCardRequest.AsObject;
  static toObject(includeInstance: boolean, msg: PlayCardRequest): PlayCardRequest.AsObject;
  static serializeBinaryToWriter(message: PlayCardRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PlayCardRequest;
  static deserializeBinaryFromReader(message: PlayCardRequest, reader: jspb.BinaryReader): PlayCardRequest;
}

export namespace PlayCardRequest {
  export type AsObject = {
    seat: number,
    timeout: number,
  }
}

export class UpdateTimeout extends jspb.Message {
  getSeat(): number;
  setSeat(value: number): UpdateTimeout;

  getTimeout(): number;
  setTimeout(value: number): UpdateTimeout;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): UpdateTimeout.AsObject;
  static toObject(includeInstance: boolean, msg: UpdateTimeout): UpdateTimeout.AsObject;
  static serializeBinaryToWriter(message: UpdateTimeout, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): UpdateTimeout;
  static deserializeBinaryFromReader(message: UpdateTimeout, reader: jspb.BinaryReader): UpdateTimeout;
}

export namespace UpdateTimeout {
  export type AsObject = {
    seat: number,
    timeout: number,
  }
}

export class PlayedCard extends jspb.Message {
  getOrder(): number;
  setOrder(value: number): PlayedCard;

  getSeat(): number;
  setSeat(value: number): PlayedCard;

  getCard(): Card | undefined;
  setCard(value?: Card): PlayedCard;
  hasCard(): boolean;
  clearCard(): PlayedCard;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PlayedCard.AsObject;
  static toObject(includeInstance: boolean, msg: PlayedCard): PlayedCard.AsObject;
  static serializeBinaryToWriter(message: PlayedCard, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PlayedCard;
  static deserializeBinaryFromReader(message: PlayedCard, reader: jspb.BinaryReader): PlayedCard;
}

export namespace PlayedCard {
  export type AsObject = {
    order: number,
    seat: number,
    card?: Card.AsObject,
  }
}

export class PlayedCards extends jspb.Message {
  getCardsList(): Array<PlayedCard>;
  setCardsList(value: Array<PlayedCard>): PlayedCards;
  clearCardsList(): PlayedCards;
  addCards(value?: PlayedCard, index?: number): PlayedCard;

  getWinningSeat(): number;
  setWinningSeat(value: number): PlayedCards;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PlayedCards.AsObject;
  static toObject(includeInstance: boolean, msg: PlayedCards): PlayedCards.AsObject;
  static serializeBinaryToWriter(message: PlayedCards, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PlayedCards;
  static deserializeBinaryFromReader(message: PlayedCards, reader: jspb.BinaryReader): PlayedCards;
}

export namespace PlayedCards {
  export type AsObject = {
    cardsList: Array<PlayedCard.AsObject>,
    winningSeat: number,
  }
}

export class Tricks extends jspb.Message {
  getTeam1(): number;
  setTeam1(value: number): Tricks;

  getTeam2(): number;
  setTeam2(value: number): Tricks;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Tricks.AsObject;
  static toObject(includeInstance: boolean, msg: Tricks): Tricks.AsObject;
  static serializeBinaryToWriter(message: Tricks, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Tricks;
  static deserializeBinaryFromReader(message: Tricks, reader: jspb.BinaryReader): Tricks;
}

export namespace Tricks {
  export type AsObject = {
    team1: number,
    team2: number,
  }
}

export class Scores extends jspb.Message {
  getTeam1(): number;
  setTeam1(value: number): Scores;

  getTeam2(): number;
  setTeam2(value: number): Scores;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Scores.AsObject;
  static toObject(includeInstance: boolean, msg: Scores): Scores.AsObject;
  static serializeBinaryToWriter(message: Scores, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Scores;
  static deserializeBinaryFromReader(message: Scores, reader: jspb.BinaryReader): Scores;
}

export namespace Scores {
  export type AsObject = {
    team1: number,
    team2: number,
  }
}

export class EndGame extends jspb.Message {
  getWinningTeam(): number;
  setWinningTeam(value: number): EndGame;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): EndGame.AsObject;
  static toObject(includeInstance: boolean, msg: EndGame): EndGame.AsObject;
  static serializeBinaryToWriter(message: EndGame, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): EndGame;
  static deserializeBinaryFromReader(message: EndGame, reader: jspb.BinaryReader): EndGame;
}

export namespace EndGame {
  export type AsObject = {
    winningTeam: number,
  }
}

export class LeaveGameRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LeaveGameRequest.AsObject;
  static toObject(includeInstance: boolean, msg: LeaveGameRequest): LeaveGameRequest.AsObject;
  static serializeBinaryToWriter(message: LeaveGameRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LeaveGameRequest;
  static deserializeBinaryFromReader(message: LeaveGameRequest, reader: jspb.BinaryReader): LeaveGameRequest;
}

export namespace LeaveGameRequest {
  export type AsObject = {
  }
}

export class Notification extends jspb.Message {
  getSequence(): number;
  setSequence(value: number): Notification;

  getStatus(): StatusResponse | undefined;
  setStatus(value?: StatusResponse): Notification;
  hasStatus(): boolean;
  clearStatus(): Notification;

  getJoinResponse(): JoinGameResponse | undefined;
  setJoinResponse(value?: JoinGameResponse): Notification;
  hasJoinResponse(): boolean;
  clearJoinResponse(): Notification;

  getSeatList(): SeatsList | undefined;
  setSeatList(value?: SeatsList): Notification;
  hasSeatList(): boolean;
  clearSeatList(): Notification;

  getSeatUpdate(): SeatDetails | undefined;
  setSeatUpdate(value?: SeatDetails): Notification;
  hasSeatUpdate(): boolean;
  clearSeatUpdate(): Notification;

  getStartGame(): StartGame | undefined;
  setStartGame(value?: StartGame): Notification;
  hasStartGame(): boolean;
  clearStartGame(): Notification;

  getHand(): Hand | undefined;
  setHand(value?: Hand): Notification;
  hasHand(): boolean;
  clearHand(): Notification;

  getBidRequest(): BidRequest | undefined;
  setBidRequest(value?: BidRequest): Notification;
  hasBidRequest(): boolean;
  clearBidRequest(): Notification;

  getBid(): Bid | undefined;
  setBid(value?: Bid): Notification;
  hasBid(): boolean;
  clearBid(): Notification;

  getBidList(): BidList | undefined;
  setBidList(value?: BidList): Notification;
  hasBidList(): boolean;
  clearBidList(): Notification;

  getTransferRequest(): TransferRequest | undefined;
  setTransferRequest(value?: TransferRequest): Notification;
  hasTransferRequest(): boolean;
  clearTransferRequest(): Notification;

  getTransfer(): Transfer | undefined;
  setTransfer(value?: Transfer): Notification;
  hasTransfer(): boolean;
  clearTransfer(): Notification;

  getThrowawayRequest(): ThrowawayRequest | undefined;
  setThrowawayRequest(value?: ThrowawayRequest): Notification;
  hasThrowawayRequest(): boolean;
  clearThrowawayRequest(): Notification;

  getTrumpUpdate(): TrumpUpdate | undefined;
  setTrumpUpdate(value?: TrumpUpdate): Notification;
  hasTrumpUpdate(): boolean;
  clearTrumpUpdate(): Notification;

  getPlayCardRequest(): PlayCardRequest | undefined;
  setPlayCardRequest(value?: PlayCardRequest): Notification;
  hasPlayCardRequest(): boolean;
  clearPlayCardRequest(): Notification;

  getUpdateTimeout(): UpdateTimeout | undefined;
  setUpdateTimeout(value?: UpdateTimeout): Notification;
  hasUpdateTimeout(): boolean;
  clearUpdateTimeout(): Notification;

  getPlayedCards(): PlayedCards | undefined;
  setPlayedCards(value?: PlayedCards): Notification;
  hasPlayedCards(): boolean;
  clearPlayedCards(): Notification;

  getTricks(): Tricks | undefined;
  setTricks(value?: Tricks): Notification;
  hasTricks(): boolean;
  clearTricks(): Notification;

  getScores(): Scores | undefined;
  setScores(value?: Scores): Notification;
  hasScores(): boolean;
  clearScores(): Notification;

  getEndGame(): EndGame | undefined;
  setEndGame(value?: EndGame): Notification;
  hasEndGame(): boolean;
  clearEndGame(): Notification;

  getNotificationCase(): Notification.NotificationCase;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Notification.AsObject;
  static toObject(includeInstance: boolean, msg: Notification): Notification.AsObject;
  static serializeBinaryToWriter(message: Notification, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Notification;
  static deserializeBinaryFromReader(message: Notification, reader: jspb.BinaryReader): Notification;
}

export namespace Notification {
  export type AsObject = {
    sequence: number,
    status?: StatusResponse.AsObject,
    joinResponse?: JoinGameResponse.AsObject,
    seatList?: SeatsList.AsObject,
    seatUpdate?: SeatDetails.AsObject,
    startGame?: StartGame.AsObject,
    hand?: Hand.AsObject,
    bidRequest?: BidRequest.AsObject,
    bid?: Bid.AsObject,
    bidList?: BidList.AsObject,
    transferRequest?: TransferRequest.AsObject,
    transfer?: Transfer.AsObject,
    throwawayRequest?: ThrowawayRequest.AsObject,
    trumpUpdate?: TrumpUpdate.AsObject,
    playCardRequest?: PlayCardRequest.AsObject,
    updateTimeout?: UpdateTimeout.AsObject,
    playedCards?: PlayedCards.AsObject,
    tricks?: Tricks.AsObject,
    scores?: Scores.AsObject,
    endGame?: EndGame.AsObject,
  }

  export enum NotificationCase { 
    NOTIFICATION_NOT_SET = 0,
    STATUS = 2,
    JOIN_RESPONSE = 3,
    SEAT_LIST = 4,
    SEAT_UPDATE = 5,
    START_GAME = 6,
    HAND = 7,
    BID_REQUEST = 8,
    BID = 9,
    BID_LIST = 10,
    TRANSFER_REQUEST = 11,
    TRANSFER = 12,
    THROWAWAY_REQUEST = 13,
    TRUMP_UPDATE = 14,
    PLAY_CARD_REQUEST = 15,
    UPDATE_TIMEOUT = 16,
    PLAYED_CARDS = 17,
    TRICKS = 18,
    SCORES = 19,
    END_GAME = 20,
  }
}

export enum Trump { 
  SPADES = 0,
  HEARTS = 1,
  DIAMONDS = 2,
  CLUBS = 3,
  LOW = 4,
  HIGH = 5,
}

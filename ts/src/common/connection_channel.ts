import {Completer, Stream} from "../utils/async";
import {Connection, ConnectionChannel, ProcessorResult} from "./interfaces";
import {ConnectionHandler} from "./connection_handler";


export class PassiveChannel implements ConnectionChannel {
  onReceive: Stream<any[]> = new Stream<any[]>();

  _processors: Function[] = [];

  readonly conn: Connection;

  constructor(conn: Connection, connected = false) {
    this.conn = conn;
    this.connected = connected;
  }

  handler: ConnectionHandler;

  sendWhenReady(handler: ConnectionHandler) {
    this.handler = handler;
    this.conn.requireSend();
  }

  getSendingData(currentTime: number, waitingAckId: number): ProcessorResult {
    if (this.handler != null) {
      let rslt: ProcessorResult = this.handler.getSendingData(currentTime, waitingAckId);
      // handler = null;
      return rslt;
    }
    return null;
  }

  _isReady: boolean = false;
  get isReady(): boolean {
    return this._isReady;
  }

  set isReady(val: boolean) {
    this._isReady = val;
  }

  connected: boolean = true;

  readonly onDisconnectController: Completer<ConnectionChannel> =
    new Completer<ConnectionChannel>();

  get onDisconnected() {
    return this.onDisconnectController.future;
  }

  readonly onConnectController: Completer<ConnectionChannel> =
    new Completer<ConnectionChannel>();

  get onConnected() {
    return this.onConnectController.future;
  }

  updateConnect() {
    if (this.connected) return;
    this.connected = true;
    this.onConnectController.complete(this);
  }
}

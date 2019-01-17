import {ConnectionChannel, ConnectionProcessor, ProcessorResult} from "./interfaces";
import {StreamSubscription} from "../utils/async";

export const ACK_WAIT_COUNT = 16;
export const defaultCacheSize = 256;

export abstract class ConnectionHandler {
  _conn: ConnectionChannel;
  _connListener: StreamSubscription<any[]>;

  get connection(): ConnectionChannel {
    return this._conn;
  }

  set connection(conn: ConnectionChannel) {
    if (this._connListener != null) {
      this._connListener.cancel();
      this._connListener = null;
      this._onDisconnected(this._conn);
    }
    this._conn = conn;
    this._connListener = this._conn.onReceive.listen(this.onData);
    this._conn.onDisconnected.then((conn) => this._onDisconnected(conn));
    // resend all requests after a connection
    if (this._conn.connected) {
      this.onReconnected();
    } else {
      this._conn.onConnected.then((conn) => this.onReconnected());
    }
  }

  _onDisconnected(conn: ConnectionChannel) {
    if (this._conn === conn) {
      if (this._connListener != null) {
        this._connListener.cancel();
        this._connListener = null;
      }
      this.onDisconnected();
      this._conn = null;
    }
  }

  abstract onDisconnected(): void;

  onReconnected() {
    if (this._pendingSend) {
      this._conn.sendWhenReady(this);
    }
  }

  abstract onData(m: any[]): void;

  _toSendList: any[] = [];

  addToSendList(m: any) {
    this._toSendList.push(m);
    if (!this._pendingSend) {
      if (this._conn != null) {
        this._conn.sendWhenReady(this);
      }
      this._pendingSend = true;
    }
  }

  _processors: ConnectionProcessor[] = [];

  /// a processor function that's called just before the data is sent
  /// same processor won't be added to the list twice
  /// inside processor, send() data that only need to appear once per data frame
  addProcessor(processor: ConnectionProcessor) {
    this._processors.push(processor);
    if (!this._pendingSend) {
      if (this._conn != null) {
        this._conn.sendWhenReady(this);
      }
      this._pendingSend = true;
    }
  }

  _pendingSend: boolean = false;

  /// gather all the changes from
  getSendingData(currentTime: number, waitingAckId: number): ProcessorResult {
    this._pendingSend = false;
    let processors: ConnectionProcessor[] = this._processors;
    this._processors = [];
    for (let proc of processors) {
      proc.startSendingData(currentTime, waitingAckId);
    }
    let rslt: any[] = this._toSendList;
    this._toSendList = [];
    return new ProcessorResult(rslt, processors);
  }

  clearProcessors() {
    this._processors.length = 0;
    this._pendingSend = false;
  }
}

import {ConnectionChannel, ConnectionProcessor, ProcessorResult} from './interfaces';
import {StreamSubscription} from '../utils/async';

export const DSA_CONFIG = {
  ackWaitCount: 16,
  defaultCacheSize: 256
};

export abstract class ConnectionHandler {
  /** @ignore */
  _conn: ConnectionChannel;
  /** @ignore */
  _connListener: StreamSubscription<any[]>;

  /** @ignore */
  get connection(): ConnectionChannel {
    return this._conn;
  }

  /** @ignore */
  set connection(conn: ConnectionChannel) {
    if (this._connListener != null) {
      this._connListener.close();
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

  /** @ignore */
  _onDisconnected(conn: ConnectionChannel) {
    if (this._conn === conn) {
      if (this._connListener != null) {
        this._connListener.close();
        this._connListener = null;
      }
      this.onDisconnected();
      this._conn = null;
    }
  }

  abstract onDisconnected(): void;

  /** @ignore */
  onReconnected() {
    if (this._pendingSend) {
      this._conn.sendWhenReady(this);
    }
  }

  abstract onData(m: any[]): void;

  /** @ignore */
  _toSendList: any[] = [];

  /** @ignore */
  addToSendList(m: any) {
    this._toSendList.push(m);
    if (!this._pendingSend) {
      if (this._conn != null) {
        this._conn.sendWhenReady(this);
      }
      this._pendingSend = true;
    }
  }

  /** @ignore */
  _processors: ConnectionProcessor[] = [];

  /// a processor function that's called just before the data is sent
  /// same processor won't be added to the list twice
  /// inside processor, send() data that only need to appear once per data frame
  /** @ignore */
  addProcessor(processor: ConnectionProcessor) {
    this._processors.push(processor);
    if (!this._pendingSend) {
      if (this._conn != null) {
        this._conn.sendWhenReady(this);
      }
      this._pendingSend = true;
    }
  }

  /** @ignore */
  _pendingSend: boolean = false;

  /// gather all the changes from
  /** @ignore */
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

  /** @ignore */
  clearProcessors() {
    this._processors.length = 0;
    this._pendingSend = false;
  }
}

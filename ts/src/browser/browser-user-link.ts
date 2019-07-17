/// a client link for both http and ws
import {ClientLink, DummyECDH, ECDH, NodeProvider} from "../common/interfaces";
import {Completer} from "../utils/async";
import {Requester} from "../requester/requester";

import {Responder} from "../responder/responder";
import {PrivateKey} from "../crypto/pk";
import {WebSocketConnection} from "./browser-ws-conn";
import {DsCodec} from "../utils/codec";

export class BrowserUserLink extends ClientLink {
  /** @ignore */
  _onRequesterReadyCompleter: Completer<Requester> = new Completer<Requester>();

  get onRequesterReady(): Promise<Requester> {
    return this._onRequesterReadyCompleter.future;
  }

  /** @ignore */
  static session: string = Math.random().toString(16).substr(2, 8);
  readonly requester: Requester = new Requester();
//  readonly responder: Responder;

  /** @ignore */
  readonly nonce: ECDH = new DummyECDH();
  /** @ignore */
  privateKey: PrivateKey;
  /** @ignore */
  _wsConnection: WebSocketConnection;

  /** @ignore */
  updateSalt(salt: string) {
    // do nothing
  }

  /** @ignore */
  wsUpdateUri: string;
  /** @ignore */
  format: string;


  constructor(wsUpdateUri: string,
              format = 'msgpack') {
    super();
    if (wsUpdateUri.startsWith("http")) {
      wsUpdateUri = `ws${wsUpdateUri.substring(4)}`;
    }

    this.wsUpdateUri = wsUpdateUri;
    this.format = format;

    if (window.location.hash.includes("dsa_json")) {
      this.format = "json";
    }
  }


  _connect() {
    this.initWebsocket(false);
    return this.onRequesterReady;
  }

  /** @ignore */
  _wsDelay: number = 1;
  /** @ignore */
  _initSocketTimer: any;

  /** @ignore */
  initWebsocketLater(ms: number) {
    if (this._initSocketTimer) return;
    this._initSocketTimer = setTimeout(this.initWebsocket, ms);
  }

  /** @ignore */
  initWebsocket = (reconnect = true) => {
    this._initSocketTimer = null;

    try {
      let socket = new WebSocket(`${this.wsUpdateUri}?session=${BrowserUserLink.session}&format=${this.format}`);
      this._wsConnection = new WebSocketConnection(
        socket, this, this._onConnect, DsCodec.getCodec(this.format));
    } catch (err) {
      this.onDisConnect(reconnect);
      return;
    }

    // if (this.responder != null) {
    //   this.responder.connection = this._wsConnection.responderChannel;
    // }

    if (this.requester != null) {
      this._wsConnection.onRequesterReady.then((channel) => {
        this.requester.connection = channel;
        if (!this._onRequesterReadyCompleter.isCompleted) {
          this._onRequesterReadyCompleter.complete(this.requester);
        }
      });
    }
    this._wsConnection.onDisconnected.then((connection) => {
      this.onDisConnect(reconnect);
    });
  }

  onDisConnect(reconnect: boolean) {
    this._onDisconnect();

    if (this._wsConnection == null) {
      // connection is closed
      return;
    }
    if (this._wsConnection._opened) {
      this._wsDelay = 1;
      this.initWebsocket(false);
    } else if (reconnect) {
      this.initWebsocketLater(this._wsDelay * 1000);
      if (this._wsDelay < 60) this._wsDelay++;
    } else {
      this._wsDelay = 5;
      this.initWebsocketLater(5000);
    }
  }

  reconnect() {

    if (this._wsConnection != null) {
      this._wsConnection.socket.close();
    }
  }

  close() {
    if (this._initSocketTimer) {
      clearTimeout(this._initSocketTimer);
      this._initSocketTimer = null;
    }
    if (this._wsConnection != null) {
      this._wsConnection.close();
      this._wsConnection = null;
    }
  }
}

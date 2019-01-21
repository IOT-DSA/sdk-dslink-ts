/// a client link for both http and ws
import {ClientLink, ECDH, NodeProvider} from "../common/interfaces";
import {Completer} from "../utils/async";
import {Requester} from "../requester/requester";

import {Responder} from "../responder/responder";
import {PrivateKey} from "../crypto/pk";
import {WebSocketConnection} from "./browser_ws_conn";
import {DsCodec} from "../utils/codec";


export class DummyECDH implements ECDH {
  readonly encodedPublicKey: string = "";

  hashSalt(salt: string): string {
    return '';
  }

  verifySalt(salt: string, hash: string): boolean {
    return true;
  }
}

export class BrowserUserLink extends ClientLink {
  _onRequesterReadyCompleter: Completer<Requester> = new Completer<Requester>();

  get onRequesterReady(): Promise<Requester> {
    return this._onRequesterReadyCompleter.future;
  }

  static session: string = Math.random().toString(16).substr(2, 8);
  readonly requester: Requester = new Requester();
//  readonly responder: Responder;

  readonly nonce: ECDH = new DummyECDH();
  privateKey: PrivateKey;

  _wsConnection: WebSocketConnection;

  enableAck: boolean;


  updateSalt(salt: string) {
    // do nothing
  }

  wsUpdateUri: string;
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


  connect() {
    this.initWebsocket(false);
  }

  _wsDelay: number = 1;

  _initSocketTimer: any;

  initWebsocketLater(ms: number) {
    if (this._initSocketTimer) return;
    this._initSocketTimer = setTimeout(() => this.initWebsocket, ms);
  }

  initWebsocket(reconnect = true) {
    this._initSocketTimer = null;
    let socket = new WebSocket(`${this.wsUpdateUri}?session=${BrowserUserLink.session}&format=${this.format}`);
    this._wsConnection = new WebSocketConnection(
      socket, this, null, DsCodec.getCodec(this.format));

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
//      logger.info("Disconnected");
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
    });
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

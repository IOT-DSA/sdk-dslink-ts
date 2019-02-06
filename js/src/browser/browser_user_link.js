/// a client link for both http and ws
import { ClientLink } from "../common/interfaces";
import { Completer } from "../utils/async";
import { Requester } from "../requester/requester";
import { WebSocketConnection } from "./browser_ws_conn";
import { DsCodec } from "../utils/codec";
/** @ignore */
class DummyECDH {
    constructor() {
        this.encodedPublicKey = "";
    }
    hashSalt(salt) {
        return '';
    }
    verifySalt(salt, hash) {
        return true;
    }
}
export class BrowserUserLink extends ClientLink {
    constructor(wsUpdateUri, format = 'msgpack') {
        super();
        /** @ignore */
        this._onRequesterReadyCompleter = new Completer();
        this.requester = new Requester();
        //  readonly responder: Responder;
        /** @ignore */
        this.nonce = new DummyECDH();
        /** @ignore */
        this._wsDelay = 1;
        if (wsUpdateUri.startsWith("http")) {
            wsUpdateUri = `ws${wsUpdateUri.substring(4)}`;
        }
        this.wsUpdateUri = wsUpdateUri;
        this.format = format;
        if (window.location.hash.includes("dsa_json")) {
            this.format = "json";
        }
    }
    get onRequesterReady() {
        return this._onRequesterReadyCompleter.future;
    }
    /** @ignore */
    updateSalt(salt) {
        // do nothing
    }
    connect() {
        this.initWebsocket(false);
    }
    /** @ignore */
    initWebsocketLater(ms) {
        if (this._initSocketTimer)
            return;
        this._initSocketTimer = setTimeout(() => this.initWebsocket, ms);
    }
    /** @ignore */
    initWebsocket(reconnect = true) {
        this._initSocketTimer = null;
        let socket = new WebSocket(`${this.wsUpdateUri}?session=${BrowserUserLink.session}&format=${this.format}`);
        this._wsConnection = new WebSocketConnection(socket, this, null, DsCodec.getCodec(this.format));
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
            }
            else if (reconnect) {
                this.initWebsocketLater(this._wsDelay * 1000);
                if (this._wsDelay < 60)
                    this._wsDelay++;
            }
            else {
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
/** @ignore */
BrowserUserLink.session = Math.random().toString(16).substr(2, 8);
//# sourceMappingURL=browser_user_link.js.map
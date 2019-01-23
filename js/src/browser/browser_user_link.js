"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// a client link for both http and ws
const interfaces_1 = require("../common/interfaces");
const async_1 = require("../utils/async");
const requester_1 = require("../requester/requester");
const browser_ws_conn_1 = require("./browser_ws_conn");
const codec_1 = require("../utils/codec");
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
exports.DummyECDH = DummyECDH;
class BrowserUserLink extends interfaces_1.ClientLink {
    constructor(wsUpdateUri, format = 'msgpack') {
        super();
        this._onRequesterReadyCompleter = new async_1.Completer();
        this.requester = new requester_1.Requester();
        //  readonly responder: Responder;
        this.nonce = new DummyECDH();
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
    updateSalt(salt) {
        // do nothing
    }
    connect() {
        this.initWebsocket(false);
    }
    initWebsocketLater(ms) {
        if (this._initSocketTimer)
            return;
        this._initSocketTimer = setTimeout(() => this.initWebsocket, ms);
    }
    initWebsocket(reconnect = true) {
        this._initSocketTimer = null;
        let socket = new WebSocket(`${this.wsUpdateUri}?session=${BrowserUserLink.session}&format=${this.format}`);
        this._wsConnection = new browser_ws_conn_1.WebSocketConnection(socket, this, null, codec_1.DsCodec.getCodec(this.format));
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
BrowserUserLink.session = Math.random().toString(16).substr(2, 8);
exports.BrowserUserLink = BrowserUserLink;
//# sourceMappingURL=browser_user_link.js.map
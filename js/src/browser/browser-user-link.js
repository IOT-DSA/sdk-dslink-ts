"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// a client link for both http and ws
const interfaces_1 = require("../common/interfaces");
const async_1 = require("../utils/async");
const requester_1 = require("../requester/requester");
const browser_ws_conn_1 = require("./browser-ws-conn");
const codec_1 = require("../utils/codec");
class BrowserUserLink extends interfaces_1.ClientLink {
    constructor(wsUpdateUri, format = 'msgpack') {
        super();
        /** @ignore */
        this._onRequesterReadyCompleter = new async_1.Completer();
        this.requester = new requester_1.Requester();
        //  readonly responder: Responder;
        /** @ignore */
        this.nonce = new interfaces_1.DummyECDH();
        /** @ignore */
        this._wsDelay = 1;
        /** @ignore */
        this.initWebsocket = (reconnect = true) => {
            this._initSocketTimer = null;
            try {
                let socket = new WebSocket(`${this.wsUpdateUri}?session=${BrowserUserLink.session}&format=${this.format}`);
                this._wsConnection = new browser_ws_conn_1.WebSocketConnection(socket, this, this._onConnect, codec_1.DsCodec.getCodec(this.format));
            }
            catch (err) {
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
        };
        if (wsUpdateUri.startsWith('http')) {
            wsUpdateUri = `ws${wsUpdateUri.substring(4)}`;
        }
        this.wsUpdateUri = wsUpdateUri;
        this.format = format;
        if (window.location.hash.includes('dsa_json')) {
            this.format = 'json';
        }
    }
    get onRequesterReady() {
        return this._onRequesterReadyCompleter.future;
    }
    /** @ignore */
    updateSalt(salt) {
        // do nothing
    }
    _connect() {
        this.initWebsocket(false);
        return this.onRequesterReady;
    }
    /** @ignore */
    initWebsocketLater(ms) {
        if (this._initSocketTimer)
            return;
        this._initSocketTimer = setTimeout(this.initWebsocket, ms);
    }
    onDisConnect(reconnect) {
        this._onDisconnect();
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
BrowserUserLink.session = Math.random()
    .toString(16)
    .substr(2, 8);
exports.BrowserUserLink = BrowserUserLink;
//# sourceMappingURL=browser-user-link.js.map
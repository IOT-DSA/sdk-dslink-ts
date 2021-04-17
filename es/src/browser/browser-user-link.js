/// a client link for both http and ws
import { ClientLink, DummyECDH } from '../common/interfaces';
import { Completer } from '../utils/async';
import { Requester } from '../requester/requester';
import { WebSocketConnection } from './browser-ws-conn';
import { DsCodec } from '../utils/codec';
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
        /** @ignore */
        this.initWebsocket = (reconnect = true) => {
            this._initSocketTimer = null;
            try {
                let socket = new WebSocket(`${this.wsUpdateUri}?session=${BrowserUserLink.session}&format=${this.format}`);
                this._wsConnection = new WebSocketConnection(socket, this, this._onConnect, DsCodec.getCodec(this.format));
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
        this.onReconnect.add(new Date().getTime() + ms);
        this._initSocketTimer = setTimeout(this.initWebsocket, ms);
    }
    onDisConnect(reconnect) {
        this._onDisconnect();
        if (this._wsConnection == null) {
            // connection is closed
            return;
        }
        if (new Date().getTime() - this._wsConnection._openTs > 1000) {
            // has been connected for more than 1 second
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
BrowserUserLink.session = Math.random().toString(16).substr(2, 8);
//# sourceMappingURL=browser-user-link.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const interfaces_1 = require("../common/interfaces");
const async_1 = require("../utils/async");
const requester_1 = require("../requester/requester");
const ws_1 = __importDefault(require("ws"));
const websocket_conn_1 = require("./websocket-conn");
const node_1 = require("../common/node");
const axios_1 = __importDefault(require("axios"));
const codec_1 = require("../utils/codec");
const url_1 = __importDefault(require("url"));
const responder_1 = require("../responder/responder");
const pk_1 = require("../crypto/pk");
const utils_1 = require("../utils");
const logger_1 = require("../utils/logger");
const serialize_1 = require("./serialize");
const encrypt_1 = require("../utils/encrypt");
/** @ignore */
let logger = logger_1.logger.tag('link');
class HttpClientLink extends interfaces_1.ClientLink {
    constructor(conn, dsIdPrefix, options = {}) {
        super();
        /** @ignore */
        this._onReadyCompleter = new async_1.Completer();
        /** @ignore
         * formats sent to broker
         */
        this.formats = ['msgpack', 'json'];
        /** @ignore
         * format received from broker
         */
        this.format = 'json';
        /** @ignore */
        this._connDelay = 0;
        /** @ignore */
        this._wsDelay = 0;
        /** @ignore */
        this._reconnectWSCount = 0;
        /** @ignore */
        this._closed = false;
        this._conn = conn;
        if (options.privateKey) {
            this.privateKey = options.privateKey;
        }
        else {
            this.privateKey = serialize_1.getKeyFromFile('.dslink.key');
        }
        encrypt_1.initEncryptionSecret(this.privateKey.ecPrivateKey);
        this.linkData = options.linkData;
        if (options.format) {
            if (Array.isArray(options.format)) {
                this.formats = options.format;
            }
            else {
                this.formats = [options.format];
            }
        }
        this.dsId = `${node_1.Path.escapeName(dsIdPrefix)}${this.privateKey.publicKey.qHash64}`;
        if (options.isRequester) {
            this.requester = new requester_1.Requester();
        }
        if (options.rootNode) {
            this.nodeProvider = options.rootNode.provider;
            this.responder = new responder_1.Responder(this.nodeProvider);
            let { saveNodes } = options;
            if (typeof saveNodes === 'function') {
                this.nodeProvider._saveFunction = saveNodes;
            }
            else if (saveNodes) {
                if (saveNodes === true) {
                    saveNodes = 'nodes.json';
                }
                let serializer = new serialize_1.NodeSerializer(saveNodes);
                let data = serializer.loadNodesFromFile();
                if (data) {
                    options.rootNode.load(data);
                }
                this.nodeProvider._saveFunction = serializer.saveNodesToFile;
            }
        }
        if (options.token != null && options.token.length > 16) {
            // pre-generate tokenHash
            let tokenId = options.token.substring(0, 16);
            let hashStr = pk_1.sha256(`${this.dsId}${options.token}`);
            this.tokenHash = `&token=${tokenId}${hashStr}`;
        }
    }
    get onReady() {
        return this._onReadyCompleter.future;
    }
    /** @ignore */
    get nonce() {
        return this._nonce;
    }
    /** @ignore */
    updateSalt(salt) {
        this.salt = salt;
    }
    /** @ignore */
    connDelay() {
        this._reconnectWSCount = 0;
        let delay = this._connDelay * 500;
        if (!delay)
            delay = 20;
        if (!this._connDelayTimer) {
            this._connDelayTimer = setTimeout(() => {
                this._connDelayTimer = null;
                this._connect();
            }, delay);
        }
        if (this._connDelay < 30)
            this._connDelay++;
    }
    /** @ignore */
    async _connect() {
        if (this._connDelayTimer) {
            clearTimeout(this._connDelayTimer);
            this._connDelayTimer = null;
        }
        if (this._closed) {
            return;
        }
        if (this._wsDelayTimer) {
            clearTimeout(this._wsDelayTimer);
        }
        let connUrl = `${this._conn}?dsId=${encodeURIComponent(this.dsId)}`;
        if (this.tokenHash != null) {
            connUrl = `${connUrl}${this.tokenHash}`;
        }
        //    logger.info(formatLogMessage("Connecting to ${_conn}"));
        // TODO: This runZoned is due to a bug in the DartVM
        // https://github.com/dart-lang/sdk/issues/31275
        // When it is fixed, we should go back to a regular try-catch
        try {
            let requestJson = {
                publicKey: this.privateKey.publicKey.qBase64,
                isRequester: this.requester != null,
                isResponder: this.responder != null,
                formats: this.formats,
                version: utils_1.DSA_VERSION,
                enableWebSocketCompression: true
            };
            if (this.linkData != null) {
                requestJson['linkData'] = this.linkData;
            }
            let connResponse = await axios_1.default.post(connUrl, requestJson, { timeout: 60000 });
            let serverConfig = connResponse.data;
            //      logger.finest(formatLogMessage("Handshake Response: ${serverConfig}"));
            // read salt
            this.salt = serverConfig['salt'];
            let tempKey = serverConfig['tempKey'];
            if (tempKey == null) {
                // trusted client, don't do ECDH handshake
                this._nonce = new interfaces_1.DummyECDH();
            }
            else {
                this._nonce = await this.privateKey.getSecret(tempKey);
            }
            this.remotePath = serverConfig['path'];
            if (typeof serverConfig['wsUri'] === 'string') {
                this._wsUpdateUri = `${url_1.default.resolve(connUrl, serverConfig['wsUri'])}?dsId=${encodeURIComponent(this.dsId)}`.replace('http', 'ws');
            }
            if (typeof serverConfig['format'] === 'string') {
                this.format = serverConfig['format'];
            }
            await this.initWebsocket(false);
        }
        catch (e) {
            //      if (logger.level <= Level.FINER ) {
            //        logger.warning("Client socket crashed: $e $s");
            //      } else {
            //        logger.warning("Client socket crashed: $e");
            //      }
            this.connDelay();
        }
    }
    /** @ignore */
    async initWebsocket(reconnect = true) {
        if (this._wsDelayTimer) {
            clearTimeout(this._wsDelayTimer);
            this._wsDelayTimer = null;
        }
        if (this._closed)
            return;
        this._reconnectWSCount++;
        if (this._reconnectWSCount > 10) {
            // if reconnected ws for more than 10 times, do a clean reconnct
            this.connDelay();
            return;
        }
        try {
            let wsUrl = `${this._wsUpdateUri}&auth=${this._nonce.hashSalt(this.salt)}&format=${this.format}`;
            if (this.tokenHash != null) {
                wsUrl = `${wsUrl}${this.tokenHash}`;
            }
            let socket = new ws_1.default(wsUrl);
            this._wsConnection = new websocket_conn_1.WebSocketConnection(socket, this, this._onConnect, codec_1.DsCodec.getCodec(this.format));
            //      logger.info(formatLogMessage("Connected"));
            // delays: Reset, we've successfully connected.
            this._connDelay = 0;
            this._wsDelay = 0;
            if (this.responder != null) {
                this.responder.connection = this._wsConnection.responderChannel;
                if (!this.requester) {
                    this._onReadyCompleter.complete([null, this.responder]);
                }
            }
            if (this.requester) {
                this._wsConnection.onRequesterReady.then((channel) => {
                    this.requester.connection = channel;
                    this._onReadyCompleter.complete([this.requester, this.responder]);
                });
            }
            this._wsConnection.onDisconnected.then((connection) => {
                this._onDisconnect();
                this.initWebsocket();
            });
        }
        catch (error) {
            if (error.message.contains('not upgraded to websocket') || error.message.contains('(401)')) {
                logger.warn(error.message);
                this.connDelay();
            }
            else if (reconnect) {
                let delay = this._wsDelay * 500;
                if (!delay)
                    delay = 20;
                if (!this._wsDelayTimer) {
                    this._wsDelayTimer = setTimeout(() => {
                        this._wsDelayTimer = null;
                        this._connect();
                    }, delay);
                }
                if (this._wsDelay < 30)
                    this._wsDelay++;
            }
        }
    }
    close() {
        if (this._closed)
            return;
        // finish all pending timer, other wise the process might fail to save before killed by OS
        if (this.nodeProvider) {
            this.nodeProvider.finishSaveTimer();
        }
        this._onReadyCompleter = new async_1.Completer();
        this._closed = true;
        if (this._wsConnection != null) {
            this._wsConnection.close();
            this._wsConnection = null;
        }
    }
}
exports.HttpClientLink = HttpClientLink;
//# sourceMappingURL=client-link.js.map
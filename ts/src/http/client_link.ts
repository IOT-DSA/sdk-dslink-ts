import {ClientLink, DummyECDH} from "../common/interfaces";
import {Completer} from "../utils/async";
import {Requester} from "../requester/requester";
import WebSocket from "ws";
import {WebSocketConnection} from "./websocket_conn";
import {Path} from "../common/node";
import axios from "axios";
import {DsCodec, DsJson} from "../utils/codec";
import url from "url";
import {Responder} from "../responder/responder";
import {sha256} from "../crypto/pk";
import {DSA_VERSION} from "../../utils";


export class HttpClientLink extends ClientLink {
  _onReadyCompleter: Completer<[Requester, Responder]> = new Completer<[Requester, Responder]>();

  get onReady(): Promise<[Requester, Responder]> {
    return this._onReadyCompleter.future;
  }


  remotePath: string;

  readonly dsId: string;
  readonly privateKey: PrivateKey;

  tokenHash: string;

  requester: Requester;
  responder: Responder;

  useStandardWebSocket: boolean = true;
  readonly strictTls: boolean;


  _nonce: ECDH;

  get nonce(): ECDH {
    return this._nonce;
  }

  _wsConnection: WebSocketConnection;


  salt: string;

  updateSalt(salt: string) {
    this.salt = salt;
  }

  _wsUpdateUri: string;

  _conn: string;

  linkData: {[key: string]: any};

  /// formats sent to broker
  formats = ['msgpack', 'json'];

  /// format received from broker
  format: string = 'json';

  constructor(conn: string, dsIdPrefix: string, privateKey: PrivateKey, options: {
    nodeProvider?: NodeProvider,
    isRequester: boolean,
    isResponder: boolean,
    token?: string,
    linkData?: {[key: string]: any},
    formats?: string[]
  } = {isRequester: false, isResponder: true}) {
    super();
    this._conn = conn;
    this.privateKey = privateKey;

    this.linkData = options.linkData;
    if (options.formats) {
      this.formats = options.formats;
    }

    this.dsId = `${Path.escapeName(dsIdPrefix)}${privateKey.publicKey.qHash64}`;

    if (options.isRequester) {
      this.requester = new Requester();
    }


    if (options.isResponder) {
      this.responder = new Responder(this.nodeProvider);
    }

    if (options.token != null && options.token.length > 16) {
      // pre-generate tokenHash
      let tokenId: string = options.token.substring(0, 16);
      let hashStr: string = sha256(`${this.dsId}${options.token}`);
      this.tokenHash = `&token=${tokenId}${hashStr}`;
    }
  }

  _connDelay: number = 0;

  _connDelayTimer: any;

  connDelay() {
    this.reconnectWSCount = 0;
    let delay = this._connDelay * 500;
    if (!delay) delay = 20;
    if (!this._connDelayTimer) {
      this._connDelayTimer = setTimeout(() => {
        this._connDelayTimer = null;
        this.connect();
      }, delay);
    }

    if (this._connDelay < 30) this._connDelay++;
  }


  async connect() {
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
      connUrl = '$connUrl$tokenHash';
    }
//    logger.info(formatLogMessage("Connecting to ${_conn}"));

    // TODO: This runZoned is due to a bug in the DartVM
    // https://github.com/dart-lang/sdk/issues/31275
    // When it is fixed, we should go back to a regular try-catch

    try {
      let requestJson: any = {
        'publicKey': this.privateKey.publicKey.qBase64,
        'isRequester': this.requester != null,
        'isResponder': this.responder != null,
        'formats': this.formats,
        'version': DSA_VERSION,
        'enableWebSocketCompression': true
      };
      if (this.linkData != null) {
        requestJson['linkData'] = this.linkData;
      }

      let connResponse = await axios.post(connUrl, requestJson, {timeout: 60000});


      let serverConfig: {[key: string]: any} = DsJson.decode(connResponse.data);

//      logger.finest(formatLogMessage("Handshake Response: ${serverConfig}"));

      // read salt
      let salt = serverConfig['salt'];

      let tempKey: string = serverConfig['tempKey'];
      if (tempKey == null) {
        // trusted client, don't do ECDH handshake
        this._nonce = new DummyECDH();
      } else {
        this._nonce = await this.privateKey.getSecret(tempKey);
      }
      this.remotePath = serverConfig['path'];

      if (typeof serverConfig['wsUri'] === 'string') {
        this._wsUpdateUri = `${url.resolve(connUrl, serverConfig['wsUri'])}?dsId=${encodeURIComponent(this.dsId)}`
          .replace('http', 'ws');
      }

      if (typeof serverConfig['format'] === 'string') {
        this.format = serverConfig['format'];
      }

      await this.initWebsocket(false);
    } catch (e) {
//      if (logger.level <= Level.FINER ) {
//        logger.warning("Client socket crashed: $e $s");
//      } else {
//        logger.warning("Client socket crashed: $e");
//      }
      this.connDelay();
    }
  }

  _wsDelay: number = 0;
  _wsDelayTimer: any;

  reconnectWSCount: number = 0;

  async initWebsocket(reconnect: boolean = true) {
    if (this._wsDelayTimer) {
      clearTimeout(this._wsDelayTimer);
      this._wsDelayTimer = null;
    }
    if (this._closed) return;

    this.reconnectWSCount++;
    if (this.reconnectWSCount > 10) {
      // if reconnected ws for more than 10 times, do a clean reconnct
      this.connDelay();
      return;
    }

    try {
      let wsUrl = `${this._wsUpdateUri}&auth=${this._nonce.hashSalt(this.salt)}&format=$format`;
      if (this.tokenHash != null) {
        wsUrl = `${wsUrl}${this.tokenHash}`;
      }

      let socket = new WebSocket(wsUrl);

      this._wsConnection = new WebSocketConnection(
        socket,
        this, null,
        DsCodec.getCodec(this.format)
      );

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
          this._onReadyCompleter.complete([null, this.responder]);

        });
      }

      this._wsConnection.onDisconnected.then((connection) => {
        this.initWebsocket();
      });
    } catch (error) {
//      logger.fine(
//         formatLogMessage("Error while initializing WebSocket"),
//         error,
//         stack
//       );
      if (error.message.contains('not upgraded to websocket')
        || error.message.contains('(401)')
      ) {
        console.log(error.message);
        this.connDelay();
      } else if (reconnect) {
        let delay = this._wsDelay * 500;
        if (!delay) delay = 20;
        if (!this._wsDelayTimer) {
          this._wsDelayTimer = setTimeout(() => {
            this._wsDelayTimer = null;
            this.connect();
          }, delay);
        }

        if (this._wsDelay < 30) this._wsDelay++;
      }
    }
  }

  _closed: boolean = false;

  close() {
    if (this._closed) return;
    this._onReadyCompleter = new Completer();
    this._closed = true;
    if (this._wsConnection != null) {
      this._wsConnection.close();
      this._wsConnection = null;
    }
  }
}

// Promise<PrivateKey> getKeyFromFile(path: string) async {
//   var file = new File(path);
//
//   key: PrivateKey;
//   if (!file.existsSync()) {
//     key = await PrivateKey.generate();
//     file.createSync(recursive: true);
//     file.writeAsStringSync(key.saveToString());
//   } else {
//     key = new PrivateKey.loadFromString(file.readAsStringSync());
//   }
//
//   return key;
// }

// part of dslink.browser_client;

/// a client link for both http and ws
export class BrowserUserLink  extends ClientLink {
  _onRequesterReadyCompleter: Completer<Requester> = new Completer<Requester>();

  Promise<Requester> get onRequesterReady => this._onRequesterReadyCompleter.future;

  static session: string = DSRandom.instance.nextUint16().toRadixString(16) +
      DSRandom.instance.nextUint16().toRadixString(16) +
      DSRandom.instance.nextUint16().toRadixString(16) +
      DSRandom.instance.nextUint16().toRadixString(16);
  readonly requester: Requester;
  readonly responder: Responder;

  readonly nonce: ECDH = const DummyECDH();
  privateKey: PrivateKey;

  _wsConnection: WebSocketConnection;

  enableAck: boolean;

  static readonly saltNameMap: {[key: string]:number} = const {"salt": 0, "saltS": 1,};

  updateSalt(salt: string, [saltId:number = 0]) {
    // TODO: implement updateSalt
  }

  wsUpdateUri: string;
  format: string = "json";

  BrowserUserLink({nodeProvider: NodeProvider,
  boolean isRequester: true,
  boolean isResponder: true,
  this.wsUpdateUri,
  this.enableAck: false,
  string format})
      : requester = isRequester ? new Requester() : null,
        responder = (isResponder && nodeProvider != null)
            ? new Responder(nodeProvider)
            : null {
    if (wsUpdateUri.startsWith("http")) {
      wsUpdateUri = "ws${wsUpdateUri.substring(4)}";
    }

    if (format != null) {
      this.format = format;
    }

    if (window.location.hash.contains("dsa_json")) {
      this.format = "json";
    }
  }

  connect() {
    lockCryptoProvider();
    initWebsocket(false);
  }

  _wsDelay:number = 1;

  initWebsocket([reconnect: boolean = true]) {
    var socket = new WebSocket("$wsUpdateUri?session=$session&format=$format");
    _wsConnection = new WebSocketConnection(
        socket, this, enableAck: enableAck, useCodec: DsCodec.getCodec(format));

    if (responder != null) {
      responder.connection = this._wsConnection.responderChannel;
    }

    if (requester != null) {
      _wsConnection.onRequesterReady.then((channel) {
        requester.connection = channel;
        if (!_onRequesterReadyCompleter.isCompleted) {
          _onRequesterReadyCompleter.complete(requester);
        }
      });
    }
    _wsConnection.onDisconnected.then((connection) {
      logger.info("Disconnected");
      if ( this._wsConnection == null) {
        // connection is closed
        return;
      }
      if ( this._wsConnection._opened) {
        _wsDelay = 1;
        initWebsocket(false);
      } else if (reconnect) {
        DsTimer.timerOnceAfter(initWebsocket, this._wsDelay * 1000);
        if ( this._wsDelay < 60) _wsDelay++;
      } else {
        _wsDelay = 5;
        DsTimer.timerOnceAfter(initWebsocket, 5000);
      }
    });
  }
  reconnect() {
    if ( this._wsConnection != null) {
      _wsConnection.socket.close();
    }
  }
  close() {
    if ( this._wsConnection != null) {
      _wsConnection.close();
      _wsConnection = null;
    }
  }
}

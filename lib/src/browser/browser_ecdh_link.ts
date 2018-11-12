// part of dslink.browser_client;

/// a client link for websocket
export class BrowserECDHLink  extends ClientLink {
  _onRequesterReadyCompleter: Completer<Requester> = new Completer<Requester>();
  _onConnectedCompleter: Completer = new Completer();

  Future get onConnected => this._onConnectedCompleter.future;

  Future<Requester> get onRequesterReady => this._onRequesterReadyCompleter.future;

  final dsId: string;
  final token: string;

  final requester: Requester;
  final responder: Responder;
  final privateKey: PrivateKey;

  _nonce: ECDH;

  get nonce(): ECDH { return this._nonce;}

  _wsConnection: WebSocketConnection;

  enableAck: boolean = false;

  static const saltNameMap: {[key: string]: int} = const {
    'salt': 0,
    'saltS': 1,
    'saltL': 2,
  };

  /// 2 salts, salt and saltS
  final salts: string[] = new string[](3);

  updateSalt(salt: string, [saltId: int = 0]) {
    salts[saltId] = salt;
  }

  _wsUpdateUri: string;
  _conn: string;
  tokenHash: string;

  /// formats sent to broker
  formats: List = ['msgpack', 'json'];

  /// format received from broker
  format: string = 'json';

  BrowserECDHLink(this._conn, dsIdPrefix: string, privateKey: PrivateKey,
      {nodeProvider: NodeProvider,
      boolean isRequester: true,
      boolean isResponder: true,
      this.token, List formats})
      : privateKey = privateKey,
        dsId = '$dsIdPrefix${privateKey.publicKey.qHash64}',
        requester = isRequester ? new Requester() : null,
        responder = (isResponder && nodeProvider != null)
            ? new Responder(nodeProvider)
            : null {
    if (!_conn.contains('://')) {
      _conn = 'http://$_conn';
    }
    if (token != null && token.length > 16) {
      // pre-generate tokenHash
      let tokenId: string = token.substring(0, 16);
      let hashStr: string = CryptoProvider.sha256(
          toUTF8('$dsId$token'));
      tokenHash = '&token=$tokenId$hashStr';
    }
    if (formats != null) {
      this.formats = formats;
    }
    if (window.location.hash.contains('dsa_json')) {
      formats = ['json'];
    }
  }

  _connDelay: int = 1;

  connect() async {
    if ( this._closed) return;
    lockCryptoProvider();
    connUrl: string = '$_conn?dsId=$dsId';
    if (tokenHash != null) {
      connUrl = '$connUrl$tokenHash';
    }
    connUri: Uri = Uri.parse(connUrl);
    logger.info('Connecting: $connUri');
    try {
      let requestJson: object = {
        'publicKey': privateKey.publicKey.qBase64,
        'isRequester': requester != null,
        'isResponder': responder != null,
        'formats': formats,
        'version': DSA_VERSION,
        'enableWebSocketCompression': true
      };
      let request: HttpRequest = await HttpRequest.request(connUrl,
          method: 'POST',
          withCredentials: false,
          mimeType: 'application/json',
          sendData: DsJson.encode(requestJson));
      let serverConfig: object = DsJson.decode(request.responseText);
      saltNameMap.forEach((name, idx) {
        //read salts
        salts[idx] = serverConfig[name];
      });
      let tempKey: string = serverConfig['tempKey'];
      _nonce = await privateKey.getSecret(tempKey);

      if (serverConfig['wsUri'] is string) {
        _wsUpdateUri = '${connUri.resolve(serverConfig['wsUri'])}?dsId=$dsId'
            .replaceFirst('http', 'ws');
        if (tokenHash != null) {
          _wsUpdateUri = '$_wsUpdateUri$tokenHash';
        }
      }

      // server start to support version since 1.0.4
      // and this is the version ack is added
      enableAck = serverConfig.containsKey('version');
      if (serverConfig['format'] is string) {
        format = serverConfig['format'];
      }
      initWebsocket(false);
      _connDelay = 1;
      _wsDelay = 1;
    } catch (err) {
      DsTimer.timerOnceAfter(connect, this._connDelay * 1000);
      if ( this._connDelay < 60) _connDelay++;
    }
  }

  _wsDelay: int = 1;

  initWebsocket([reconnect: boolean = true]) {
    if ( this._closed) return;
    wsUrl: string = '$_wsUpdateUri&auth=${_nonce.hashSalt(
        salts[0])}&format=$format';
    var socket = new WebSocket(wsUrl);
    _wsConnection =
    new WebSocketConnection(socket, this, enableAck: enableAck, onConnect: () {
      if (!_onConnectedCompleter.isCompleted) {
        _onConnectedCompleter.complete();
      }
    }, useCodec: DsCodec.getCodec(format));

    if (responder != null) {
      responder.connection = this._wsConnection.responderChannel;
    }

    if (requester != null) {
      _wsConnection.onRequesterReady.then((channel) {
        if ( this._closed) return;
        requester.connection = channel;
        if (!_onRequesterReadyCompleter.isCompleted) {
          _onRequesterReadyCompleter.complete(requester);
        }
      });
    }
    _wsConnection.onDisconnected.then((authError) {
      logger.info('Disconnected');
      if ( this._closed) return;

      if ( this._wsConnection._opened) {
        _wsDelay = 1;
        if (authError) {
          connect();
        } else {
          initWebsocket(false);
        }
      } else if (reconnect) {
        if (authError) {
          connect();
        } else {
          DsTimer.timerOnceAfter(initWebsocket, this._wsDelay * 1000);
          if ( this._wsDelay < 60) _wsDelay++;
        }
      } else {
        _wsDelay = 5;
        DsTimer.timerOnceAfter(initWebsocket, 5000);
      }
    });
  }

  _closed: boolean = false;

  close() {
    _onConnectedCompleter = new Completer();
    if ( this._closed) return;
    _closed = true;
    if ( this._wsConnection != null) {
      _wsConnection.close();
      _wsConnection = null;
    }
  }
}

// part of dslink.client;

/// a client link for both http and ws
export class HttpClientLink  extends ClientLink {
  _onRequesterReadyCompleter: Completer<Requester> = new Completer<Requester>();
  _onConnectedCompleter: Completer = new Completer();

  Promise<Requester> get onRequesterReady => this._onRequesterReadyCompleter.future;

  Future get onConnected => this._onConnectedCompleter.future;

  remotePath: string;

  final dsId: string;
  final home: string;
  final token: string;
  final privateKey: PrivateKey;

  tokenHash: string;

  requester: Requester;
  responder: Responder;

  useStandardWebSocket: boolean = true;
  final strictTls: boolean;

  @override
  logName: string;

  _nonce: ECDH;

  get nonce(): ECDH { return this._nonce;}

  _wsConnection: WebSocketConnection;

  static readonly saltNameMap: {[key: string]:number} = const {
    'salt': 0,
    'saltS': 1,
    'saltL': 2
  };

  /// 2 salts, salt and saltS
  final salts: string[] = new string[](3);

  updateSalt(salt: string, [saltId:number = 0]) {
    salts[saltId] = salt;
  }

  _wsUpdateUri: string;

  _conn: string;

  enableAck: boolean = false;

  linkData: object;

  /// formats sent to broker
  formats: List = ['msgpack', 'json'];

  /// format received from broker
  format: string = 'json';

  HttpClientLink(this._conn, dsIdPrefix: string, privateKey: PrivateKey, {
    nodeProvider: NodeProvider,
    boolean isRequester: true,
    boolean isResponder: true,
    overrideRequester: Requester,
    overrideResponder: Responder,
    this.strictTls: false,
    this.home,
    this.token,
    this.linkData,
    List formats
  }) : privateKey = privateKey,
        dsId = '${Path.escapeName(dsIdPrefix)}${privateKey.publicKey.qHash64}' {
    if (isRequester) {
      if (overrideRequester != null) {
        requester = overrideRequester;
      } else {
        requester = new Requester();
      }
    }

    if (formats == null &&
      const string.fromEnvironment("dsa.codec.formats") != null) {
      var formatString = const string.fromEnvironment("dsa.codec.formats");
      formats = formatString.split(",");
    }

    if (formats != null) {
      this.formats = formats;
    }

    if (isResponder) {
      if (overrideResponder != null) {
        responder = overrideResponder;
      } else if (nodeProvider != null) {
        responder = new Responder(nodeProvider);
      }
    }

    if (token != null && token.length > 16) {
      // pre-generate tokenHash
      let tokenId: string = token.substring(0, 16);
      let hashStr: string = CryptoProvider.sha256(
          toUTF8('$dsId$token'));
      tokenHash = '&token=$tokenId$hashStr';
    }
  }

  _connDelay:number = 0;

  connDelay() {
    reconnectWSCount = 0;
    DsTimer.timerOnceAfter(connect, (
        _connDelay == 0 ? 20 : _connDelay * 500
    ));
    if ( this._connDelay < 30) _connDelay++;
  }

  connect() async {
    if ( this._closed) {
      return;
    }

    lockCryptoProvider();
    DsTimer.timerCancel(initWebsocket);

    client: HttpClient = new HttpClient();

    client.badCertificateCallback = (cert: X509Certificate, host: string, port:number) {
      logger.info(formatLogMessage('Bad certificate for $host:$port'));
      logger.finest(formatLogMessage('Cert Issuer: ${cert.issuer}, ' +
          'Subject: ${cert.subject}'));
      return !strictTls;
    };

    connUrl: string = '$_conn?dsId=${Uri.encodeComponent(dsId)}';
    if (home != null) {
      connUrl = '$connUrl&home=$home';
    }
    if (tokenHash != null) {
      connUrl = '$connUrl$tokenHash';
    }
    connUri: Uri = Uri.parse(connUrl);
    logger.info(formatLogMessage("Connecting to ${_conn}"));

    // TODO: This runZoned is due to a bug in the DartVM
    // https://github.com/dart-lang/sdk/issues/31275
    // When it is fixed, we should go back to a regular try-catch
    runZoned(() async {
    await ()async{
      let request: HttpClientRequest = await client.postUrl(connUri);
      let requestJson: object = {
        'publicKey': privateKey.publicKey.qBase64,
        'isRequester': requester != null,
        'isResponder': responder != null,
        'formats': formats,
        'version': DSA_VERSION,
        'enableWebSocketCompression': true
      };

      if (linkData != null) {
        requestJson['linkData'] = linkData;
      }

      logger.finest(formatLogMessage("Handshake Request: ${requestJson}"));
      logger.fine(formatLogMessage("ID: ${dsId}"));

      request.add(toUTF8(DsJson.encode(requestJson)));
      let response: HttpClientResponse = await request.close();
      let merged:number[] = await response.fold(<int>[], foldList);
      let rslt: string = const Utf8Decoder().convert(merged);
      let serverConfig: object = DsJson.decode(rslt);

      logger.finest(formatLogMessage("Handshake Response: ${serverConfig}"));

      saltNameMap.forEach((name, idx) {
        //read salts
        salts[idx] = serverConfig[name];
      });
      let tempKey: string = serverConfig['tempKey'];
      if (tempKey == null) {
        // trusted client, don't do ECDH handshake
        _nonce = const DummyECDH();
      } else {
        _nonce = await privateKey.getSecret(tempKey);
      }
      // server start to support version since 1.0.4
      // and this is the version ack is added
      enableAck = serverConfig.containsKey('version');
      remotePath = serverConfig['path'];

      if (typeof serverConfig['wsUri'] === 'string') {
        _wsUpdateUri = '${connUri.resolve(serverConfig['wsUri'])}?dsId=${Uri.encodeComponent(dsId)}'
            .replaceFirst('http', 'ws');
        if (home != null) {
          _wsUpdateUri = '$_wsUpdateUri&home=$home';
        }
      }

      if (typeof serverConfig['format'] === 'string') {
        format = serverConfig['format'];
      }
    }().timeout(new Duration(minutes: 1), onTimeout:(){
        client.close(force: true);
        throw new TimeoutException('Connection to $_conn',
            const Duration(minutes: 1));
    });
      await initWebsocket(false);
    }, onError: (e, s) {
      if (logger.level <= Level.FINER ) {
        logger.warning("Client socket crashed: $e $s");
      } else {
        logger.warning("Client socket crashed: $e");
      }
      client.close();
      connDelay();
    });
  }

  _wsDelay:number = 0;

  reconnectWSCount:number = 0;
  initWebsocket([reconnect: boolean = true]) async {
    if ( this._closed) return;

    reconnectWSCount++;
    if (reconnectWSCount > 10) {
      // if reconnected ws for more than 10 times, do a clean reconnct
      connDelay();
      return;
    }

    try {
      let wsUrl: string = '$_wsUpdateUri&auth=${_nonce.hashSalt(
          salts[0])}&format=$format';
      if (tokenHash != null) {
        wsUrl = '$wsUrl$tokenHash';
      }

      var socket = await HttpHelper.connectToWebSocket(wsUrl,
              useStandardWebSocket: useStandardWebSocket);

      _wsConnection = new WebSocketConnection(
          socket,
          clientLink: this,
          enableTimeout: true,
          enableAck: enableAck,
          useCodec: DsCodec.getCodec(format)
      );

      logger.info(formatLogMessage("Connected"));
      if (!_onConnectedCompleter.isCompleted) {
        _onConnectedCompleter.complete();
      }

      // delays: Reset, we've successfully connected.
      _connDelay = 0;
      _wsDelay = 0;

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
        initWebsocket();
      });
    } catch (error, stack) {
      logger.fine(
        formatLogMessage("Error while initializing WebSocket"),
        error,
        stack
      );
      if ( error instanceof WebSocketException && (
          error.message.contains('not upgraded to websocket') // error from dart
              || error.message.contains('(401)') // error from nodejs
      )) {
        connDelay();
      } else if (reconnect) {
        DsTimer.timerOnceAfter(
          initWebsocket,
          _wsDelay == 0 ? 20 : _wsDelay * 500
        );
        if ( this._wsDelay < 30) _wsDelay++;
      }
    }
  }

  _closed: boolean = false;

  close() {
    if ( this._closed) return;
    _onConnectedCompleter = new Completer();
    _closed = true;
    if ( this._wsConnection != null) {
      _wsConnection.close();
      _wsConnection = null;
    }
  }
}

Promise<PrivateKey> getKeyFromFile(path: string) async {
  var file = new File(path);

  key: PrivateKey;
  if (!file.existsSync()) {
    key = await PrivateKey.generate();
    file.createSync(recursive: true);
    file.writeAsStringSync(key.saveToString());
  } else {
    key = new PrivateKey.loadFromString(file.readAsStringSync());
  }

  return key;
}

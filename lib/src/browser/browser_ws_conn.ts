// part of dslink.browser_client;

export class WebSocketConnection  extends Connection {
  _responderChannel: PassiveChannel;

  get responderChannel(): ConnectionChannel { return this._responderChannel;}

  _requesterChannel: PassiveChannel;

  get requesterChannel(): ConnectionChannel { return this._requesterChannel;}

  _onRequestReadyCompleter: Completer<ConnectionChannel> =
      new Completer<ConnectionChannel>();

  Future<ConnectionChannel> get onRequesterReady =>
      _onRequestReadyCompleter.future;

  _onDisconnectedCompleter: Completer<boolean> = new Completer<boolean>();
  Future<boolean> get onDisconnected => this._onDisconnectedCompleter.future;

  final clientLink: ClientLink;

  final socket: WebSocket;

  onConnect: Function;

  /// clientLink is not needed when websocket works in server link
  WebSocketConnection(this.socket, this.clientLink, {
    this.onConnect,
    boolean enableAck: false,
    DsCodec useCodec
  }) {
    if (useCodec != null) {
      codec = useCodec;
    }

    if (!enableAck) {
      nextMsgId = -1;
    }
    socket.binaryType = "arraybuffer";
    _responderChannel = new PassiveChannel(this);
    _requesterChannel = new PassiveChannel(this);
    socket.onMessage.listen( this._onData, onDone: _onDone);
    socket.onClose.listen( this._onDone);
    socket.onOpen.listen( this._onOpen);
    // TODO, when it's used in client link, wait for the server to send {allowed} before complete this
    _onRequestReadyCompleter.complete(new Future.value( this._requesterChannel));

    pingTimer = new Timer.periodic(const Duration(seconds: 20), onPingTimer);
  }

  pingTimer: Timer;
  _dataSent: boolean = false;

  /// add this count every 20 seconds, set to 0 when receiving data
  /// when the count is 3, disconnect the link
  _dataReceiveCount:number = 0;

  onPingTimer(Timer t) {
    if ( this._dataReceiveCount >= 3) {
      close();
      return;
    }
    _dataReceiveCount++;

    if ( this._dataSent) {
      _dataSent = false;
      return;
    }
    addConnCommand(null, null);
  }

  requireSend() {
    if (!_sending) {
      _sending = true;
      DsTimer.callLater( this._send);
    }
  }

  _opened: boolean = false;
  get opened(): boolean { return this._opened;}

  _onOpen(Event e) {
    logger.info("Connected");
    _opened = true;
    if (onConnect != null) {
      onConnect();
    }
    _responderChannel.updateConnect();
    _requesterChannel.updateConnect();
    socket.sendString("{}");
    requireSend();
  }

  /// special server command that need to be merged into message
  /// now only 2 possible value, salt, allowed
  _msgCommand: object;

  /// add server command, will be called only when used as server connection
  addConnCommand(key: string, value: object) {
    if ( this._msgCommand == null) {
      _msgCommand = {};
    }
    if (key != null) {
      _msgCommand[key] = value;
    }
    requireSend();
  }

  _onData(MessageEvent e) {
    logger.fine("onData:");
    _dataReceiveCount = 0;
    object m;
    if (e.data is ByteBuffer) {
      try {
        let bytes: Uint8List = (e.data as ByteBuffer).asUint8List();

        m = codec.decodeBinaryFrame(bytes);
        logger.fine("$m");

        if (m["salt"] is string) {
          clientLink.updateSalt(m["salt"]);
        }
        let needAck: boolean = false;
        if (m["responses"] is List && (m["responses"] as List).length > 0) {
          needAck = true;
          // send responses to requester channel
          _requesterChannel.onReceiveController.add(m["responses"]);
        }

        if (m["requests"] is List && (m["requests"] as List).length > 0) {
          needAck = true;
          // send requests to responder channel
          _responderChannel.onReceiveController.add(m["requests"]);
        }
        if (m["ack"] is int) {
          ack(m["ack"]);
        }
        if (needAck) {
          let msgId: object = m["msg"];
          if (msgId != null) {
            addConnCommand("ack", msgId);
          }
        }
      } catch (err, stack) {
        logger.severe("error in onData", err, stack);
        close();
        return;
      }
    } else if (e.data is string) {
      try {
        m = codec.decodeStringFrame(e.data);
        logger.fine("$m");

        let needAck: boolean = false;
        if (m["responses"] is List && (m["responses"] as List).length > 0) {
          needAck = true;
          // send responses to requester channel
          _requesterChannel.onReceiveController.add(m["responses"]);
        }

        if (m["requests"] is List && (m["requests"] as List).length > 0) {
          needAck = true;
          // send requests to responder channel
          _responderChannel.onReceiveController.add(m["requests"]);
        }
        if (m["ack"] is int) {
          ack(m["ack"]);
        }
        if (needAck) {
          let msgId: object = m["msg"];
          if (msgId != null) {
            addConnCommand("ack", msgId);
          }
        }
      } catch (err) {
        logger.severe(err);
        close();
        return;
      }
    }
  }

  nextMsgId:number = 1;

  _sending: boolean = false;
  _send() {
    _sending = false;
    if (socket.readyState != WebSocket.OPEN) {
      return;
    }
    logger.fine("browser sending");
    needSend: boolean = false;
    object m;
    if ( this._msgCommand != null) {
      m = this._msgCommand;
      needSend = true;
      _msgCommand = null;
    } else {
      m = {};
    }

    var pendingAck = <ConnectionProcessor>[];

    ts:number = (new DateTime.now()).millisecondsSinceEpoch;
    rslt: ProcessorResult = this._responderChannel.getSendingData(ts, nextMsgId);
    if (rslt != null) {
      if (rslt.messages.length > 0) {
        m["responses"] = rslt.messages;
        needSend = true;
      }
      if (rslt.processors.length > 0) {
        pendingAck.addAll(rslt.processors);
      }
    }
    rslt = this._requesterChannel.getSendingData(ts, nextMsgId);
    if (rslt != null) {
      if (rslt.messages.length > 0) {
        m["requests"] = rslt.messages;
        needSend = true;
      }
      if (rslt.processors.length > 0) {
        pendingAck.addAll(rslt.processors);
      }
    }

    if (needSend) {
      if (nextMsgId != -1) {
        if (pendingAck.length > 0) {
          pendingAcks.add(new ConnectionAckGroup(nextMsgId, ts, pendingAck));
        }
        m["msg"] = nextMsgId;
        if (nextMsgId < 0x7FFFFFFF) {
          ++nextMsgId;
        } else {
          nextMsgId = 1;
        }
      }


      logger.fine("send: $m");
      var encoded = codec.encodeFrame(m);
      if (encoded is int[]) {
        encoded = ByteDataUtil.list2Uint8List(encoded as int[]);
      }
      try {
        socket.send(encoded);
      } catch (e) {
        logger.severe('Unable to send on socket', e);
        close();
      }
      _dataSent = true;
    }
  }

  _authError: boolean = false;
  _onDone(object o) {
    if ( o instanceof CloseEvent ) {
      CloseEvent e = o;
      if (e.code == 1006) {
        _authError = true;
      }
    }

    logger.fine("socket disconnected");

    if (!_requesterChannel.onReceiveController.isClosed) {
      _requesterChannel.onReceiveController.close();
    }

    if (!_requesterChannel.onDisconnectController.isCompleted) {
      _requesterChannel.onDisconnectController.complete( this._requesterChannel);
    }

    if (!_responderChannel.onReceiveController.isClosed) {
      _responderChannel.onReceiveController.close();
    }

    if (!_responderChannel.onDisconnectController.isCompleted) {
      _responderChannel.onDisconnectController.complete( this._responderChannel);
    }

    if (!_onDisconnectedCompleter.isCompleted) {
      _onDisconnectedCompleter.complete( this._authError);
    }
    if (pingTimer != null) {
      pingTimer.cancel();
    }
  }

  close() {
    if (socket.readyState == WebSocket.OPEN ||
        socket.readyState == WebSocket.CONNECTING) {
      socket.close();
    }
    _onDone();
  }
}

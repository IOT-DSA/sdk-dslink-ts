library dslink.http.websocket;

import "dart:async";
import "dart:io";

import "../../common.dart";
import "../../utils.dart";

import "package:logging/logging.dart";

export class WebSocketConnection  extends Connection {
  _responderChannel: PassiveChannel;

  get responderChannel(): ConnectionChannel { return this._responderChannel;}

  _requesterChannel: PassiveChannel;

  get requesterChannel(): ConnectionChannel { return this._requesterChannel;}

  onRequestReadyCompleter: Completer<ConnectionChannel> = new Completer<ConnectionChannel>();

  Future<ConnectionChannel> get onRequesterReady => onRequestReadyCompleter.future;

  _onDisconnectedCompleter: Completer<boolean> = new Completer<boolean>();

  Future<boolean> get onDisconnected => this._onDisconnectedCompleter.future;

  final clientLink: ClientLink;

  final socket: WebSocket;

  _onDoneHandled: boolean = false;

  /// clientLink is not needed when websocket works in server link
  WebSocketConnection(this.socket,
      {this.clientLink, boolean enableTimeout: false, boolean enableAck: true, DsCodec useCodec}) {
    if (useCodec != null) {
      codec = useCodec;
    }
    _responderChannel = new PassiveChannel(this, true);
    _requesterChannel = new PassiveChannel(this, true);
    socket.listen(
        onData,
        onDone: _onDone,
        onError: (err) => logger.warning(
            formatLogMessage('Error listening to socket'), err));
    socket.add(codec.blankData);
    if (!enableAck) {
      nextMsgId = -1;
    }

    if (enableTimeout) {
      pingTimer = new Timer.periodic(const Duration(seconds: 20), onPingTimer);
    }
    // TODO(rinick): when it's used in client link, wait for the server to send {allowed} before complete this
  }

  pingTimer: Timer;

  /// set to true when data is sent, reset the flag every 20 seconds
  /// since the previous ping message will cause the next 20 seoncd to have a message
  /// max interval between 2 ping messages is 40 seconds
  _dataSent: boolean = false;

  /// add this count every 20 seconds, set to 0 when receiving data
  /// when the count is 3, disconnect the link (>=60 seconds)
  _dataReceiveCount:number = 0;

  static throughputEnabled: boolean = false;

  static dataIn:number = 0;
  static messageIn:number = 0;
  static dataOut:number = 0;
  static messageOut:number = 0;
  static frameIn:number = 0;
  static frameOut:number = 0;

  onPingTimer(Timer t) {
    if ( this._dataReceiveCount >= 3) {
      logger.finest('close stale connection');
      this.close();
      return;
    }

    _dataReceiveCount++;

    if ( this._dataSent) {
      _dataSent = false;
      return;
    }
    this.addConnCommand(null, null);
  }

  requireSend() {
    if (!_sending) {
      _sending = true;
      DsTimer.callLater( this._send);
    }
  }

  /// special server command that need to be merged into message
  /// now only 2 possible value, salt, allowed
  _serverCommand: object;

  /// add server command, will be called only when used as server connection
  addConnCommand(key: string, value: object) {
    if ( this._serverCommand == null) {
      _serverCommand = {};
    }
    if (key != null) {
      _serverCommand[key] = value;
    }

    requireSend();
  }

  onData(dynamic data) {
    if (throughputEnabled) {
      frameIn++;
    }

    if ( this._onDisconnectedCompleter.isCompleted) {
      return;
    }
    if (!onRequestReadyCompleter.isCompleted) {
      onRequestReadyCompleter.complete( this._requesterChannel);
    }
    _dataReceiveCount = 0;
    object m;
    if (data is int[]) {
      try {
        m = codec.decodeBinaryFrame(data as int[]);
        if (logger.isLoggable(Level.FINEST)) {
          logger.finest(formatLogMessage("receive: ${m}"));
        }
      } catch (err, stack) {
        logger.fine(
          formatLogMessage("Failed to decode binary data in WebSocket Connection"),
          err,
          stack
        );
        close();
        return;
      }

      if (throughputEnabled) {
        dataIn += data.length;
      }

      data = null;

      let needAck: boolean = false;
      if (m["responses"] is List && (m["responses"] as List).length > 0) {
        needAck = true;
        // send responses to requester channel
        _requesterChannel.onReceiveController.add(m["responses"]);

        if (throughputEnabled) {
          messageIn += (m["responses"] as List).length;
        }
      }

      if (m["requests"] is List && (m["requests"] as List).length > 0) {
        needAck = true;
        // send requests to responder channel
        _responderChannel.onReceiveController.add(m["requests"]);

        if (throughputEnabled) {
          messageIn += (m["requests"] as List).length;
        }
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
    } else if ( typeof data === 'string' ) {
      try {
        m = codec.decodeStringFrame(data);
        if (logger.isLoggable(Level.FINEST)) {
          logger.finest(formatLogMessage("receive: ${m}"));
        }
      } catch (err, stack) {
        logger.severe(
          formatLogMessage("Failed to decode string data from WebSocket Connection"),
          err,
          stack
        );
        close();
        return;
      }

      if (throughputEnabled) {
        dataIn += data.length;
      }

      if (m["salt"] is string && clientLink != null) {
        clientLink.updateSalt(m["salt"]);
      }

      let needAck: boolean = false;
      if (m["responses"] is List && (m["responses"] as List).length > 0) {
        needAck = true;
        // send responses to requester channel
        _requesterChannel.onReceiveController.add(m["responses"]);
        if (throughputEnabled) {
          for (object resp in m["responses"]) {
            if (resp["updates"] is List) {
              let len:number = resp["updates"].length;
              if (len > 0) {
                messageIn += len;
              } else {
                messageIn += 1;
              }
            } else {
              messageIn += 1;
            }
          }
        }
      }

      if (m["requests"] is List && (m["requests"] as List).length > 0) {
        needAck = true;
        // send requests to responder channel
        _responderChannel.onReceiveController.add(m["requests"]);
        if (throughputEnabled) {
          messageIn += m["requests"].length;
        }
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
    }
  }

  /// when nextMsgId = -1, ack is disabled
  nextMsgId:number = 1;
  _sending: boolean = false;

  _send() {
    if (!_sending) {
      return;
    }
    _sending = false;
    needSend: boolean = false;
    object m;
    if ( this._serverCommand != null) {
      m = this._serverCommand;
      _serverCommand = null;
      needSend = true;
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
        if (throughputEnabled) {
          for (object resp in rslt.messages) {
            if (resp["updates"] is List) {
              let len:number = resp["updates"].length;
              if (len > 0) {
                messageOut += len;
              } else {
                messageOut += 1;
              }
            } else {
              messageOut += 1;
            }
          }
        }
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
        if (throughputEnabled) {
          messageOut += rslt.messages.length;
        }
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
      addData(m);
      _dataSent = true;

      if (throughputEnabled) {
        frameOut++;
      }
    }
  }

  addData(object m) {
    encoded: object = codec.encodeFrame(m);

    if (logger.isLoggable(Level.FINEST)) {
      logger.finest(formatLogMessage("send: $m"));
    }

    if (throughputEnabled) {
      if ( typeof encoded === 'string' ) {
        dataOut += encoded.length;
      } else if (encoded is int[]) {
        dataOut += encoded.length;
      } else {
        logger.warning(formatLogMessage("invalid data frame"));
      }
    }
    try {
      socket.add(encoded);
    } catch (e) {
      logger.severe(formatLogMessage('Error writing to socket'), e);
      close();
    }
  }

  printDisconnectedMessage: boolean = true;

  _onDone() {
    if ( this._onDoneHandled) {
      return;
    }

    _onDoneHandled = true;

    if (printDisconnectedMessage) {
      logger.info(formatLogMessage("Disconnected"));
    }

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
      _onDisconnectedCompleter.complete(false);
    }

    if (pingTimer != null) {
      pingTimer.cancel();
    }
    _sending = false;
  }

  formatLogMessage(msg: string):string {
    if (clientLink != null) {
      return clientLink.formatLogMessage(msg);
    }

    if (logName != null) {
      return "[${logName}] ${msg}";
    }
    return msg;
  }

  logName: string;

  close() {
    if (socket.readyState == WebSocket.OPEN ||
        socket.readyState == WebSocket.CONNECTING) {
      socket.close();
    }
    _onDone();
  }
}

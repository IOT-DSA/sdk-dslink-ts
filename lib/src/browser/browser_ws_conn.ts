// part of dslink.browser_client;

import {ClientLink, Connection, ConnectionChannel} from "../common/interfaces";
import {PassiveChannel} from "../common/connection_channel";
import {Completer} from "../utils/async";
import {DsCodec} from "../utils/codec";

export class WebSocketConnection  extends Connection {
  _responderChannel: PassiveChannel;

  get responderChannel(): ConnectionChannel { return this._responderChannel;}

  _requesterChannel: PassiveChannel;

  get requesterChannel(): ConnectionChannel { return this._requesterChannel;}

  _onRequestReadyCompleter: Completer<ConnectionChannel> =
      new Completer<ConnectionChannel>();

   get onRequesterReady():Promise<ConnectionChannel>{return
      this._onRequestReadyCompleter.future;}

  _onDisconnectedCompleter: Completer<boolean> = new Completer<boolean>();
   get onDisconnected(): Promise<boolean> {return this._onDisconnectedCompleter.future;}

  readonly clientLink: ClientLink;

  readonly socket: WebSocket;

  onConnect: Function;

  /// clientLink is not needed when websocket works in server link
  constructor(socket:WebSocket, clientLink:ClientLink,
    onConnect:Function,
     enableAck:boolean= false,
     useCodec:DsCodec
  ) {
    super();
    this.socket=socket;
    this.clientLink=clientLink;
    this.onConnect=onConnect;
    if (useCodec != null) {
      this.codec = useCodec;
    }

    if (!enableAck) {
      this.nextMsgId = -1;
    }
    socket.binaryType = "arraybuffer";
    this._responderChannel = new PassiveChannel(this);
    this._requesterChannel = new PassiveChannel(this);
    socket.onmessage = (event)=> {this._onData(event);};
    socket.onclose = (event)=>{this._onDone(event);};
    socket.onopen = (event)=>{this._onOpen(event);};
    // TODO, when it's used in client link, wait for the server to send {allowed} before complete this
    setTimeout(()=>{this._onRequestReadyCompleter.complete(this._requesterChannel)}, 0);

    this.pingTimer = setInterval(()=>{this.onPingTimer();}, 20000);
  }

  pingTimer: any;
  _dataSent: boolean = false;

  /// add this count every 20 seconds, set to 0 when receiving data
  /// when the count is 3, disconnect the link
  _dataReceiveCount:number = 0;

  onPingTimer() {
    if ( this._dataReceiveCount >= 3) {
      close();
      return;
    }
    this._dataReceiveCount++;

    if ( this._dataSent) {
      this._dataSent = false;
      return;
    }
    this.addConnCommand(null, null);
  }

  requireSend() {
    if (!this._sending) {
      this._sending = true;
      setTimeout(()=>{ this._send();},0);
    }
  }

  _opened: boolean = false;
  get opened(): boolean { return this._opened;}

  _onOpen(e:Event) {
//    logger.info("Connected");
    this._opened = true;
    if (this.onConnect != null) {
      this.onConnect();
    }
    this._responderChannel.updateConnect();
    this._requesterChannel.updateConnect();
    this.socket.send(this.codec.blankData);
    this.requireSend();
  }

  /// special server command that need to be merged into message
  /// now only 2 possible value, salt, allowed
  _msgCommand: {[key:string]:any};

  /// add server command, will be called only when used as server connection
  addConnCommand(key: string, value: object) {
    if ( this._msgCommand == null) {
      this._msgCommand = {};
    }
    if (key != null) {
      this._msgCommand[key] = value;
    }
    this.requireSend();
  }

  _onData(e: MessageEvent) {
//    logger.fine("onData:");
    this._dataReceiveCount = 0;
    let m:{[key:string]:any};
    if (e.data instanceof ArrayBuffer) {
      try {
        let bytes: Uint8Array = new Uint8Array(e.data as ArrayBuffer);

        m = this.codec.decodeBinaryFrame(bytes);
//        logger.fine("$m");

        if (typeof m["salt"] === 'string') {
          this.clientLink.updateSalt(m["salt"]);
        }
        let needAck: boolean = false;
        if (Array.isArray(m["responses"]) && m["responses"].length > 0) {
          needAck = true;
          // send responses to requester channel
          this._requesterChannel.onReceive.add(m["responses"]);
        }

        if (Array.isArray(m["requests"]) && m["requests"].length > 0) {
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
//        logger.severe("error in onData", err, stack);
        close();
        return;
      }
    } else if (typeof e.data === 'string') {
      try {
        m = codec.decodeStringFrame(e.data);
//        logger.fine("$m");

        let needAck: boolean = false;
        if (Array.isArray(m["responses"]) && m["responses"].length > 0) {
          needAck = true;
          // send responses to requester channel
          _requesterChannel.onReceiveController.add(m["responses"]);
        }

        if (Array.isArray(m["requests"]) && m["requests"].length > 0) {
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
//        logger.severe(err);
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
//    logger.fine("browser sending");
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


//      logger.fine("send: $m");
      var encoded = codec.encodeFrame(m);
      if (encoded is int[]) {
        encoded = ByteDataUtil.list2Uint8Array(encoded as int[]);
      }
      try {
        socket.send(encoded);
      } catch (e) {
//        logger.severe('Unable to send on socket', e);
        close();
      }
      _dataSent = true;
    }
  }

  _authError: boolean = false;
  _onDone(o:any) {
    if ( o instanceof CloseEvent ) {
      let e = o;
      if (e.code == 1006) {
        this._authError = true;
      }
    }

//    logger.fine("socket disconnected");

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

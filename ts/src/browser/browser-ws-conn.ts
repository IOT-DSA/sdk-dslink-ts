import {
  ClientLink,
  Connection,
  ConnectionAckGroup,
  ConnectionChannel,
  ConnectionProcessor,
  ProcessorResult
} from '../common/interfaces';
import {PassiveChannel} from '../common/connection-channel';
import {Completer} from '../utils/async';
import {DsCodec, DsJson} from '../utils/codec';
import {logger as mainLogger} from '../utils/logger';

let logger = mainLogger.tag('ws');

export class WebSocketConnection extends Connection {
  _responderChannel: PassiveChannel;

  get responderChannel(): ConnectionChannel {
    return this._responderChannel;
  }

  _requesterChannel: PassiveChannel;

  get requesterChannel(): ConnectionChannel {
    return this._requesterChannel;
  }

  _onRequestReadyCompleter: Completer<ConnectionChannel> = new Completer<ConnectionChannel>();

  get onRequesterReady(): Promise<ConnectionChannel> {
    return this._onRequestReadyCompleter.future;
  }

  _onDisconnectedCompleter: Completer<boolean> = new Completer<boolean>();

  get onDisconnected(): Promise<boolean> {
    return this._onDisconnectedCompleter.future;
  }

  readonly clientLink: ClientLink;

  readonly socket: WebSocket;

  onConnect: Function;

  _onDoneHandled = false;

  /// clientLink is not needed when websocket works in server link
  constructor(socket: WebSocket, clientLink: ClientLink, onConnect: Function, useCodec: DsCodec) {
    super();
    this.socket = socket;
    this.clientLink = clientLink;
    this.onConnect = onConnect;
    if (useCodec != null) {
      this.codec = useCodec;
    }

    socket.binaryType = 'arraybuffer';
    this._responderChannel = new PassiveChannel(this);
    this._requesterChannel = new PassiveChannel(this);
    socket.onmessage = this._onData;
    socket.onclose = this._onDone;
    socket.onerror = this._onDone;
    socket.onopen = this._onOpen;

    this.pingTimer = setInterval(this.onPingTimer, 20000);
  }

  pingTimer: any;

  /// set to true when data is sent, reset the flag every 20 seconds
  /// since the previous ping message will cause the next 20 seoncd to have a message
  /// max interval between 2 ping messages is 40 seconds
  _dataSent: boolean = false;

  /// add this count every 20 seconds, set to 0 when receiving data
  /// when the count is 3, disconnect the link
  _dataReceiveCount: number = 0;

  onPingTimer = () => {
    if (this._dataReceiveCount >= 3) {
      close();
      return;
    }
    this._dataReceiveCount++;

    if (this._dataSent) {
      this._dataSent = false;
      return;
    }
    this.addConnCommand(null, null);
  };

  requireSend() {
    if (!this._sending) {
      this._sending = true;
      setTimeout(() => {
        this._send();
      }, 0);
    }
  }

  _opened: boolean = false;
  get opened(): boolean {
    return this._opened;
  }

  _onOpen = (e: Event) => {
    logger.trace('Connected');
    this._opened = true;
    if (this.onConnect != null) {
      this.onConnect();
    }
    this._responderChannel.updateConnect();
    this._requesterChannel.updateConnect();
    this.socket.send(this.codec.blankData);
    this.requireSend();
  };

  /// special server command that need to be merged into message
  /// now only 3 possible value, salt, ack, allowed
  _msgCommand: {[key: string]: any};

  /// add server command, will be called only when used as server connection
  addConnCommand(key: string, value: object) {
    if (this._msgCommand == null) {
      this._msgCommand = {};
    }
    if (key != null) {
      this._msgCommand[key] = value;
    }
    this.requireSend();
  }

  _onData = (e: MessageEvent) => {
    if (this._onDisconnectedCompleter.isCompleted) {
      return;
    }
    if (!this._onRequestReadyCompleter.isCompleted) {
      this._onRequestReadyCompleter.complete(this._requesterChannel);
    }
    this._dataReceiveCount = 0;
    let m: {[key: string]: any};
    if (e.data instanceof ArrayBuffer) {
      try {
        let bytes: Uint8Array = new Uint8Array(e.data as ArrayBuffer);

        m = this.codec.decodeBinaryFrame(bytes);
        logger.trace(() => 'receive' + DsJson.encode(m));

        if (typeof m['salt'] === 'string') {
          this.clientLink.updateSalt(m['salt']);
        }
        let needAck = false;
        if (Array.isArray(m['responses']) && m['responses'].length > 0) {
          needAck = true;
          // send responses to requester channel
          this._requesterChannel.onReceive.add(m['responses']);
        }

        if (Array.isArray(m['requests']) && m['requests'].length > 0) {
          needAck = true;
          // send requests to responder channel
          this._responderChannel.onReceive.add(m['requests']);
        }
        if (typeof m['ack'] === 'number') {
          this.ack(m['ack']);
        }
        if (needAck) {
          let msgId: object = m['msg'];
          if (msgId != null) {
            this.addConnCommand('ack', msgId);
          }
        }
      } catch (err) {
        console.error('error in onData', err);
        this.close();
        return;
      }
    } else if (typeof e.data === 'string') {
      try {
        m = this.codec.decodeStringFrame(e.data);
        logger.trace(() => 'receive' + DsJson.encode(m));

        let needAck = false;
        if (Array.isArray(m['responses']) && m['responses'].length > 0) {
          needAck = true;
          // send responses to requester channel
          this._requesterChannel.onReceive.add(m['responses']);
        }

        if (Array.isArray(m['requests']) && m['requests'].length > 0) {
          needAck = true;
          // send requests to responder channel
          this._responderChannel.onReceive.add(m['requests']);
        }
        if (typeof m['ack'] === 'number') {
          this.ack(m['ack']);
        }
        if (needAck) {
          let msgId: object = m['msg'];
          if (msgId != null) {
            this.addConnCommand('ack', msgId);
          }
        }
      } catch (err) {
        console.error(err);
        this.close();
        return;
      }
    }
  };

  nextMsgId: number = 1;
  _sending: boolean = false;

  _send() {
    if (!this._sending) {
      return;
    }
    this._sending = false;
    if (this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    //    logger.fine("browser sending");
    let needSend = false;
    let m: {[key: string]: any};
    if (this._msgCommand != null) {
      m = this._msgCommand;
      needSend = true;
      this._msgCommand = null;
    } else {
      m = {};
    }

    let pendingAck: ConnectionProcessor[] = [];

    let ts: number = new Date().getTime();
    let rslt: ProcessorResult = this._responderChannel.getSendingData(ts, this.nextMsgId);
    if (rslt != null) {
      if (rslt.messages.length > 0) {
        m['responses'] = rslt.messages;
        needSend = true;
      }
      if (rslt.processors.length > 0) {
        pendingAck = pendingAck.concat(rslt.processors);
      }
    }
    rslt = this._requesterChannel.getSendingData(ts, this.nextMsgId);
    if (rslt != null) {
      if (rslt.messages.length > 0) {
        m['requests'] = rslt.messages;
        needSend = true;
      }
      if (rslt.processors.length > 0) {
        pendingAck = pendingAck.concat(rslt.processors);
      }
    }

    if (needSend) {
      if (this.nextMsgId !== -1) {
        if (pendingAck.length > 0) {
          this.pendingAcks.push(new ConnectionAckGroup(this.nextMsgId, ts, pendingAck));
        }
        m['msg'] = this.nextMsgId;
        if (this.nextMsgId < 0x7fffffff) {
          ++this.nextMsgId;
        } else {
          this.nextMsgId = 1;
        }
      }

      logger.trace(() => 'send' + DsJson.encode(m));
      let encoded = this.codec.encodeFrame(m);

      try {
        this.socket.send(encoded);
      } catch (e) {
        console.error('Unable to send on socket', e);
        this.close();
      }
      this._dataSent = true;
    }
  }

  _authError: boolean = false;

  _onDone = (o?: any) => {
    if (o instanceof CloseEvent) {
      if (o.code === 1006) {
        this._authError = true;
      }
    }

    if (this._onDoneHandled) {
      return;
    }
    logger.trace('Disconnected');

    this._onDoneHandled = true;

    //    logger.fine("socket disconnected");

    if (!this._requesterChannel.onReceive.isClosed) {
      this._requesterChannel.onReceive.close();
    }

    if (!this._requesterChannel.onDisconnectController.isCompleted) {
      this._requesterChannel.onDisconnectController.complete(this._requesterChannel);
    }

    if (!this._responderChannel.onReceive.isClosed) {
      this._responderChannel.onReceive.close();
    }

    if (!this._responderChannel.onDisconnectController.isCompleted) {
      this._responderChannel.onDisconnectController.complete(this._responderChannel);
    }

    if (!this._onDisconnectedCompleter.isCompleted) {
      this._onDisconnectedCompleter.complete(this._authError);
    }
    if (this.pingTimer != null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this._sending = false;
  };

  close() {
    if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
      this.socket.close();
    }
    this._onDone();
  }
}

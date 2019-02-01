import { Connection, ConnectionAckGroup } from "../common/interfaces";
import { PassiveChannel } from "../common/connection_channel";
import { Completer } from "../utils/async";
export class WebSocketConnection extends Connection {
    /// clientLink is not needed when websocket works in server link
    constructor(socket, clientLink, onConnect, useCodec) {
        super();
        this._onRequestReadyCompleter = new Completer();
        this._onDisconnectedCompleter = new Completer();
        this._dataSent = false;
        /// add this count every 20 seconds, set to 0 when receiving data
        /// when the count is 3, disconnect the link
        this._dataReceiveCount = 0;
        this._opened = false;
        this.nextMsgId = 1;
        this._sending = false;
        this._authError = false;
        this.socket = socket;
        this.clientLink = clientLink;
        this.onConnect = onConnect;
        if (useCodec != null) {
            this.codec = useCodec;
        }
        socket.binaryType = "arraybuffer";
        this._responderChannel = new PassiveChannel(this);
        this._requesterChannel = new PassiveChannel(this);
        socket.onmessage = (event) => {
            this._onData(event);
        };
        socket.onclose = (event) => {
            this._onDone(event);
        };
        socket.onopen = (event) => {
            this._onOpen(event);
        };
        // TODO, when it's used in client link, wait for the server to send {allowed} before complete this
        setTimeout(() => {
            this._onRequestReadyCompleter.complete(this._requesterChannel);
        }, 0);
        this.pingTimer = setInterval(() => {
            this.onPingTimer();
        }, 20000);
    }
    get responderChannel() {
        return this._responderChannel;
    }
    get requesterChannel() {
        return this._requesterChannel;
    }
    get onRequesterReady() {
        return this._onRequestReadyCompleter.future;
    }
    get onDisconnected() {
        return this._onDisconnectedCompleter.future;
    }
    onPingTimer() {
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
    }
    requireSend() {
        if (!this._sending) {
            this._sending = true;
            setTimeout(() => {
                this._send();
            }, 0);
        }
    }
    get opened() {
        return this._opened;
    }
    _onOpen(e) {
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
    /// add server command, will be called only when used as server connection
    addConnCommand(key, value) {
        if (this._msgCommand == null) {
            this._msgCommand = {};
        }
        if (key != null) {
            this._msgCommand[key] = value;
        }
        this.requireSend();
    }
    _onData(e) {
        //    logger.fine("onData:");
        this._dataReceiveCount = 0;
        let m;
        if (e.data instanceof ArrayBuffer) {
            try {
                let bytes = new Uint8Array(e.data);
                m = this.codec.decodeBinaryFrame(bytes);
                //        logger.fine("$m");
                if (typeof m["salt"] === 'string') {
                    this.clientLink.updateSalt(m["salt"]);
                }
                let needAck = false;
                if (Array.isArray(m["responses"]) && m["responses"].length > 0) {
                    needAck = true;
                    // send responses to requester channel
                    this._requesterChannel.onReceive.add(m["responses"]);
                }
                if (Array.isArray(m["requests"]) && m["requests"].length > 0) {
                    needAck = true;
                    // send requests to responder channel
                    this._responderChannel.onReceive.add(m["requests"]);
                }
                if (typeof m["ack"] === 'number') {
                    this.ack(m["ack"]);
                }
                if (needAck) {
                    let msgId = m["msg"];
                    if (msgId != null) {
                        this.addConnCommand("ack", msgId);
                    }
                }
            }
            catch (err) {
                console.error("error in onData", err);
                this.close();
                return;
            }
        }
        else if (typeof e.data === 'string') {
            try {
                m = this.codec.decodeStringFrame(e.data);
                //        logger.fine("$m");
                let needAck = false;
                if (Array.isArray(m["responses"]) && m["responses"].length > 0) {
                    needAck = true;
                    // send responses to requester channel
                    this._requesterChannel.onReceive.add(m["responses"]);
                }
                if (Array.isArray(m["requests"]) && m["requests"].length > 0) {
                    needAck = true;
                    // send requests to responder channel
                    this._responderChannel.onReceive.add(m["requests"]);
                }
                if (typeof m["ack"] === "number") {
                    this.ack(m["ack"]);
                }
                if (needAck) {
                    let msgId = m["msg"];
                    if (msgId != null) {
                        this.addConnCommand("ack", msgId);
                    }
                }
            }
            catch (err) {
                console.error(err);
                this.close();
                return;
            }
        }
    }
    _send() {
        this._sending = false;
        if (this.socket.readyState !== WebSocket.OPEN) {
            return;
        }
        //    logger.fine("browser sending");
        let needSend = false;
        let m;
        if (this._msgCommand != null) {
            m = this._msgCommand;
            needSend = true;
            this._msgCommand = null;
        }
        else {
            m = {};
        }
        let pendingAck = [];
        let ts = (new Date()).getTime();
        let rslt = this._responderChannel.getSendingData(ts, this.nextMsgId);
        if (rslt != null) {
            if (rslt.messages.length > 0) {
                m["responses"] = rslt.messages;
                needSend = true;
            }
            if (rslt.processors.length > 0) {
                pendingAck = pendingAck.concat(rslt.processors);
            }
        }
        rslt = this._requesterChannel.getSendingData(ts, this.nextMsgId);
        if (rslt != null) {
            if (rslt.messages.length > 0) {
                m["requests"] = rslt.messages;
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
                m["msg"] = this.nextMsgId;
                if (this.nextMsgId < 0x7FFFFFFF) {
                    ++this.nextMsgId;
                }
                else {
                    this.nextMsgId = 1;
                }
            }
            //      logger.fine("send: $m");
            let encoded = this.codec.encodeFrame(m);
            try {
                this.socket.send(encoded);
            }
            catch (e) {
                console.error('Unable to send on socket', e);
                this.close();
            }
            this._dataSent = true;
        }
    }
    _onDone(o) {
        if (o instanceof CloseEvent) {
            if (o.code === 1006) {
                this._authError = true;
            }
        }
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
    }
    close() {
        if (this.socket.readyState === WebSocket.OPEN ||
            this.socket.readyState === WebSocket.CONNECTING) {
            this.socket.close();
        }
        this._onDone();
    }
}
//# sourceMappingURL=browser_ws_conn.js.map
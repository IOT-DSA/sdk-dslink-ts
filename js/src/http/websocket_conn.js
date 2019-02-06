import WebSocket from "ws";
import { Connection } from "../common/interfaces";
import { PassiveChannel } from "../common/connection_channel";
import { Completer } from "../utils/async";
export class WebSocketConnection extends Connection {
    /// clientLink is not needed when websocket works in server link
    // WebSocketConnection(socket:WebSocket,
    //     options:{clientLink, boolean enableTimeout: false, boolean enableAck: true, DsCodec useCodec}) {
    //   this.socket=socket;
    constructor(socket, clientLink, onConnect, useCodec) {
        super();
        this._onRequestReadyCompleter = new Completer();
        this._onDisconnectedCompleter = new Completer();
        this._onDoneHandled = false;
        /// set to true when data is sent, reset the flag every 20 seconds
        /// since the previous ping message will cause the next 20 seoncd to have a message
        /// max interval between 2 ping messages is 40 seconds
        this._dataSent = false;
        /// add this count every 20 seconds, set to 0 when receiving data
        /// when the count is 3, disconnect the link (>=60 seconds)
        this._dataReceiveCount = 0;
        /// when nextMsgId = -1, ack is disabled
        this.nextMsgId = 1;
        this._sending = false;
        this.printDisconnectedMessage = true;
        this.socket = socket;
        this.clientLink = clientLink;
        this.onConnect = onConnect;
        if (useCodec != null) {
            this.codec = useCodec;
        }
        this._responderChannel = new PassiveChannel(this);
        this._requesterChannel = new PassiveChannel(this);
        socket.listen(onData, onDone, _onDone, onError, (err) => // logger.warning(
         formatLogMessage('Error listening to socket'), err);
        ;
        socket.add(codec.blankData);
        if (!enableAck) {
            nextMsgId = -1;
        }
        if (enableTimeout) {
            pingTimer = new Timer.periodic();
            const Duration;
            (seconds) => , onPingTimer;
            ;
        }
        // TODO(rinick): when it's used in client link, wait for the server to send {allowed} before complete this
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
    onPingTimer(t) {
        if (this._dataReceiveCount >= 3) {
            //      logger.finest('close stale connection');
            this.close();
            return;
        }
        _dataReceiveCount++;
        if (this._dataSent) {
            _dataSent = false;
            return;
        }
        this.addConnCommand(null, null);
    }
    requireSend() {
        if (!_sending) {
            _sending = true;
            DsTimer.callLater(this._send);
        }
    }
    /// add server command, will be called only when used as server connection
    addConnCommand(key, value) {
        if (this._serverCommand == null) {
            _serverCommand = {};
        }
        if (key != null) {
            _serverCommand[key] = value;
        }
        requireSend();
    }
    onData(dynamic, data) {
        if (throughputEnabled) {
            frameIn++;
        }
        if (this._onDisconnectedCompleter.isCompleted) {
            return;
        }
        if (!onRequestReadyCompleter.isCompleted) {
            onRequestReadyCompleter.complete(this._requesterChannel);
        }
        _dataReceiveCount = 0;
        object;
        m;
        if (data)
            is;
        int[];
        {
            try {
                m = codec.decodeBinaryFrame(data);
                if (logger.isLoggable(Level.FINEST)) {
                    //          logger.finest(formatLogMessage("receive: ${m}"));
                }
            }
            catch (err) { }
            stack;
            {
                //        logger.fine(
                formatLogMessage("Failed to decode binary data in WebSocket Connection"),
                    err,
                    stack;
                ;
                close();
                return;
            }
            if (throughputEnabled) {
                dataIn += data.length;
            }
            data = null;
            let needAck = false;
            if (Array.isArray(m["responses"]) && m["responses"].length > 0) {
                needAck = true;
                // send responses to requester channel
                _requesterChannel.onReceiveController.add(m["responses"]);
                if (throughputEnabled) {
                    messageIn += m["responses"].length;
                }
            }
            if (Array.isArray(m["requests"]) && m["requests"].length > 0) {
                needAck = true;
                // send requests to responder channel
                _responderChannel.onReceiveController.add(m["requests"]);
                if (throughputEnabled) {
                    messageIn += m["requests"].length;
                }
            }
            if (m["ack"])
                is;
            int;
            {
                ack(m["ack"]);
            }
            if (needAck) {
                let msgId = m["msg"];
                if (msgId != null) {
                    addConnCommand("ack", msgId);
                }
            }
        }
        if (typeof data === 'string') {
            try {
                m = codec.decodeStringFrame(data);
                if (logger.isLoggable(Level.FINEST)) {
                    //          logger.finest(formatLogMessage("receive: ${m}"));
                }
            }
            catch (err) { }
            stack;
            {
                console.error(formatLogMessage("Failed to decode string data from WebSocket Connection"), err, stack);
                close();
                return;
            }
            if (throughputEnabled) {
                dataIn += data.length;
            }
            if (typeof m["salt"] === 'string' && clientLink != null) {
                clientLink.updateSalt(m["salt"]);
            }
            let needAck = false;
            if (Array.isArray(m["responses"]) && m["responses"].length > 0) {
                needAck = true;
                // send responses to requester channel
                _requesterChannel.onReceiveController.add(m["responses"]);
                if (throughputEnabled) {
                    for (object; resp; of)
                        m["responses"];
                    {
                        if (Array.isArray(resp["updates"])) {
                            let len = resp["updates"].length;
                            if (len > 0) {
                                messageIn += len;
                            }
                            else {
                                messageIn += 1;
                            }
                        }
                        else {
                            messageIn += 1;
                        }
                    }
                }
            }
            if (Array.isArray(m["requests"]) && m["requests"].length > 0) {
                needAck = true;
                // send requests to responder channel
                _responderChannel.onReceiveController.add(m["requests"]);
                if (throughputEnabled) {
                    messageIn += m["requests"].length;
                }
            }
            if (m["ack"])
                is;
            int;
            {
                ack(m["ack"]);
            }
            if (needAck) {
                let msgId = m["msg"];
                if (msgId != null) {
                    addConnCommand("ack", msgId);
                }
            }
        }
    }
    _send() {
        if (!_sending) {
            return;
        }
        _sending = false;
        needSend: boolean = false;
        object;
        m;
        if (this._serverCommand != null) {
            m = this._serverCommand;
            _serverCommand = null;
            needSend = true;
        }
        else {
            m = {};
        }
        var pendingAck = [];
        ts: number = (new DateTime.now()).millisecondsSinceEpoch;
        rslt: ProcessorResult = this._responderChannel.getSendingData(ts, nextMsgId);
        if (rslt != null) {
            if (rslt.messages.length > 0) {
                m["responses"] = rslt.messages;
                needSend = true;
                if (throughputEnabled) {
                    for (object; resp; of)
                        rslt.messages;
                    {
                        if (Array.isArray(resp["updates"])) {
                            let len = resp["updates"].length;
                            if (len > 0) {
                                messageOut += len;
                            }
                            else {
                                messageOut += 1;
                            }
                        }
                        else {
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
                }
                else {
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
    addData(object, m) {
        encoded: object = codec.encodeFrame(m);
        if (logger.isLoggable(Level.FINEST)) {
            //      logger.finest(formatLogMessage("send: $m"));
        }
        if (throughputEnabled) {
            if (typeof encoded === 'string') {
                dataOut += encoded.length;
            }
            else if (encoded)
                is;
            int[];
            {
                dataOut += encoded.length;
            }
            {
                //        logger.warning(formatLogMessage("invalid data frame"));
            }
        }
        try {
            socket.add(encoded);
        }
        catch (e) {
            console.error(formatLogMessage('Error writing to socket'), e);
            close();
        }
    }
    _onDone() {
        if (this._onDoneHandled) {
            return;
        }
        _onDoneHandled = true;
        if (printDisconnectedMessage) {
            //      logger.info(formatLogMessage("Disconnected"));
        }
        if (!_requesterChannel.onReceiveController.isClosed) {
            _requesterChannel.onReceiveController.close();
        }
        if (!_requesterChannel.onDisconnectController.isCompleted) {
            _requesterChannel.onDisconnectController.complete(this._requesterChannel);
        }
        if (!_responderChannel.onReceiveController.isClosed) {
            _responderChannel.onReceiveController.close();
        }
        if (!_responderChannel.onDisconnectController.isCompleted) {
            _responderChannel.onDisconnectController.complete(this._responderChannel);
        }
        if (!_onDisconnectedCompleter.isCompleted) {
            _onDisconnectedCompleter.complete(false);
        }
        if (pingTimer != null) {
            pingTimer.cancel();
        }
        _sending = false;
    }
    formatLogMessage(msg) {
        if (clientLink != null) {
            return clientLink.formatLogMessage(msg);
        }
        if (logName != null) {
            return "[${logName}] ${msg}";
        }
        return msg;
    }
    close() {
        if (socket.readyState == WebSocket.OPEN ||
            socket.readyState == WebSocket.CONNECTING) {
            socket.close();
        }
        _onDone();
    }
}
WebSocketConnection.throughputEnabled = false;
WebSocketConnection.dataIn = 0;
WebSocketConnection.messageIn = 0;
WebSocketConnection.dataOut = 0;
WebSocketConnection.messageOut = 0;
WebSocketConnection.frameIn = 0;
WebSocketConnection.frameOut = 0;
//# sourceMappingURL=websocket_conn.js.map
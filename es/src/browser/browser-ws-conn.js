import { Connection, ConnectionAckGroup } from '../common/interfaces';
import { PassiveChannel } from '../common/connection-channel';
import { Completer } from '../utils/async';
import { DsJson } from '../utils/codec';
import { logger as mainLogger } from '../utils/logger';
import { endBatchUpdate, startBatchUpdate } from './batch-update';
let logger = mainLogger.tag('ws');
export class WebSocketConnection extends Connection {
    /// clientLink is not needed when websocket works in server link
    constructor(socket, clientLink, onConnect, useCodec) {
        super();
        this._onRequestReadyCompleter = new Completer();
        this._onDisconnectedCompleter = new Completer();
        this._onDoneHandled = false;
        this._dataReceiveTs = new Date().getTime();
        this._dataSentTs = this._dataReceiveTs;
        this.onPingTimer = () => {
            let currentTs = new Date().getTime();
            if (currentTs - this._dataReceiveTs >= 65000) {
                // close the connection if no message received in the last 65 seconds
                close();
                return;
            }
            if (currentTs - this._dataSentTs > 21000) {
                // add message if no data was sent in the last 21 seconds
                this.addConnCommand(null, null);
            }
        };
        this._openTs = Infinity;
        this._onOpen = (e) => {
            logger.trace('Connected');
            this._openTs = new Date().getTime();
            if (this.onConnect != null) {
                this.onConnect();
            }
            this._responderChannel.updateConnect();
            this._requesterChannel.updateConnect();
            this.socket.send(this.codec.blankData);
            this.requireSend();
        };
        this._onData = (e) => {
            if (this._onDisconnectedCompleter.isCompleted) {
                return;
            }
            if (!this._onRequestReadyCompleter.isCompleted) {
                this._onRequestReadyCompleter.complete(this._requesterChannel);
            }
            this._dataReceiveTs = new Date().getTime();
            let m;
            startBatchUpdate();
            if (e.data instanceof ArrayBuffer) {
                try {
                    let bytes = new Uint8Array(e.data);
                    m = this.codec.decodeBinaryFrame(bytes);
                    logger.trace(() => 'receive' + DsJson.encode(m));
                    this.checkBrowserThrottling();
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
                        let msgId = m['msg'];
                        if (msgId != null) {
                            this.addConnCommand('ack', msgId);
                        }
                    }
                }
                catch (err) {
                    console.error('error in onData', err);
                    this.close();
                    return;
                }
                finally {
                    endBatchUpdate();
                }
            }
            else if (typeof e.data === 'string') {
                try {
                    m = this.codec.decodeStringFrame(e.data);
                    logger.trace(() => 'receive' + DsJson.encode(m));
                    this.checkBrowserThrottling();
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
                        let msgId = m['msg'];
                        if (msgId != null) {
                            this.addConnCommand('ack', msgId);
                        }
                    }
                }
                catch (err) {
                    console.error(err);
                    this.close();
                    return;
                }
                finally {
                    endBatchUpdate();
                }
            }
        };
        this.nextMsgId = 1;
        this._sending = false;
        this._authError = false;
        this._onDone = (o) => {
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
    requireSend() {
        if (!this._sending) {
            this._sending = true;
            setTimeout(() => {
                this._send();
            }, 0);
        }
    }
    // sometimes setTimeout and setInterval is not run due to browser throttling
    checkBrowserThrottling() {
        if (!WebSocketConnection.checkBrowserThrottling) {
            return;
        }
        let currentTs = new Date().getTime();
        if (currentTs - this._dataSentTs > 25000) {
            logger.trace('Throttling detected');
            // timer is supposed to be run every 20 seconds, if that passes 25 seconds, force it to run
            this.onPingTimer();
            if (this._sending) {
                this._send();
            }
        }
    }
    get openTs() {
        return this._openTs;
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
        let ts = new Date().getTime();
        let rslt = this._responderChannel.getSendingData(ts, this.nextMsgId);
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
                }
                else {
                    this.nextMsgId = 1;
                }
            }
            logger.trace(() => 'send' + DsJson.encode(m));
            let encoded = this.codec.encodeFrame(m);
            try {
                this.socket.send(encoded);
            }
            catch (e) {
                console.error('Unable to send on socket', e);
                this.close();
            }
            this._dataSentTs = new Date().getTime();
        }
    }
    close() {
        if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
            this.socket.close();
        }
        this._onDone();
    }
}
WebSocketConnection.checkBrowserThrottling = true;
//# sourceMappingURL=browser-ws-conn.js.map
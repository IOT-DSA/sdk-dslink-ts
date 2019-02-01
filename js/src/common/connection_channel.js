import { Completer, Stream } from "../utils/async";
export class PassiveChannel {
    constructor(conn, connected = false) {
        this.onReceive = new Stream();
        this._processors = [];
        this._isReady = false;
        this.connected = true;
        this.onDisconnectController = new Completer();
        this.onConnectController = new Completer();
        this.conn = conn;
        this.connected = connected;
    }
    sendWhenReady(handler) {
        this.handler = handler;
        this.conn.requireSend();
    }
    getSendingData(currentTime, waitingAckId) {
        if (this.handler != null) {
            let rslt = this.handler.getSendingData(currentTime, waitingAckId);
            // handler = null;
            return rslt;
        }
        return null;
    }
    get isReady() {
        return this._isReady;
    }
    set isReady(val) {
        this._isReady = val;
    }
    get onDisconnected() {
        return this.onDisconnectController.future;
    }
    get onConnected() {
        return this.onConnectController.future;
    }
    updateConnect() {
        if (this.connected)
            return;
        this.connected = true;
        this.onConnectController.complete(this);
    }
}
//# sourceMappingURL=connection_channel.js.map
import { ProcessorResult } from "./interfaces";
export const ACK_WAIT_COUNT = 16;
export const defaultCacheSize = 256;
export class ConnectionHandler {
    constructor() {
        this._toSendList = [];
        this._processors = [];
        this._pendingSend = false;
    }
    get connection() {
        return this._conn;
    }
    set connection(conn) {
        if (this._connListener != null) {
            this._connListener.close();
            this._connListener = null;
            this._onDisconnected(this._conn);
        }
        this._conn = conn;
        this._connListener = this._conn.onReceive.listen(this.onData);
        this._conn.onDisconnected.then((conn) => this._onDisconnected(conn));
        // resend all requests after a connection
        if (this._conn.connected) {
            this.onReconnected();
        }
        else {
            this._conn.onConnected.then((conn) => this.onReconnected());
        }
    }
    _onDisconnected(conn) {
        if (this._conn === conn) {
            if (this._connListener != null) {
                this._connListener.close();
                this._connListener = null;
            }
            this.onDisconnected();
            this._conn = null;
        }
    }
    onReconnected() {
        if (this._pendingSend) {
            this._conn.sendWhenReady(this);
        }
    }
    addToSendList(m) {
        this._toSendList.push(m);
        if (!this._pendingSend) {
            if (this._conn != null) {
                this._conn.sendWhenReady(this);
            }
            this._pendingSend = true;
        }
    }
    /// a processor function that's called just before the data is sent
    /// same processor won't be added to the list twice
    /// inside processor, send() data that only need to appear once per data frame
    addProcessor(processor) {
        this._processors.push(processor);
        if (!this._pendingSend) {
            if (this._conn != null) {
                this._conn.sendWhenReady(this);
            }
            this._pendingSend = true;
        }
    }
    /// gather all the changes from
    getSendingData(currentTime, waitingAckId) {
        this._pendingSend = false;
        let processors = this._processors;
        this._processors = [];
        for (let proc of processors) {
            proc.startSendingData(currentTime, waitingAckId);
        }
        let rslt = this._toSendList;
        this._toSendList = [];
        return new ProcessorResult(rslt, processors);
    }
    clearProcessors() {
        this._processors.length = 0;
        this._pendingSend = false;
    }
}
//# sourceMappingURL=connection_handler.js.map
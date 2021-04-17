import { ProcessorResult } from './interfaces';
export const DSA_CONFIG = {
    ackWaitCount: 16,
    defaultCacheSize: 256
};
export class ConnectionHandler {
    constructor() {
        /** @ignore */
        this._toSendList = [];
        /** @ignore */
        this._processors = [];
        /** @ignore */
        this._pendingSend = false;
    }
    /** @ignore */
    get connection() {
        return this._conn;
    }
    /** @ignore */
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
    /** @ignore */
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
    /** @ignore */
    onReconnected() {
        if (this._pendingSend) {
            this._conn.sendWhenReady(this);
        }
    }
    /** @ignore */
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
    /** @ignore */
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
    /** @ignore */
    getSendingData(currentTime, waitingAckId) {
        this._pendingSend = false;
        let processors = this._processors;
        if (processors.length > 32) {
            processors = this._processors.slice(0, 32);
            this._processors = this._processors.slice(32);
            this._conn.sendWhenReady(this);
        }
        else {
            this._processors = [];
        }
        for (let proc of processors) {
            proc.startSendingData(currentTime, waitingAckId);
        }
        let rslt = this._toSendList;
        this._toSendList = [];
        return new ProcessorResult(rslt, processors);
    }
    /** @ignore */
    clearProcessors() {
        this._processors.length = 0;
        this._pendingSend = false;
    }
}
//# sourceMappingURL=connection-handler.js.map
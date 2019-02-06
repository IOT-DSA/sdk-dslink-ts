import { DSError, StreamStatus } from "../common/interfaces";
export class Request {
    constructor(requester, rid, updater, data) {
        this._isClosed = false;
        this.streamStatus = StreamStatus.initialize;
        this.requester = requester;
        this.rid = rid;
        this.updater = updater;
        this.data = data;
    }
    get isClosed() {
        return this._isClosed;
    }
    /// resend the data if previous sending failed
    resend() {
        this.requester.addToSendList(this.data);
    }
    addReqParams(m) {
        this.requester.addToSendList({ 'rid': this.rid, 'params': m });
    }
    _update(m) {
        if (typeof m["stream"] === 'string') {
            this.streamStatus = m["stream"];
        }
        let updates;
        let columns;
        let meta;
        if (Array.isArray(m["updates"])) {
            updates = m["updates"];
        }
        if (Array.isArray(m["columns"])) {
            columns = m["columns"];
        }
        if (m["meta"] instanceof Object) {
            meta = m["meta"];
        }
        // remove the request from global object
        if (this.streamStatus === StreamStatus.closed) {
            this.requester._requests.delete(this.rid);
        }
        let error;
        if (m.hasOwnProperty("error") && m["error"] instanceof Object) {
            error = DSError.fromMap(m["error"]);
            this.requester.onError.add(error);
        }
        this.updater.onUpdate(this.streamStatus, updates, columns, meta, error);
    }
    /// close the request and finish data
    _close(error) {
        if (this.streamStatus != StreamStatus.closed) {
            this.streamStatus = StreamStatus.closed;
            this.updater.onUpdate(StreamStatus.closed, null, null, null, error);
        }
    }
    /// close the request from the client side
    close() {
        // _close will also be called later from the requester;
        this.requester.closeRequest(this);
    }
}
//# sourceMappingURL=request.js.map
export class Response {
    constructor(responder, rid, type) {
        this._sentStreamStatus = 'initialize';
        this._pendingSending = false;
        this.responder = responder;
        this.rid = rid;
        this.type = type;
    }
    get sentStreamStatus() {
        return this._sentStreamStatus;
    }
    /// close the request from responder side and also notify the requester
    close(err = null) {
        this._sentStreamStatus = 'closed';
        this.responder.closeResponse(this.rid, this, err);
    }
    /// close the response now, no need to send more response update
    _close() { }
    prepareSending() {
        if (!this._pendingSending) {
            this._pendingSending = true;
            this.responder.addProcessor(this);
        }
    }
    startSendingData(currentTime, waitingAckId) {
        this._pendingSending = false;
    }
    ackReceived(receiveAckId, startTime, currentTime) {
        // TODO: implement ackReceived
    }
}
//# sourceMappingURL=response.js.map
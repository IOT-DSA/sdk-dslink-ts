"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("../response");
const connection_handler_1 = require("../../common/connection_handler");
const interfaces_1 = require("../../common/interfaces");
class ListResponse extends response_1.Response {
    constructor(responder, rid, state) {
        super(responder, rid, 'list');
        this.changes = new Set();
        this.initialResponse = true;
        this.changed = (key) => {
            if (key === null) {
                this.initialResponse = true;
            }
            else {
                this.changes.add(key);
            }
            if (!this._pendingSending) {
                this.prepareSending();
            }
        };
        this._waitingAckCount = 0;
        this._lastWatingAckId = -1;
        this._sendingAfterAck = false;
        this.state = state;
        state.listStream.listen(this.changed);
        if (state._node) {
            this.prepareSending();
        }
    }
    startSendingData(currentTime, waitingAckId) {
        this._pendingSending = false;
        let node = this.state._node;
        if (waitingAckId !== -1) {
            this._waitingAckCount++;
            this._lastWatingAckId = waitingAckId;
        }
        let updates = [];
        if (!node) {
            updates.push(['$disconnectedTs', this.state._disconnectedTs]);
        }
        else {
            let updateIs;
            let updateBase;
            let updateConfigs = [];
            let updateAttributes = [];
            let updateChildren = [];
            if (this.initialResponse || this.changes.has('$is')) {
                this.initialResponse = false;
                for (let [name, value] of node.configs) {
                    let update = [name, value];
                    if (name === '$is') {
                        updateIs = update;
                    }
                    else if (name === '$base') {
                        updateBase = update;
                    }
                    else {
                        updateConfigs.push(update);
                    }
                }
                for (let [name, value] of node.attributes) {
                    updateAttributes.push([name, value]);
                }
                for (let [name, value] of node.children) {
                    let simpleMap = value.getSimpleMap();
                    updateChildren.push([name, simpleMap]);
                }
                if (updateIs == null) {
                    updateIs = ['$is', 'node'];
                }
            }
            else {
                for (let change of this.changes) {
                    let update;
                    if (change.startsWith('$')) {
                        if (node.configs.has(change)) {
                            update = [change, node.configs.get(change)];
                        }
                        else {
                            update = { 'name': change, 'change': 'remove' };
                        }
                        updateConfigs.push(update);
                    }
                    else if (change.startsWith('@')) {
                        if (node.attributes.has(change)) {
                            update = [change, node.attributes.get(change)];
                        }
                        else {
                            update = { 'name': change, 'change': 'remove' };
                        }
                        updateAttributes.push(update);
                    }
                    else {
                        if (node.children.has(change)) {
                            let simpleMap = node.children.get(change).getSimpleMap();
                            update = [change, simpleMap];
                        }
                        else {
                            update = { 'name': change, 'change': 'remove' };
                        }
                        updateChildren.push(update);
                    }
                }
            }
            if (updateBase != null) {
                updates.push(updateBase);
            }
            if (updateIs != null) {
                updates.push(updateIs);
            }
            updates = updates.concat(updateConfigs).concat(updateAttributes).concat(updateChildren);
        }
        this.changes.clear();
        this.responder.updateResponse(this, updates, { streamStatus: interfaces_1.StreamStatus.open });
    }
    ackReceived(receiveAckId, startTime, currentTime) {
        if (receiveAckId === this._lastWatingAckId) {
            this._waitingAckCount = 0;
        }
        else {
            this._waitingAckCount--;
        }
        if (this._sendingAfterAck) {
            this._sendingAfterAck = false;
            this.prepareSending();
        }
    }
    prepareSending() {
        if (this._sendingAfterAck) {
            return;
        }
        if (this._waitingAckCount > connection_handler_1.DSA_CONFIG.ackWaitCount) {
            this._sendingAfterAck = true;
            return;
        }
        if (!this._pendingSending) {
            this._pendingSending = true;
            this.responder.addProcessor(this);
        }
    }
    _close() {
        this.state.listStream.unlisten(this.changed);
    }
}
exports.ListResponse = ListResponse;
//# sourceMappingURL=list.js.map
"use strict";
// part of dslink.responder;
Object.defineProperty(exports, "__esModule", { value: true });
const value_1 = require("../../common/value");
const response_1 = require("../response");
const connection_handler_1 = require("../../common/connection_handler");
const Denque = require("denque");
class SubscribeResponse extends response_1.Response {
    constructor(responder, rid) {
        super(responder, rid, 'subscribe');
        this.subscriptions = new Map();
        this.subsriptionids = new Map();
        this.changed = new Set();
        this._waitingAckCount = 0;
        this._lastWaitingAckId = -1;
        this._sendingAfterAck = false;
    }
    add(path, node, sid, qos) {
        let subscriber;
        if (this.subscriptions.get(path) != null) {
            subscriber = this.subscriptions.get(path);
            if (subscriber.sid !== sid) {
                if (subscriber.sid >= 0) {
                    this.subsriptionids.delete(subscriber.sid);
                }
                subscriber.sid = sid;
                if (sid >= 0) {
                    this.subsriptionids.set(sid, subscriber);
                }
            }
            subscriber.qosLevel = qos;
            if (sid > -1 && subscriber.lastValue != null) {
                this.subscriptionChanged(subscriber);
            }
        }
        else {
            subscriber = new ValueSubscriber(this, node, sid, qos);
            this.subscriptions.set(path, subscriber);
            if (sid >= 0) {
                this.subsriptionids.set(sid, subscriber);
            }
        }
        return subscriber;
    }
    remove(sid) {
        if (this.subsriptionids.get(sid) != null) {
            let subscriber = this.subsriptionids.get(sid);
            this.subsriptionids.get(sid).destroy();
            this.subsriptionids.delete(sid);
            this.subscriptions.delete(subscriber.node.path);
            if (this.subsriptionids.size === 0) {
                this._waitingAckCount = 0;
            }
        }
    }
    subscriptionChanged(subscriber) {
        this.changed.add(subscriber);
        this.prepareSending();
    }
    startSendingData(currentTime, waitingAckId) {
        this._pendingSending = false;
        if (waitingAckId !== -1) {
            this._waitingAckCount++;
            this._lastWaitingAckId = waitingAckId;
        }
        let updates = [];
        for (let subscriber of this.changed) {
            updates = updates.concat(subscriber.process(waitingAckId));
        }
        this.responder.updateResponse(this, updates);
        this.changed.clear();
    }
    ackReceived(receiveAckId, startTime, currentTime) {
        if (receiveAckId === this._lastWaitingAckId) {
            this._waitingAckCount = 0;
        }
        else {
            this._waitingAckCount--;
        }
        for (let [path, subscriber] of this.subscriptions) {
            if (subscriber._qosLevel > 0) {
                subscriber.onAck(receiveAckId);
            }
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
        if (this.responder.connection == null) {
            // don't pend send, when requester is offline
            return;
        }
        if (!this._pendingSending) {
            this._pendingSending = true;
            this.responder.addProcessor(this);
        }
    }
    _close() {
        let pendingControllers;
        for (let [path, subscriber] of this.subscriptions) {
            if (subscriber._qosLevel < 2) {
                subscriber.destroy();
            }
            else {
                subscriber.sid = -1;
                if (pendingControllers == null) {
                    pendingControllers = [];
                }
                pendingControllers.push(subscriber);
            }
        }
        this.subscriptions.clear();
        if (pendingControllers != null) {
            for (let subscriber of pendingControllers) {
                this.subscriptions.set(subscriber.node.path, subscriber);
            }
        }
        this.subsriptionids.clear();
        this._waitingAckCount = 0;
        this._lastWaitingAckId = -1;
        this._sendingAfterAck = false;
        this._pendingSending = false;
    }
}
exports.SubscribeResponse = SubscribeResponse;
class ValueSubscriber {
    constructor(response, node, sid, qos) {
        this.lastValues = [];
        this._qosLevel = -1;
        this._caching = false;
        this.cachingQueue = false;
        this._persist = false;
        this._isCacheValid = true;
        this.response = response;
        this.node = node;
        this.sid = sid;
        this.qosLevel = qos;
        node.setSubscriber(this);
        if (node.lastValueUpdate) {
            this.addValue(node.lastValueUpdate);
        }
    }
    set qosLevel(v) {
        if (v < 0 || v > 3)
            v = 0;
        if (this._qosLevel === v) {
            return;
        }
        this._qosLevel = v;
        if (this.waitingValues == null && this._qosLevel > 0) {
            this.waitingValues = new Denque();
        }
        this.caching = (v > 0);
        this.cachingQueue = (v > 1);
        this.persist = (v > 2);
    }
    set caching(val) {
        if (val === this._caching)
            return;
        this._caching = val;
        if (!this._caching) {
            this.lastValues.length = 0;
        }
    }
    set persist(val) {
        if (val === this._persist)
            return;
        this._persist = val;
        // TODO implement qos storage
        if (this._persist) {
            // this._storage = storageM.getOrCreateValue(node.path);
        }
        else if (this._storage != null) {
            // storageM.destroyValue(node.path);
            this._storage = null;
        }
    }
    addValue(val) {
        val = val.cloneForAckQueue();
        if (this._caching && this._isCacheValid) {
            this.lastValues.push(val);
            let needClearQueue = (this.lastValues.length > connection_handler_1.DSA_CONFIG.defaultCacheSize);
            if (!needClearQueue && !this.cachingQueue && this.response._sendingAfterAck && this.lastValues.length > 1) {
                needClearQueue = true;
            }
            if (needClearQueue) {
                // cache is no longer valid, fallback to rollup mode
                this._isCacheValid = false;
                this.lastValue = new value_1.ValueUpdate(null, '');
                for (let update of this.lastValues) {
                    this.lastValue.mergeAdd(update);
                }
                this.lastValues.length = 0;
                if (this._qosLevel > 0) {
                    if (this._storage) {
                        // this._storage.setValue(waitingValues, lastValue);
                    }
                    this.waitingValues.clear();
                    this.waitingValues.push(this.lastValue);
                }
            }
            else {
                this.lastValue = val;
                if (this._qosLevel > 0) {
                    this.waitingValues.push(this.lastValue);
                    if (this._storage) {
                        // _storage.addValue(lastValue);
                    }
                }
            }
        }
        else {
            if (this.lastValue) {
                this.lastValue = value_1.ValueUpdate.merge(this.lastValue, val);
            }
            else {
                this.lastValue = val;
            }
            if (this._qosLevel > 0) {
                if (this._storage) {
                    // _storage.setValue(waitingValues, lastValue);
                }
                this.waitingValues.clear();
                this.waitingValues.push(this.lastValue);
            }
        }
        // TODO, don't allow this to be called from same subscriber more often than 100ms
        // the first response can happen ASAP, but
        if (this.sid > -1) {
            this.response.subscriptionChanged(this);
        }
    }
    process(waitingAckId) {
        let rslts = [];
        if (this._caching && this._isCacheValid) {
            for (let lastValue of this.lastValues) {
                rslts.push([this.sid, lastValue.value, lastValue.ts]);
            }
            if (this._qosLevel > 0) {
                for (let update of this.lastValues) {
                    update.waitingAck = waitingAckId;
                }
            }
            this.lastValues.length = 0;
        }
        else {
            if (this.lastValue.count > 1 || this.lastValue.status) {
                let m = this.lastValue.toMap();
                m['sid'] = this.sid;
                rslts.push(m);
            }
            else {
                rslts.push([this.sid, this.lastValue.value, this.lastValue.ts]);
            }
            if (this._qosLevel > 0) {
                this.lastValue.waitingAck = waitingAckId;
            }
            this._isCacheValid = true;
        }
        this.lastValue = null;
        return rslts;
    }
    onAck(ackId) {
        if (this.waitingValues.length === 0) {
            return;
        }
        let valueRemoved = false;
        if (!this.waitingValues.isEmpty && this.waitingValues.peekFront().waitingAck !== ackId) {
            let matchUpdate;
            let waitingLen = this.waitingValues.length;
            for (let i = 0; i < waitingLen; ++i) {
                let update = this.waitingValues.peekAt(i);
                if (update.waitingAck === ackId) {
                    matchUpdate = update;
                    break;
                }
            }
            if (matchUpdate != null) {
                while (!this.waitingValues.isEmpty && this.waitingValues.peekFront() !== matchUpdate) {
                    let removed = this.waitingValues.shift();
                    if (this._storage != null) {
                        // _storage.removeValue(removed);
                        // valueRemoved = true;
                    }
                }
            }
        }
        while (!this.waitingValues.isEmpty && this.waitingValues.peekFront().waitingAck === ackId) {
            let removed = this.waitingValues.shift();
            if (this._storage != null) {
                // _storage.removeValue(removed);
                // valueRemoved = true;
            }
        }
        // if (valueRemoved && this._storage != null) {
        //   _storage.valueRemoved(this.waitingValues);
        // }
    }
    resetCache(values) {
        if (this._caching) {
            if (this.lastValues.length > 0 && this.lastValues[0].equals(values[values.length - 1])) {
                this.lastValues.shift();
            }
            this.lastValues = values.concat(this.lastValues);
            if (this.waitingValues != null) {
                this.waitingValues.clear();
                for (let value of this.lastValues) {
                    this.waitingValues.push(value);
                }
            }
        }
        else {
            this.lastValues.length = 0;
            if (this.waitingValues != null) {
                this.waitingValues.clear();
                this.waitingValues.push(values[values.length - 1]);
            }
        }
        this.lastValue = values[values.length - 1];
    }
    destroy() {
        if (this._storage) {
            // let storageM: ISubscriptionResponderStorage = response.responder.storage;
            // storageM.destroyValue(node.path);
            // _storage = null;
        }
        this.node.setSubscriber(null);
    }
}
exports.ValueSubscriber = ValueSubscriber;
//# sourceMappingURL=subscribe.js.map
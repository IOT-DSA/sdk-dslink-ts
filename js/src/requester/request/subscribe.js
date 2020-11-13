"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReqSubscribeController = exports.SubscribeRequest = exports.SubscribeController = exports.ReqSubscribeListener = void 0;
const request_1 = require("../request");
const value_1 = require("../../common/value");
const connection_handler_1 = require("../../common/connection-handler");
const UNSUBSCRIBE_DELAY_MS = 3000;
class ReqSubscribeListener {
    /** @ignore */
    constructor(requester, path, callback, qos, timeout) {
        this.requester = requester;
        this.path = path;
        this.callback = callback;
        this.callbackWrapper = (value) => {
            var _a;
            if (this.timeout) {
                clearTimeout(this.timeout);
                this.timeout = null;
            }
            (_a = this.callback) === null || _a === void 0 ? void 0 : _a.call(this, value);
        };
        this.onTimeOut = () => {
            this.timeout = null;
            this.callbackWrapper(new value_1.ValueUpdate(null, null, { status: 'unknown' }));
        };
        let node = requester.nodeCache.getRemoteNode(path);
        if (timeout) {
            this.timeout = setTimeout(this.onTimeOut, timeout);
        }
        node._subscribe(requester, this.callbackWrapper, qos);
    }
    close() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.callback = null;
        setTimeout(() => {
            this.requester.unsubscribe(this.path, this.callbackWrapper);
        }, UNSUBSCRIBE_DELAY_MS);
    }
}
exports.ReqSubscribeListener = ReqSubscribeListener;
/// only a place holder for reconnect and disconnect
/// real logic is in SubscribeRequest itself
/** @ignore */
class SubscribeController {
    onDisconnect() {
        // TODO: implement onDisconnect
    }
    onReconnect() {
        // TODO: implement onReconnect
    }
    onUpdate(status, updates, columns, meta, error) {
        // do nothing
    }
}
exports.SubscribeController = SubscribeController;
/** @ignore */
class SubscribeRequest extends request_1.Request {
    constructor(requester, rid) {
        super(requester, rid, new SubscribeController(), null);
        this.lastSid = 0;
        this.subscriptions = new Map();
        this.subscriptionIds = new Map();
        this._changedPaths = new Set();
        this.toRemove = new Map();
        this._pendingSending = false;
        this._waitingAckCount = 0;
        this._lastWatingAckId = -1;
        this._sendingAfterAck = false;
        this.updater.request = this;
    }
    getNextSid() {
        do {
            if (this.lastSid < 0x7fffffff) {
                ++this.lastSid;
            }
            else {
                this.lastSid = 1;
            }
        } while (this.subscriptionIds.has(this.lastSid));
        return this.lastSid;
    }
    resend() {
        this.prepareSending();
    }
    _close(error) {
        if (this.subscriptions.size > 0) {
            for (let [key, s] of this.subscriptions) {
                this._changedPaths.add(key);
            }
        }
        this._waitingAckCount = 0;
        this._lastWatingAckId = -1;
        this._sendingAfterAck = false;
    }
    _update(m) {
        let updates = m['updates'];
        if (Array.isArray(updates)) {
            for (let update of updates) {
                let path;
                let sid = -1;
                let value;
                let ts;
                let options;
                if (Array.isArray(update) && update.length > 2) {
                    if (typeof update[0] === 'string') {
                        path = update[0];
                    }
                    else if (typeof update[0] === 'number') {
                        sid = update[0];
                    }
                    else {
                        continue; // invalid response
                    }
                    value = update[1];
                    ts = update[2];
                }
                else if (update != null && update instanceof Object) {
                    if (typeof update['ts'] === 'string') {
                        path = update['path'];
                        ts = update['ts'];
                        if (typeof update['path'] === 'string') {
                            path = update['path'];
                        }
                        else if (typeof update['sid'] === 'number') {
                            sid = update['sid'];
                        }
                        else {
                            continue; // invalid response
                        }
                    }
                    value = update['value'];
                    options = update;
                }
                else {
                    continue; // invalid response
                }
                let controller;
                if (path != null) {
                    controller = this.subscriptions.get(path);
                }
                else if (sid > -1) {
                    controller = this.subscriptionIds.get(sid);
                }
                if (controller != null) {
                    let valueUpdate = new value_1.ValueUpdate(value, ts, options);
                    controller.addValue(valueUpdate);
                }
            }
        }
    }
    addSubscription(controller, level) {
        let path = controller.node.remotePath;
        this.subscriptions.set(path, controller);
        this.subscriptionIds.set(controller.sid, controller);
        this.prepareSending();
        this._changedPaths.add(path);
    }
    removeSubscription(controller) {
        let path = controller.node.remotePath;
        if (this.subscriptions.has(path)) {
            this.toRemove.set(this.subscriptions.get(path).sid, this.subscriptions.get(path));
            this.prepareSending();
        }
        else if (this.subscriptionIds.has(controller.sid)) {
            console.error(`unexpected remoteSubscription in the requester, sid: ${controller.sid}`);
        }
    }
    startSendingData(currentTime, waitingAckId) {
        this._pendingSending = false;
        if (waitingAckId !== -1) {
            this._waitingAckCount++;
            this._lastWatingAckId = waitingAckId;
        }
        if (this.requester.connection == null) {
            return;
        }
        let toAdd = [];
        let processingPaths = this._changedPaths;
        if (processingPaths.size > 32) {
            processingPaths = new Set();
            let pendingPaths = new Set();
            let count = 0;
            for (let path of this._changedPaths) {
                if (++count > 32) {
                    pendingPaths.add(path);
                }
                else {
                    processingPaths.add(path);
                }
            }
            this._changedPaths = pendingPaths;
            this.prepareSending();
        }
        else {
            this._changedPaths = new Set();
        }
        for (let path of processingPaths) {
            if (this.subscriptions.has(path)) {
                let sub = this.subscriptions.get(path);
                let m = { path, sid: sub.sid };
                if (sub.currentQos > 0) {
                    m['qos'] = sub.currentQos;
                }
                toAdd.push(m);
            }
        }
        if (toAdd.length > 0) {
            this.requester._sendRequest({ method: 'subscribe', paths: toAdd }, null);
        }
        if (this.toRemove.size > 0) {
            let removeSids = [];
            for (let [sid, sub] of this.toRemove) {
                if (removeSids.length >= 32) {
                    this.prepareSending();
                    break;
                }
                if (sub.callbacks.size === 0) {
                    removeSids.push(sid);
                    this.subscriptions.delete(sub.node.remotePath);
                    this.subscriptionIds.delete(sub.sid);
                    sub._destroy();
                }
                this.toRemove.delete(sid);
            }
            this.requester._sendRequest({ method: 'unsubscribe', sids: removeSids }, null);
        }
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
            this.requester.addProcessor(this);
        }
    }
}
exports.SubscribeRequest = SubscribeRequest;
/** @ignore */
class ReqSubscribeController {
    constructor(node, requester) {
        this.callbacks = new Map();
        this.currentQos = -1;
        this.node = node;
        this.requester = requester;
        this.sid = requester._subscription.getNextSid();
    }
    listen(callback, qos) {
        if (qos < 0 || qos > 3) {
            qos = 0;
        }
        let qosChanged = false;
        if (this.callbacks.has(callback)) {
            this.callbacks.set(callback, qos);
            qosChanged = this.updateQos();
        }
        else {
            this.callbacks.set(callback, qos);
            if (qos > this.currentQos) {
                qosChanged = true;
                this.currentQos = qos;
            }
            if (this._lastUpdate != null) {
                setTimeout(() => {
                    if (this.callbacks.has(callback) && this._lastUpdate != null) {
                        callback(this._lastUpdate);
                    }
                }, 0);
            }
        }
        if (qosChanged) {
            this.requester._subscription.addSubscription(this, this.currentQos);
        }
    }
    unlisten(callback) {
        if (this.callbacks.has(callback)) {
            let cacheLevel = this.callbacks.get(callback);
            this.callbacks.delete(callback);
            if (this.callbacks.size === 0) {
                this.requester._subscription.removeSubscription(this);
            }
            else if (cacheLevel === this.currentQos && this.currentQos > 1) {
                this.updateQos();
            }
        }
    }
    updateQos() {
        let maxQos = 0;
        for (let qos of this.callbacks.values()) {
            maxQos = qos > maxQos ? qos : maxQos;
        }
        if (maxQos !== this.currentQos) {
            this.currentQos = maxQos;
            return true;
        }
        return false;
    }
    addValue(update) {
        this._lastUpdate = update;
        for (let callback of Array.from(this.callbacks.keys())) {
            callback(this._lastUpdate);
        }
    }
    _destroy() {
        this.callbacks.clear();
        this.node._subscribeController = null;
    }
}
exports.ReqSubscribeController = ReqSubscribeController;
//# sourceMappingURL=subscribe.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async_1 = require("../utils/async");
const request_1 = require("./request");
const connection_handler_1 = require("../common/connection_handler");
const node_cache_1 = require("./node_cache");
const subscribe_1 = require("./request/subscribe");
const interfaces_1 = require("../common/interfaces");
const list_1 = require("./request/list");
const permission_1 = require("../common/permission");
const set_1 = require("./request/set");
const remove_1 = require("./request/remove");
class Requester extends connection_handler_1.ConnectionHandler {
    constructor(cache) {
        super();
        this._requests = new Map();
        this.onData = (list) => {
            if (Array.isArray(list)) {
                for (let resp of list) {
                    if ((resp != null && resp instanceof Object)) {
                        this._onReceiveUpdate(resp);
                    }
                }
            }
        };
        this.onError = new async_1.Stream();
        this.lastRid = 0;
        this._connected = false;
        this.nodeCache = cache ? cache : new node_cache_1.RemoteNodeCache();
        this._subscription = new subscribe_1.SubscribeRequest(this, 0);
        this._requests.set(0, this._subscription);
    }
    get subscriptionCount() {
        return this._subscription.subscriptions.size;
    }
    get openRequestCount() {
        return this._requests.size;
    }
    _onReceiveUpdate(m) {
        if (typeof m['rid'] === 'number' && this._requests.has(m['rid'])) {
            this._requests.get(m['rid'])._update(m);
        }
    }
    getNextRid() {
        do {
            if (this.lastRid < 0x7FFFFFFF) {
                ++this.lastRid;
            }
            else {
                this.lastRid = 1;
            }
        } while (this._requests.has(this.lastRid));
        return this.lastRid;
    }
    getSendingData(currentTime, waitingAckId) {
        let rslt = super.getSendingData(currentTime, waitingAckId);
        return rslt;
    }
    sendRequest(m, updater) {
        return this._sendRequest(m, updater);
    }
    _sendRequest(m, updater) {
        m['rid'] = this.getNextRid();
        let req;
        if (updater != null) {
            req = new request_1.Request(this, this.lastRid, updater, m);
            this._requests.set(this.lastRid, req);
        }
        if (this._conn) {
            this.addToSendList(m);
        }
        return req;
    }
    isNodeCached(path) {
        return this.nodeCache.isNodeCached(path);
    }
    subscribe(path, callback, qos = 0) {
        let node = this.nodeCache.getRemoteNode(path);
        node._subscribe(this, callback, qos);
        return new subscribe_1.ReqSubscribeListener(this, path, callback);
    }
    unsubscribe(path, callback) {
        let node = this.nodeCache.getRemoteNode(path);
        node._unsubscribe(this, callback);
    }
    onValueChange(path, qos = 0) {
        let listener;
        let stream;
        stream = new async_1.Stream(() => {
            if (listener == null) {
                listener = this.subscribe(path, (update) => {
                    stream.add(update);
                }, qos);
            }
        }, () => {
            if (listener) {
                listener.close();
                listener = null;
            }
        });
        return stream;
    }
    getNodeValue(path, timeoutMs = 0) {
        return new Promise((resolve, reject) => {
            let listener;
            let timer;
            listener = this.subscribe(path, (update) => {
                resolve(update);
                if (listener != null) {
                    listener.close();
                    listener = null;
                }
                if (timer) {
                    clearTimeout(timer);
                    timer = null;
                }
            });
            if (timeoutMs > 0) {
                timer = setTimeout(() => {
                    timer = null;
                    if (listener) {
                        listener.close();
                        listener = null;
                    }
                    reject(new Error(`failed to receive value, timeout: ${timeoutMs}ms`));
                }, timeoutMs);
            }
        });
    }
    getRemoteNode(path) {
        return new Promise((resolve, reject) => {
            let sub = this.list(path, (update) => {
                resolve(update.node);
                if (sub != null) {
                    sub.close();
                }
            });
        });
    }
    list(path, callback) {
        let node = this.nodeCache.getRemoteNode(path);
        return node._list(this).listen(callback);
    }
    invoke(path, params = {}, callback, maxPermission = permission_1.Permission.CONFIG) {
        let node = this.nodeCache.getRemoteNode(path);
        let stream = node._invoke(params, this, maxPermission);
        if (callback) {
            stream.listen(callback);
        }
        return stream;
    }
    set(path, value, maxPermission = permission_1.Permission.CONFIG) {
        return new set_1.SetController(this, path, value, maxPermission).future;
    }
    remove(path) {
        return new remove_1.RemoveController(this, path).future;
    }
    /// close the request from requester side and notify responder
    closeRequest(request) {
        if (this._requests.has(request.rid)) {
            if (request.streamStatus !== interfaces_1.StreamStatus.closed) {
                this.addToSendList({ 'method': 'close', 'rid': request.rid });
            }
            this._requests.delete(request.rid);
            request.close();
        }
    }
    onDisconnected() {
        if (!this._connected)
            return;
        this._connected = false;
        let newRequests = new Map();
        newRequests.set(0, this._subscription);
        for (let [n, req] of this._requests) {
            if (req.rid <= this.lastRid && !(req.updater instanceof list_1.ListController)) {
                req._close(interfaces_1.DSError.DISCONNECTED);
            }
            else {
                newRequests.set(req.rid, req);
                req.updater.onDisconnect();
            }
        }
        this._requests = newRequests;
    }
    onReconnected() {
        if (this._connected)
            return;
        this._connected = true;
        super.onReconnected();
        for (let [n, req] of this._requests) {
            req.updater.onReconnect();
            req.resend();
        }
    }
}
exports.Requester = Requester;
//# sourceMappingURL=requester.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async_1 = require("../utils/async");
const request_1 = require("./request");
const connection_handler_1 = require("../common/connection-handler");
const node_cache_1 = require("./node_cache");
const subscribe_1 = require("./request/subscribe");
const interfaces_1 = require("../common/interfaces");
const list_1 = require("./request/list");
const permission_1 = require("../common/permission");
const invoke_1 = require("./request/invoke");
const set_1 = require("./request/set");
const remove_1 = require("./request/remove");
class Requester extends connection_handler_1.ConnectionHandler {
    constructor(cache) {
        super();
        /** @ignore */
        this._requests = new Map();
        /** @ignore */
        this.onData = (list) => {
            if (Array.isArray(list)) {
                for (let resp of list) {
                    if (resp != null && resp instanceof Object) {
                        this._onReceiveUpdate(resp);
                    }
                }
            }
        };
        /** @ignore */
        this.onError = new async_1.Stream();
        /** @ignore */
        this.lastRid = 0;
        /** @ignore */
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
    /** @ignore */
    _onReceiveUpdate(m) {
        if (typeof m['rid'] === 'number' && this._requests.has(m['rid'])) {
            this._requests.get(m['rid'])._update(m);
        }
    }
    /** @ignore */
    getNextRid() {
        do {
            if (this.lastRid < 0x7fffffff) {
                ++this.lastRid;
            }
            else {
                this.lastRid = 1;
            }
        } while (this._requests.has(this.lastRid));
        return this.lastRid;
    }
    /** @ignore */
    getSendingData(currentTime, waitingAckId) {
        let rslt = super.getSendingData(currentTime, waitingAckId);
        return rslt;
    }
    /** @ignore */
    sendRequest(m, updater) {
        return this._sendRequest(m, updater);
    }
    /** @ignore */
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
    /**
     * Subscribe a path and get value updates in a async callback
     * If you only need to get the current value once, use [[subscribeOnce]] instead.
     *
     * A Subscription listener should be closed with [[ReqSubscribeListener.close]] when it's no longer needed.
     * You can also use the [[unsubscribe]] method to close the callback.
     *
     * @param callback - if same callback is subscribed twice, the previous one will be overwritten with new qos value
     * @param qos - qos level of the subscription
     *   - 0: allow value skipping as long as the last update is received
     *   - 1: no value skipping
     */
    subscribe(path, callback, qos = 0) {
        let node = this.nodeCache.getRemoteNode(path);
        node._subscribe(this, callback, qos);
        return new subscribe_1.ReqSubscribeListener(this, path, callback);
    }
    /**
     * Unsubscribe the callback
     */
    unsubscribe(path, callback) {
        let node = this.nodeCache.getRemoteNode(path);
        node._unsubscribe(this, callback);
    }
    /** @ignore */
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
    /**
     * Subscribe and get value update only once, subscription will be closed automatically when an update is received
     */
    subscribeOnce(path, timeoutMs = 0) {
        return new Promise((resolve, reject) => {
            let timer;
            let listener = this.subscribe(path, (update) => {
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
    /**
     * List and get node metadata and children summary only once, subscription will be closed automatically when an update is received
     */
    listOnce(path) {
        return new Promise((resolve, reject) => {
            let sub = this.list(path, (update) => {
                resolve(update.node);
                if (sub != null) {
                    sub.close();
                }
            });
        });
    }
    /**
     * List a path and get the node metadata as well as a summary of children nodes.
     * This method will keep a stream and continue to get updates. If you only need to get the current value once, use [[listOnce]] instead.
     *
     * A Subscription should be closed with [[StreamSubscription.close]] when it's no longer needed.
     */
    list(path, callback) {
        let node = this.nodeCache.getRemoteNode(path);
        return node._list(this).listen(callback);
    }
    /**
     * Invoke a node action, and receive updates.
     * Usually an action stream will be closed on server side,
     * but in the case of a streaming action the returned stream needs to be closed with [[RequesterInvokeStream.close]]
     */
    invoke(path, params = {}, callback, maxPermission = permission_1.Permission.CONFIG) {
        let node = this.nodeCache.getRemoteNode(path);
        let stream = node._invoke(params, this, maxPermission);
        let mergedUpdate = [];
        let mappedStream = new invoke_1.RequesterInvokeStream();
        mappedStream.request = stream.request;
        stream.listen((update) => {
            if (mergedUpdate) {
                update.updates = mergedUpdate.concat(update.updates);
            }
            mergedUpdate = update.updates;
            if (update.streamStatus !== 'initialize') {
                mappedStream.add(update);
            }
        });
        if (callback) {
            mappedStream.listen(callback);
        }
        return mappedStream;
    }
    /**
     * Invoke a node action, and receive update only once, stream will be closed automatically if necessary
     */
    invokeOnce(path, params = {}, maxPermission = permission_1.Permission.CONFIG) {
        let stream = this.invoke(path, params, null, maxPermission);
        return new Promise((resolve, reject) => {
            stream.listen((update) => {
                if (update.streamStatus !== 'closed') {
                    stream.close();
                }
                if (update.error) {
                    reject(update.error);
                }
                else {
                    resolve(update);
                }
            });
        });
    }
    /**
     * Invoke a node action, and receive raw update.
     * Steaming updates won't be merged
     */
    invokeStream(path, params = {}, callback, maxPermission = permission_1.Permission.CONFIG) {
        let node = this.nodeCache.getRemoteNode(path);
        let stream = node._invoke(params, this, maxPermission);
        if (callback) {
            stream.listen(callback);
        }
        return stream;
    }
    /**
     * Set the value of an attribute, the attribute will be created if not exists
     */
    set(path, value, maxPermission = permission_1.Permission.CONFIG) {
        return new set_1.SetController(this, path, value, maxPermission).future;
    }
    /**
     * Remove an attribute
     */
    remove(path) {
        return new remove_1.RemoveController(this, path).future;
    }
    /// close the request from requester side and notify responder
    /** @ignore */
    closeRequest(request) {
        if (this._requests.has(request.rid)) {
            if (request.streamStatus !== 'closed') {
                this.addToSendList({ method: 'close', rid: request.rid });
            }
            this._requests.delete(request.rid);
            request.close();
        }
    }
    /** @ignore */
    onDisconnected() {
        if (!this._connected)
            return;
        this._connected = false;
        let newRequests = new Map();
        newRequests.set(0, this._subscription);
        for (let [n, req] of this._requests) {
            if (req.rid <= this.lastRid && !(req.updater instanceof list_1.ListController)) {
                req._close(interfaces_1.DsError.DISCONNECTED);
            }
            else {
                newRequests.set(req.rid, req);
                req.updater.onDisconnect();
            }
        }
        this._requests = newRequests;
    }
    /** @ignore */
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
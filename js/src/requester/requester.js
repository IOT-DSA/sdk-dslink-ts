import { Stream } from "../utils/async";
import { Request } from "./request";
import { ConnectionHandler } from "../common/connection_handler";
import { RemoteNodeCache } from "./node_cache";
import { ReqSubscribeListener, SubscribeRequest } from "./request/subscribe";
import { DSError, StreamStatus } from "../common/interfaces";
import { ListController } from "./request/list";
import { Permission } from "../common/permission";
import { SetController } from "./request/set";
import { RemoveController } from "./request/remove";
export class Requester extends ConnectionHandler {
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
        this.onError = new Stream();
        this.lastRid = 0;
        this._connected = false;
        this.nodeCache = cache ? cache : new RemoteNodeCache();
        this._subscription = new SubscribeRequest(this, 0);
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
            req = new Request(this, this.lastRid, updater, m);
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
     * Subscribe a path and get the value in a async callback
     *
     * @param path - The path to subscribe
     * @param callback - The callback
     * @param qos - The qos level of the subscription
     */
    subscribe(path, callback, qos = 0) {
        let node = this.nodeCache.getRemoteNode(path);
        node._subscribe(this, callback, qos);
        return new ReqSubscribeListener(this, path, callback);
    }
    unsubscribe(path, callback) {
        let node = this.nodeCache.getRemoteNode(path);
        node._unsubscribe(this, callback);
    }
    onValueChange(path, qos = 0) {
        let listener;
        let stream;
        stream = new Stream(() => {
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
    list(path, callback) {
        let node = this.nodeCache.getRemoteNode(path);
        return node._list(this).listen(callback);
    }
    invoke(path, params = {}, callback, maxPermission = Permission.CONFIG) {
        let node = this.nodeCache.getRemoteNode(path);
        let stream = node._invoke(params, this, maxPermission);
        if (callback) {
            stream.listen(callback);
        }
        return stream;
    }
    set(path, value, maxPermission = Permission.CONFIG) {
        return new SetController(this, path, value, maxPermission).future;
    }
    remove(path) {
        return new RemoveController(this, path).future;
    }
    /// close the request from requester side and notify responder
    closeRequest(request) {
        if (this._requests.has(request.rid)) {
            if (request.streamStatus !== StreamStatus.closed) {
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
            if (req.rid <= this.lastRid && !(req.updater instanceof ListController)) {
                req._close(DSError.DISCONNECTED);
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
//# sourceMappingURL=requester.js.map
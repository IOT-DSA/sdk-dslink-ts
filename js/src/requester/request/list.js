"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListController = exports.ListDefListener = exports.RequesterListUpdate = exports.ReqListListener = void 0;
const async_1 = require("../../utils/async");
const node_cache_1 = require("../node_cache");
const interface_1 = require("../interface");
const value_1 = require("../../common/value");
class ReqListListener {
    /** @ignore */
    constructor(requester, path, callback, timeout) {
        this.requester = requester;
        this.path = path;
        this.callback = callback;
        this.onTimeOut = () => {
            this.timeout = null;
            let remoteNode = new node_cache_1.RemoteNode(this.path);
            remoteNode.configs.set('$disconnectedTs', value_1.ValueUpdate.getTs());
            this.callback(new RequesterListUpdate(remoteNode, ['$disconnectedTs'], 'open'));
        };
        if (timeout) {
            this.timeout = setTimeout(this.onTimeOut, timeout);
            this.callbackWrapper = (value) => {
                if (this.timeout) {
                    clearTimeout(this.timeout);
                    this.timeout = null;
                }
                this.callback(value);
            };
        }
        else {
            this.callbackWrapper = callback;
        }
        let node = requester.nodeCache.getRemoteNode(path);
        this.listener = node._list(requester).listen(this.callbackWrapper);
    }
    close() {
        this.listener.close();
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }
}
exports.ReqListListener = ReqListListener;
class RequesterListUpdate extends interface_1.RequesterUpdate {
    /** @ignore */
    constructor(node, changes, streamStatus) {
        super(streamStatus);
        this.node = node;
        this.changes = changes;
    }
}
exports.RequesterListUpdate = RequesterListUpdate;
/** @ignore */
class ListDefListener {
    constructor(node, requester, callback) {
        this.ready = false;
        this.node = node;
        this.requester = requester;
        this.listener = requester.list(node.remotePath, (update) => {
            this.ready = update.streamStatus !== 'initialize';
            if (update.node.configs.has('$disconnectedTs')) {
                update.node.configs.delete('$disconnectedTs');
            }
            callback(update);
        });
    }
    close() {
        this.listener.close();
    }
}
exports.ListDefListener = ListDefListener;
/** @ignore */
class ListController {
    constructor(node, requester) {
        this.changes = new Set();
        this._onProfileUpdate = (update) => {
            if (this._profileLoader == null) {
                //      logger.finest('warning, unexpected state of profile loading');
                return;
            }
            this._profileLoader.close();
            this._profileLoader = null;
            for (let change of update.changes) {
                if (!ListController._ignoreProfileProps.includes(change)) {
                    this.changes.add(change);
                    if (change.startsWith('$')) {
                        if (!this.node.configs.has(change)) {
                            this.node.configs.set(change, this.node.profile.configs.get(change));
                        }
                    }
                    else if (change.startsWith('@')) {
                        if (!this.node.attributes.has(change)) {
                            this.node.attributes.set(change, this.node.profile.attributes.get(change));
                        }
                    }
                    else {
                        if (!this.node.children.has(change)) {
                            this.node.children.set(change, this.node.profile.children.get(change));
                        }
                    }
                }
            }
            this._ready = true;
            this.onProfileUpdated();
        };
        this._ready = true;
        this._pendingRemoveDef = false;
        this.onStartListen = () => {
            if (this.request == null && !this.waitToSend) {
                this.waitToSend = true;
                this.requester.addProcessor(this);
            }
        };
        this.waitToSend = false;
        this._onListen = (callback) => {
            if (this._ready && this.request != null) {
                setTimeout(() => {
                    if (this.request == null) {
                        return;
                    }
                    let changes = [];
                    for (let [key, v] of this.node.configs) {
                        changes.push(key);
                    }
                    for (let [key, v] of this.node.attributes) {
                        changes.push(key);
                    }
                    for (let [key, v] of this.node.children) {
                        changes.push(key);
                    }
                    let update = new RequesterListUpdate(this.node, changes, this.request.streamStatus);
                    callback(update);
                }, 0);
            }
        };
        this._onAllCancel = () => {
            this._destroy();
        };
        this.node = node;
        this.requester = requester;
        this.stream = new async_1.Stream(this.onStartListen, this._onAllCancel, this._onListen);
    }
    get initialized() {
        return this.request != null && this.request.streamStatus !== 'initialize';
    }
    onDisconnect() {
        this.disconnectTs = value_1.ValueUpdate.getTs();
        this.node.configs.set('$disconnectedTs', this.disconnectTs);
        this.stream.add(new RequesterListUpdate(this.node, ['$disconnectedTs'], this.request.streamStatus));
    }
    onReconnect() {
        if (this.disconnectTs != null) {
            this.node.configs.delete('$disconnectedTs');
            this.disconnectTs = null;
            this.changes.add('$disconnectedTs');
        }
    }
    onUpdate(streamStatus, updates, columns, meta, error) {
        let reseted = false;
        if (!updates) {
            if (error) {
                updates = [['$disconnectedTs', value_1.ValueUpdate.getTs()]];
            }
            else {
                updates = [];
            }
        }
        for (let update of updates) {
            let name;
            let value;
            let removed = false;
            if (Array.isArray(update)) {
                if (update.length > 0 && typeof update[0] === 'string') {
                    name = update[0];
                    if (update.length > 1) {
                        value = update[1];
                    }
                }
                else {
                    continue; // invalid response
                }
            }
            else if (update != null && update instanceof Object) {
                if (typeof update['name'] === 'string') {
                    name = update['name'];
                }
                else {
                    continue; // invalid response
                }
                if (update['change'] === 'remove') {
                    removed = true;
                }
                else {
                    value = update['value'];
                }
            }
            else {
                continue; // invalid response
            }
            if (name.startsWith('$')) {
                if (!reseted &&
                    (name === '$is' || name === '$base' || (name === '$disconnectedTs' && typeof value === 'string'))) {
                    reseted = true;
                    this.node.resetNodeCache();
                }
                if (name === '$is') {
                    this.loadProfile(value);
                }
                this.changes.add(name);
                if (removed) {
                    this.node.configs.delete(name);
                }
                else {
                    this.node.configs.set(name, value);
                }
            }
            else if (name.startsWith('@')) {
                this.changes.add(name);
                if (removed) {
                    this.node.attributes.delete(name);
                }
                else {
                    this.node.attributes.set(name, value);
                }
            }
            else {
                this.changes.add(name);
                if (removed) {
                    this.node.children.delete(name);
                }
                else if (value != null && value instanceof Object) {
                    // TODO, also wait for children $is
                    this.node.children.set(name, this.requester.nodeCache.updateRemoteChildNode(this.node, name, value));
                }
            }
        }
        if (this.request.streamStatus !== 'initialize') {
            this.node._listed = true;
        }
        if (this._pendingRemoveDef) {
            this._checkRemoveDef();
        }
        this.onProfileUpdated();
    }
    loadProfile(defName) {
        this._ready = true;
        let defPath = defName;
        if (!defPath.startsWith('/')) {
            let base = this.node.configs.get('$base');
            if (typeof base === 'string') {
                defPath = `${base}/defs/profile/${defPath}`;
            }
            else {
                defPath = `/defs/profile/${defPath}`;
            }
        }
        if (this.node.profile instanceof node_cache_1.RemoteNode && this.node.profile.remotePath === defPath) {
            return;
        }
        this.node.profile = this.requester.nodeCache.getDefNode(defPath, defName);
        if (defName === 'node') {
            return;
        }
        if (this.node.profile instanceof node_cache_1.RemoteNode && !this.node.profile._listed) {
            this._ready = false;
            this._profileLoader = new ListDefListener(this.node.profile, this.requester, this._onProfileUpdate);
        }
    }
    onProfileUpdated() {
        if (this._ready) {
            if (this.request.streamStatus !== 'initialize') {
                this.stream.add(new RequesterListUpdate(this.node, Array.from(this.changes), this.request.streamStatus));
                this.changes.clear();
            }
            if (this.request && this.request.streamStatus === 'closed') {
                this.stream.close();
            }
        }
    }
    _checkRemoveDef() {
        this._pendingRemoveDef = false;
    }
    startSendingData(currentTime, waitingAckId) {
        if (!this.waitToSend) {
            return;
        }
        this.request = this.requester._sendRequest({ method: 'list', path: this.node.remotePath }, this);
        this.waitToSend = false;
    }
    ackReceived(receiveAckId, startTime, currentTime) { }
    _destroy() {
        this.waitToSend = false;
        if (this._profileLoader != null) {
            this._profileLoader.close();
            this._profileLoader = null;
        }
        if (this.request != null) {
            this.requester.closeRequest(this.request);
            this.request = null;
        }
        this.stream.close();
        this.node._listController = null;
    }
}
exports.ListController = ListController;
ListController._ignoreProfileProps = [
    '$is',
    // '$permission',
    // '$settings',
    '$disconnectedTs',
];
//# sourceMappingURL=list.js.map
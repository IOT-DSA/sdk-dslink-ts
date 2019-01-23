"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async_1 = require("../../utils/async");
const interfaces_1 = require("../../common/interfaces");
const node_cache_1 = require("../node_cache");
const value_1 = require("../../common/value");
const interface_1 = require("../interface");
class RequesterListUpdate extends interface_1.RequesterUpdate {
    constructor(node, changes, streamStatus) {
        super(streamStatus);
        this.node = node;
        this.changes = changes;
    }
}
exports.RequesterListUpdate = RequesterListUpdate;
class ListDefListener {
    constructor(node, requester, callback) {
        this.ready = false;
        this.node = node;
        this.requester = requester;
        this.listener = requester.list(node.remotePath, (update) => {
            this.ready = update.streamStatus !== interfaces_1.StreamStatus.initialize;
            callback(update);
        });
    }
    close() {
        this.listener.close();
    }
}
exports.ListDefListener = ListDefListener;
class ListController {
    constructor(node, requester) {
        this.changes = new Set();
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
        return this.request != null && this.request.streamStatus !== interfaces_1.StreamStatus.initialize;
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
        // TODO implement error handling
        if (updates != null) {
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
                        (name === '$is' || name === '$base' ||
                            (name === '$disconnectedTs' && typeof value === 'string'))) {
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
            if (this.request.streamStatus !== interfaces_1.StreamStatus.initialize) {
                this.node.listed = true;
            }
            if (this._pendingRemoveDef) {
                this._checkRemoveDef();
            }
            this.onProfileUpdated();
        }
    }
    loadProfile(defName) {
        this._ready = true;
        let defPath = defName;
        if (!defPath.startsWith('/')) {
            let base = this.node.configs.get('$base');
            if (typeof base === 'string') {
                defPath = '$base/defs/profile/$defPath';
            }
            else {
                defPath = '/defs/profile/$defPath';
            }
        }
        if (this.node.profile instanceof node_cache_1.RemoteNode &&
            this.node.profile.remotePath === defPath) {
            return;
        }
        this.node.profile = this.requester.nodeCache.getDefNode(defPath, defName);
        if (defName === 'node') {
            return;
        }
        if ((this.node.profile instanceof node_cache_1.RemoteNode) && !this.node.profile.listed) {
            this._ready = false;
            this._profileLoader = new ListDefListener(this.node.profile, this.requester, this._onProfileUpdate);
        }
    }
    _onProfileUpdate(update) {
        if (this._profileLoader == null) {
            //      logger.finest('warning, unexpected state of profile loading');
            return;
        }
        this._profileLoader.close();
        this._profileLoader = null;
        for (let change of update.changes) {
            if (!ListController._ignoreProfileProps.includes(change)) {
                this.changes.add(change);
            }
        }
        this._ready = true;
        this.onProfileUpdated();
    }
    onProfileUpdated() {
        if (this._ready) {
            if (this.request.streamStatus !== interfaces_1.StreamStatus.initialize) {
                this.stream.add(new RequesterListUpdate(this.node, Array.from(this.changes), this.request.streamStatus));
                this.changes.clear();
            }
            if (this.request.streamStatus === interfaces_1.StreamStatus.closed) {
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
        this.request = this.requester._sendRequest({ 'method': 'list', 'path': this.node.remotePath }, this);
        this.waitToSend = false;
    }
    ackReceived(receiveAckId, startTime, currentTime) {
    }
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
ListController._ignoreProfileProps = [
    '$is',
    '$permission',
    '$settings'
];
exports.ListController = ListController;
//# sourceMappingURL=list.js.map
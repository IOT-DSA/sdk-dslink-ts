"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async_1 = require("../utils/async");
const node_1 = require("../common/node");
const permission_1 = require("../common/permission");
const value_1 = require("../common/value");
class LocalNode extends node_1.Node {
    constructor(path, provider, profileName = 'node') {
        super(profileName);
        this._value = null;
        this._valueReady = true;
        this.path = path;
        this.provider = provider;
        this.initialize();
    }
    initialize() {
    }
    addChild(name, node) {
        if (node.provider !== this.provider) {
            // TODO log warning
            return;
        }
        if (this.children.has(name)) {
            this.children.get(name).destroy();
        }
        this.children.set(name, node);
        if (this._state) {
            node._connectState();
        }
    }
    _connectState() {
        this.provider.createState(this.path).setNode(this);
        for (let [name, child] of this.children) {
            child._connectState();
        }
    }
    getInvokePermission() {
        return permission_1.Permission.parse(this.configs.get('$invokable'));
    }
    getSetPermission() {
        return permission_1.Permission.parse(this.configs.get('$writable'));
    }
    /// Called by the link internals to invoke this node.
    invoke(params, responder, response, parentNode, maxPermission = permission_1.Permission.CONFIG) {
        response.close();
    }
    setConfig(name, value) {
        if (!name.startsWith("$")) {
            name = `\$${name}`;
        }
        this.configs.set(name, value);
        this.provider.save();
    }
    /// Called by the link internals to set an attribute on this node.
    setAttribute(name, value, responder, response) {
        if (!name.startsWith("@")) {
            name = `@${name}`;
        }
        this.attributes.set(name, value);
        this.provider.save();
        if (response != null) {
            response.close();
        }
    }
    /// Called by the link internals to remove an attribute from this node.
    removeAttribute(name, responder, response) {
        if (!name.startsWith("@")) {
            name = `@${name}`;
        }
        this.attributes.delete(name);
        this.provider.save();
        if (response != null) {
            response.close();
        }
    }
    /// Called by the link internals to set a value of a node.
    setValue(value, responder, response, maxPermission = permission_1.Permission.CONFIG) {
        this._value = value;
        response.close();
    }
    save() {
        return null;
    }
    destroy() {
        if (this._state) {
            this._state.setNode(null);
            for (let [name, child] of this.children) {
                child.destroy();
            }
            this._state = null;
        }
    }
}
exports.LocalNode = LocalNode;
class NodeProvider {
    constructor(options) {
        this._states = new Map();
        this._saveTimer = null;
        this._saveIntervalMs = 5000;
        this.onSaveTimer = () => {
            this._saveTimer = null;
            if (this._saveFunction) {
                let data = this._root.save();
                if (data) {
                    this._saveFunction(data);
                }
            }
        };
        if (options) {
            let { saveFunction, saveIntervalMs } = options;
            this._saveFunction = saveFunction;
            if (saveIntervalMs) {
                this._saveIntervalMs = saveIntervalMs;
            }
        }
    }
    getNode(path) {
        if (this._states.has(path)) {
            return this._states.get(path)._node;
        }
        return null;
    }
    createState(path) {
        if (this._states.has(path)) {
            return this._states.get(path);
        }
        let state = new NodeState(path, this);
        this._states.set(path, state);
        return state;
    }
    setRoot(node) {
        if (!this._root) {
            this._root = node;
            node._connectState();
        }
    }
    save() {
        // save root node with a timer
        if (this._saveFunction && !this._saveTimer) {
            this._saveTimer = setTimeout(this.onSaveTimer, this._saveIntervalMs);
        }
    }
}
exports.NodeProvider = NodeProvider;
class NodeState {
    constructor(path, provider) {
        this.onList = (listener) => {
            if (this._node) {
                // TODO
            }
        };
        this.listStream = new async_1.Stream(null, () => this.checkDestroy(), // onAllCancel
        this.onList // onListen
        );
        this.path = path;
        this.provider = provider;
    }
    initListUpdate() {
        for (let listener of this.listStream._listeners) {
            listener(null); // use null to update all
        }
    }
    /// Gets the last value update of this node.
    get lastValueUpdate() {
        if (!this._lastValueUpdate && this._node && this._node._valueReady) {
            this._lastValueUpdate = new value_1.ValueUpdate(this._node._value);
        }
        return this._lastValueUpdate;
    }
    setNode(node) {
        this._node = node;
        if (node) {
            node._state = this;
            if (this._subscriber && node._valueReady) {
                this._subscriber.addValue(this.lastValueUpdate);
            }
            for (let listener of this.listStream._listeners) {
                listener(null); // use null to update all
            }
        }
        else {
            this._lastValueUpdate = null;
            this.checkDestroy();
        }
    }
    setSubscriber(s) {
        this._subscriber = s;
        if (!s) {
            this.checkDestroy();
        }
    }
    checkDestroy() {
        if (!(this._node || this.listStream.hasListener() || this._subscriber)) {
            this.destroy();
        }
    }
    destroy() {
        this.provider._states.delete(this.path);
    }
}
exports.NodeState = NodeState;
//# sourceMappingURL=node_state.js.map
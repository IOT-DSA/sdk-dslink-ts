import { Stream } from '../utils/async';
import { Node } from '../common/node';
import { Permission } from '../common/permission';
import { ValueUpdate } from '../common/value';
import { DsError } from '../common/interfaces';
export class LocalNode extends Node {
    constructor(path, provider) {
        super(null);
        this.path = path;
        this.provider = provider;
        this.initialize();
    }
    initialize() { }
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
            this._state.listStream.add(name);
        }
        if (this._state && node.constructor.saveNodeOnChange) {
            this.provider.save();
        }
    }
    removeChild(nameOrNode) {
        let name;
        let node;
        if (nameOrNode instanceof LocalNode) {
            node = nameOrNode;
            for (let [key, n] of this.children) {
                if (n === node) {
                    name = key;
                    break;
                }
            }
        }
        else if (typeof nameOrNode === 'string') {
            name = nameOrNode;
            node = this.children.get(name);
        }
        if (name && node) {
            node.destroy();
            this.children.delete(name);
            if (this._state) {
                this._state.listStream.add(name);
            }
            if (this._state && node.constructor.saveNodeOnChange) {
                this.provider.save();
            }
        }
    }
    /** @ignore */
    _connectState() {
        this.provider.createState(this.path).setNode(this);
        for (let [name, child] of this.children) {
            child._connectState();
        }
    }
    getInvokePermission() {
        return Permission.parse(this.configs.get('$invokable'));
    }
    getSetPermission() {
        return Permission.parse(this.configs.get('$writable'));
    }
    /// Called by the link internals to invoke this node.
    invoke(params, response, parentNode, maxPermission = Permission.CONFIG) {
        response.close(DsError.NOT_IMPLEMENTED);
    }
    setConfig(name, value) {
        if (!name.startsWith('$')) {
            name = `\$${name}`;
        }
        this.configs.set(name, value);
        if (this._state && this.constructor.saveNodeOnChange) {
            this.provider.save();
        }
        if (this._state) {
            this._state.listStream.add(name);
        }
    }
    /// Called by the link internals to set an attribute on this node.
    setAttribute(name, value, responder, response) {
        if (!name.startsWith('@')) {
            name = `@${name}`;
        }
        this.attributes.set(name, value);
        if (this._state && this.constructor.saveNodeOnChange) {
            this.provider.save();
        }
        if (this._state) {
            this._state.listStream.add(name);
        }
        if (response) {
            response.close();
        }
    }
    /// Called by the link internals to remove an attribute from this node.
    removeAttribute(name, responder, response) {
        if (!name.startsWith('@')) {
            name = `@${name}`;
        }
        this.attributes.delete(name);
        if (this._state && this.constructor.saveNodeOnChange) {
            this.provider.save();
        }
        if (this._state) {
            this._state.listStream.add(name);
        }
        if (response) {
            response.close();
        }
    }
    onSubscribe(subscriber) { }
    /// Called by the link internals to set a value of a node.
    setValue(value, responder, response, maxPermission = Permission.CONFIG) {
        try {
            if (this.onValueChange(value)) {
                if (this._state) {
                    this._state.updateValue(value);
                }
            }
            if (response) {
                response.close();
            }
        }
        catch (e) {
            if (response) {
                if (e instanceof Error) {
                    response.close(new DsError('failed', { msg: e.message }));
                }
                else {
                    response.close(new DsError('failed'));
                }
            }
        }
    }
    /**
     * @return true when the change is valid
     */
    onValueChange(newVal) {
        if (this._value === newVal) {
            return false;
        }
        this._value = newVal;
        return true;
    }
    virtualList(updates) { }
    save() {
        return null;
    }
    load(data) { }
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
export class NodeProvider {
    constructor(options) {
        /** @ignore */
        this._states = new Map();
        /** @ignore */
        this._saveTimer = null;
        /** @ignore */
        this._saveIntervalMs = 5000;
        /** @ignore */
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
    getVirtualNode(path) {
        return null;
    }
    getNode(path) {
        if (this._states.has(path)) {
            return this._states.get(path)._node;
        }
        else {
            let virtualNode = this.getVirtualNode(path);
            if (virtualNode) {
                this.createState(path, false).setNode(virtualNode);
                return virtualNode;
            }
        }
        return null;
    }
    createState(path, createVirtualNode = true) {
        if (this._states.has(path)) {
            return this._states.get(path);
        }
        let state = new NodeState(path, this);
        this._states.set(path, state);
        if (!state._node && createVirtualNode) {
            let virtualNode = this.getVirtualNode(path);
            if (virtualNode) {
                state.setNode(virtualNode);
            }
        }
        return state;
    }
    removeNode(path) {
        let pos = path.lastIndexOf('/');
        if (pos > 0) {
            let parentNode = this.getNode(path.substring(0, pos));
            if (parentNode) {
                parentNode.removeChild(path.substring(pos + 1));
            }
        }
        else if (pos === 0) {
            this._root.removeChild(path.substring(1));
        }
    }
    /** @ignore */
    setRoot(node) {
        if (!this._root) {
            this._root = node;
            node._connectState();
        }
    }
    save() {
        // save root node with a timer
        if (this._saveFunction) {
            if (this._saveIntervalMs === 0) {
                this.onSaveTimer();
            }
            else if (!this._saveTimer) {
                this._saveTimer = setTimeout(this.onSaveTimer, this._saveIntervalMs);
            }
        }
    }
    finishSaveTimer() {
        if (this._saveTimer) {
            clearTimeout(this._saveTimer);
            this.onSaveTimer();
        }
    }
    addProfile(path, data) {
        let nodePath = `/defs/profile/${path}`;
        let state = this.createState(nodePath);
        let profileNode = new NodeProvider.ProfileNode(nodePath, this);
        state.setNode(profileNode);
        profileNode.load(data);
    }
}
export class NodeState {
    constructor(path, provider) {
        /** @ignore */
        this._disconnectedTs = ValueUpdate.getTs();
        /** @ignore */
        this.onList = (listener) => {
            if (this._node) {
                listener(null);
            }
            else {
                listener('$disconnectedTs');
            }
        };
        /** @ignore */
        this.listStream = new Stream(null, () => this.checkDestroy(), // onAllCancel
        this.onList // onListen
        );
        this.path = path;
        this.provider = provider;
    }
    /** @ignore */
    initListUpdate() {
        for (let listener of this.listStream._listeners) {
            listener(null); // use null to update all
        }
    }
    /** @ignore */
    updateValue(value) {
        if (value === undefined) {
            // value not ready
            this._lastValueUpdate = null;
            return;
        }
        if (this._node._value instanceof ValueUpdate) {
            this._lastValueUpdate = this._node._value;
        }
        else {
            this._lastValueUpdate = new ValueUpdate(this._node._value);
        }
        if (this._subscriber) {
            this._subscriber.addValue(this._lastValueUpdate);
        }
    }
    /** @ignore */
    setNode(node) {
        this._node = node;
        if (node) {
            node._state = this;
            node.onSubscribe(this._subscriber);
            this.updateValue(node._value);
            for (let listener of this.listStream._listeners) {
                listener(null); // use null to update all
            }
        }
        else {
            this._lastValueUpdate = null;
            if (this._subscriber) {
                // TODO: to be defined
            }
            this._disconnectedTs = ValueUpdate.getTs();
            for (let listener of this.listStream._listeners) {
                listener('$disconnectedTs');
            }
            this.checkDestroy();
        }
    }
    /** @ignore */
    setSubscriber(s) {
        if (s === this._subscriber) {
            return;
        }
        this._subscriber = s;
        if (!s) {
            this.checkDestroy();
        }
        else if (this._lastValueUpdate) {
            s.addValue(this._lastValueUpdate);
        }
        else if (!this._node || !this._node.getConfig('$type')) {
            // value not supported
            s.addValue(new ValueUpdate(null, null, { status: 'unknown' }));
        }
        else {
            // no value will be sent, responder will just wait until a value is ready
        }
        if (this._node) {
            this._node.onSubscribe(s);
        }
    }
    /** @ignore */
    checkDestroy() {
        if (!(this._node || this.listStream.hasListener() || this._subscriber)) {
            this.destroy();
        }
    }
    /** @ignore */
    destroy() {
        this.provider._states.delete(this.path);
    }
}
//# sourceMappingURL=node_state.js.map
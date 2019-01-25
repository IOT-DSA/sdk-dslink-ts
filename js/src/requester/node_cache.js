/// manage cached nodes for requester
import { Node } from "../common/node";
import { ListController } from "./request/list";
import { ReqSubscribeController } from "./request/subscribe";
import { Permission } from "../common/permission";
import { InvokeController } from "./request/invoke";
import { buildEnumType } from "../../utils";
export class RemoteNodeCache {
    constructor() {
        this._nodes = new Map();
    }
    RemoteNodeCache() {
    }
    getRemoteNode(path) {
        let node = this._nodes.get(path);
        if (node == null) {
            if ((this._nodes.size % 1000) === 0) {
                //        logger.fine("Node Cache hit ${this._nodes.length} nodes in size.");
            }
            if (path.startsWith("defs")) {
                node = new RemoteDefNode(path);
                this._nodes.set(path, node);
            }
            else {
                node = new RemoteNode(path);
                this._nodes.set(path, node);
            }
        }
        return node;
    }
    cachedNodePaths() {
        return this._nodes.keys;
    }
    isNodeCached(path) {
        return this._nodes.has(path);
    }
    clearCachedNode(path) {
        this._nodes.delete(path);
    }
    clear() {
        this._nodes.clear();
    }
    getDefNode(path, defName) {
        if (DefaultDefNodes.nameMap.hasOwnProperty(defName)) {
            return DefaultDefNodes.nameMap[defName];
        }
        return this.getRemoteNode(path);
    }
    /// update node with a map.
    updateRemoteChildNode(parent, name, m) {
        let path;
        if (parent.remotePath === '/') {
            path = `/${name}`;
        }
        else {
            path = `${parent.remotePath}/${name}`;
        }
        let rslt;
        if (this._nodes.has(path)) {
            rslt = this._nodes.get(path);
            rslt.updateRemoteChildData(m, this);
        }
        else {
            rslt = new RemoteNode(path);
            this._nodes.set(path, rslt);
            rslt.updateRemoteChildData(m, this);
        }
        return rslt;
    }
}
export class RemoteNode extends Node {
    constructor(remotePath) {
        super();
        this.listed = false;
        this.remotePath = remotePath;
        this._getRawName();
    }
    get subscribeController() {
        return this._subscribeController;
    }
    get hasValueUpdate() {
        if (this._subscribeController == null) {
            return false;
        }
        return this._subscribeController._lastUpdate != null;
    }
    get lastValueUpdate() {
        if (this.hasValueUpdate) {
            return this._subscribeController._lastUpdate;
        }
        else {
            return null;
        }
    }
    _getRawName() {
        if (this.remotePath === '/') {
            this.name = '/';
        }
        else {
            this.name = this.remotePath
                .split('/').pop();
        }
    }
    /// node data is not ready until all profile and mixins are updated
    isUpdated() {
        if (!this.isSelfUpdated()) {
            return false;
        }
        if (this.profile instanceof RemoteNode && !this.profile.isSelfUpdated()) {
            return false;
        }
        return true;
    }
    /// whether the node's own data is updated
    isSelfUpdated() {
        return this._listController != null && this._listController.initialized;
    }
    _list(requester) {
        if (this._listController == null) {
            this._listController = this.createListController(requester);
        }
        return this._listController.stream;
    }
    /// need a factory function for children class to override
    createListController(requester) {
        return new ListController(this, requester);
    }
    _subscribe(requester, callback, qos) {
        if (this._subscribeController == null) {
            this._subscribeController = new ReqSubscribeController(this, requester);
        }
        this._subscribeController.listen(callback, qos);
    }
    _unsubscribe(requester, callback) {
        if (this._subscribeController != null) {
            this._subscribeController.unlisten(callback);
        }
    }
    _invoke(params, requester, maxPermission = Permission.CONFIG) {
        return new InvokeController(this, requester, params, maxPermission)._stream;
    }
    /// used by list api to update simple data for children
    updateRemoteChildData(m, cache) {
        let childPathPre;
        if (this.remotePath === '/') {
            childPathPre = '/';
        }
        else {
            childPathPre = `${this.remotePath}/`;
        }
        for (let key in m) {
            let value = m[key];
            if (key.startsWith('$')) {
                this.configs.set(key, value);
            }
            else if (key.startsWith('@')) {
                this.attributes.set(key, value);
            }
            else if ((value != null && value instanceof Object)) {
                let node = cache.getRemoteNode(`${childPathPre}/${key}`);
                this.children.set(key, node);
                if (node instanceof RemoteNode) {
                    node.updateRemoteChildData(value, cache);
                }
            }
        }
    }
    /// clear all configs attributes and children
    resetNodeCache() {
        this.configs.clear();
        this.attributes.clear();
        this.children.clear();
    }
    save(includeValue = true) {
        let map = {};
        for (let [key, value] of this.configs) {
            map[key] = value;
        }
        for (let [key, value] of this.attributes) {
            map[key] = value;
        }
        for (let [key, node] of this.children) {
            map[key] = node instanceof RemoteNode ? node.save() : node.getSimpleMap();
        }
        if (includeValue &&
            this._subscribeController != null &&
            this._subscribeController._lastUpdate != null) {
            map["?value"] = this._subscribeController._lastUpdate.value;
            map["?value_timestamp"] = this._subscribeController._lastUpdate.ts;
        }
        return map;
    }
}
export class RemoteDefNode extends RemoteNode {
    constructor(path) {
        super(path);
    }
}
export class DefaultDefNodes {
}
DefaultDefNodes._defaultDefs = {
    "node": {},
    "static": {},
    "getHistory": {
        "$invokable": "read",
        "$result": "table",
        "$params": [
            {
                "name": "Timerange",
                "type": "string",
                "edito": "daterange"
            },
            {
                "name": "Interval",
                "type": "enum",
                "default": "none",
                "edito": buildEnumType([
                    "default",
                    "none",
                    "1Y",
                    "3N",
                    "1N",
                    "1W",
                    "1D",
                    "12H",
                    "6H",
                    "4H",
                    "3H",
                    "2H",
                    "1H",
                    "30M",
                    "15M",
                    "10M",
                    "5M",
                    "1M",
                    "30S",
                    "15S",
                    "10S",
                    "5S",
                    "1S"
                ])
            },
            {
                "name": "Rollup",
                "default": "none",
                "type": buildEnumType([
                    "none",
                    "avg",
                    "min",
                    "max",
                    "sum",
                    "first",
                    "last",
                    "count",
                    "delta"
                ])
            }
        ],
        "$columns": [
            {
                "name": "timestamp",
                "type": "time"
            },
            {
                "name": "value",
                "type": "dynamic"
            }
        ]
    }
};
DefaultDefNodes.nameMap = (function () {
    let rslt = {};
    for (let k in DefaultDefNodes._defaultDefs) {
        let m = DefaultDefNodes._defaultDefs[k];
        let path = `/defs/profile/${k}`;
        let node = new RemoteDefNode(path);
        for (let n in m) {
            let v = DefaultDefNodes._defaultDefs[k];
            if (n.startsWith('$')) {
                node.configs.set(n, v);
            }
            else if (n.startsWith('@')) {
                node.attributes.set(n, v);
            }
        }
        node.listed = true;
        rslt[k] = node;
    }
    return rslt;
})();
DefaultDefNodes.pathMap = (function () {
    let rslt = {};
    for (let k in DefaultDefNodes.nameMap) {
        let node = DefaultDefNodes.nameMap[k];
        if (node instanceof RemoteNode) {
            rslt[node.remotePath] = node;
        }
    }
    return rslt;
})();
//# sourceMappingURL=node_cache.js.map
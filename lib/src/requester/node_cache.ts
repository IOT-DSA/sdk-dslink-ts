/// manage cached nodes for requester
import {Node} from "../common/node";
import {ListController, RequesterListUpdate} from "./request/list";
import {ReqSubscribeController} from "./request/subscribe";
import {ValueUpdate} from "../common/value";
import {RequestConsumer, Requester} from "./requester";
import {Stream} from "../utils/async";
import {Permission} from "../common/permission";
import {InvokeController, RequesterInvokeUpdate} from "./request/invoke";
import {buildEnumType} from "../../utils";

export class RemoteNodeCache {
  _nodes: Map<string, RemoteNode> = new Map();

  RemoteNodeCache() {
  }

  getRemoteNode(path: string): RemoteNode {
    let node = this._nodes.get(path);

    if (node == null) {
      if ((this._nodes.size % 1000) === 0) {
//        logger.fine("Node Cache hit ${this._nodes.length} nodes in size.");
      }

      if (path.startsWith("defs")) {
        node = new RemoteDefNode(path);
        this._nodes.set(path, node);
      } else {
        node = new RemoteNode(path);
        this._nodes.set(path, node);
      }
    }

    return node;
  }

  cachedNodePaths() {
    return this._nodes.keys;
  }

  isNodeCached(path: string): boolean {
    return this._nodes.has(path);
  }

  clearCachedNode(path: string) {
    this._nodes.delete(path);
  }

  clear() {
    this._nodes.clear();
  }

  getDefNode(path: string, defName: string): Node {
    if (DefaultDefNodes.nameMap.hasOwnProperty(defName)) {
      return DefaultDefNodes.nameMap[defName];
    }
    return this.getRemoteNode(path);
  }

  /// update node with a map.
  updateRemoteChildNode(parent: RemoteNode, name: string, m: any): RemoteNode {
    let path: string;
    if (parent.remotePath === '/') {
      path = `/${name}`;
    } else {
      path = `${parent.remotePath}/${name}`;
    }
    let rslt: RemoteNode;
    if (this._nodes.has(path)) {
      rslt = this._nodes.get(path);
      rslt.updateRemoteChildData(m, this);
    } else {
      rslt = new RemoteNode(path);
      this._nodes.set(path, rslt);
      rslt.updateRemoteChildData(m, this);
    }
    return rslt;
  }
}

export class RemoteNode extends Node {
  readonly remotePath: string;
  listed: boolean = false;
  name: string;
  _listController: ListController;
  _subscribeController: ReqSubscribeController;

  get subscribeController(): ReqSubscribeController {
    return this._subscribeController;
  }

  get hasValueUpdate(): boolean {
    if (this._subscribeController == null) {
      return false;
    }

    return this._subscribeController._lastUpdate != null;
  }

  get lastValueUpdate(): ValueUpdate {
    if (this.hasValueUpdate) {
      return this._subscribeController._lastUpdate;
    } else {
      return null;
    }
  }

  constructor(remotePath: string) {
    super();
    this.remotePath = remotePath;
    this._getRawName();
  }

  _getRawName() {
    if (this.remotePath === '/') {
      this.name = '/';
    } else {
      this.name = this.remotePath
        .split('/').pop();
    }
  }

  /// node data is not ready until all profile and mixins are updated
  isUpdated(): boolean {
    if (!this.isSelfUpdated()) {
      return false;
    }

    if (this.profile instanceof RemoteNode && !(this.profile as RemoteNode).isSelfUpdated()) {
      return false;
    }
    return true;
  }

  /// whether the node's own data is updated
  isSelfUpdated(): boolean {
    return this._listController != null && this._listController.initialized;
  }

  _list(requester: Requester): Stream<RequesterListUpdate> {
    if (this._listController == null) {
      this._listController = this.createListController(requester);
    }
    return this._listController.stream;
  }

  /// need a factory function for children class to override
  createListController(requester: Requester): ListController {
    return new ListController(this, requester);
  }

  _subscribe(requester: Requester, callback: (update: ValueUpdate) => void, qos: number) {
    if (this._subscribeController == null) {
      this._subscribeController = new ReqSubscribeController(this, requester);
    }
    this._subscribeController.listen(callback, qos);
  }

  _unsubscribe(requester: Requester, callback: (update: ValueUpdate) => void) {
    if (this._subscribeController != null) {
      this._subscribeController.unlisten(callback);
    }
  }

  _invoke(params: object, requester: Requester,
          maxPermission: number = Permission.CONFIG, fetchRawReq?: RequestConsumer<any>): Stream<RequesterInvokeUpdate> {
    return new InvokeController(
      this,
      requester,
      params,
      maxPermission,
      fetchRawReq
    )._stream;
  }

  /// used by list api to update simple data for children
  updateRemoteChildData(m: any, cache: RemoteNodeCache) {
    let childPathPre: string;
    if (this.remotePath === '/') {
      childPathPre = '/';
    } else {
      childPathPre = `${this.remotePath}/`;
    }
    for (let key in m) {
      let value = m[key];
      if (key.startsWith('$')) {
        this.configs.set(key, value);
      } else if (key.startsWith('@')) {
        this.attributes.set(key, value);
      } else if ((value != null && value instanceof Object)) {
        let node: Node = cache.getRemoteNode(`${childPathPre}/${key}`);
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

  save(includeValue = true): { [key: string]: any } {
    let map: { [key: string]: any } = {};
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
  constructor(path: string) {
    super(path);
  }
}

export class DefaultDefNodes {
  static readonly _defaultDefs: any = {
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

  static readonly nameMap: { [key: string]: Node } = (function () {
    let rslt: { [key: string]: Node } = {};
    for (let k in DefaultDefNodes._defaultDefs) {
      let m: any = DefaultDefNodes._defaultDefs[k];
      let path = `/defs/profile/${k}`;
      let node: RemoteDefNode = new RemoteDefNode(path);

      for (let n in m) {
        let v: any = DefaultDefNodes._defaultDefs[k];

        if (n.startsWith('$')) {
          node.configs.set(n, v);
        } else if (n.startsWith('@')) {
          node.attributes.set(n, v);
        }
      }
      node.listed = true;
      rslt[k] = node;
    }
    return rslt;
  })();

  static readonly pathMap: { [key: string]: Node } = (function () {
    let rslt: { [key: string]: Node } = {};
    for (let k in DefaultDefNodes.nameMap) {
      let node = DefaultDefNodes.nameMap[k];
      if (node instanceof RemoteNode) {
        rslt[node.remotePath] = node;
      }
    }
    return rslt;
  })();
}
// part of dslink.requester;

/// manage cached nodes for requester
/// TODO: cleanup nodes that are no longer in use
export class RemoteNodeCache  {
  _nodes: {[key: string]: RemoteNode} = new {[key: string]: RemoteNode}();

  RemoteNodeCache() {}

  getRemoteNode(path: string):RemoteNode {
    var node = _nodes[path];

    if (node == null) {
      if (( this._nodes.length % 1000) == 0) {
        logger.fine("Node Cache hit ${_nodes.length} nodes in size.");
      }

      if (path.startsWith("defs")) {
        node = _nodes[path] = new RemoteDefNode(path);
      } else {
        node = _nodes[path] = new RemoteNode(path);
      }
    }

    return node;
  }

  Iterable<string> get cachedNodePaths => this._nodes.keys;

  isNodeCached(path: string):boolean {
    return this._nodes.containsKey(path);
  }

  clearCachedNode(path: string) {
    _nodes.remove(path);
  }

  clear() {
    _nodes.clear();
  }

  getDefNode(path: string, defName: string):Node {
    if (DefaultDefNodes.nameMap.containsKey(defName)) {
      return DefaultDefNodes.nameMap[defName];
    }
    return getRemoteNode(path);
  }

  /// update node with a map.
  updateRemoteChildNode(parent: RemoteNode, name: string, object m):RemoteNode {
    path: string;
    if (parent.remotePath == '/') {
      path = '/$name';
    } else {
      path = '${parent.remotePath}/$name';
    }
    rslt: RemoteNode;
    if ( this._nodes.containsKey(path)) {
      rslt = _nodes[path];
      rslt.updateRemoteChildData(m, this);
    } else {
      rslt = new RemoteNode(path);
      _nodes[path] = rslt;
      rslt.updateRemoteChildData(m, this);
    }
    return rslt;
  }
}

export class RemoteNode  extends Node {
  final remotePath: string;
  listed: boolean = false;
  name: string;
  _listController: ListController;
  _subscribeController: ReqSubscribeController;

  get subscribeController(): ReqSubscribeController {
    return this._subscribeController;
  }

  get hasValueUpdate(): boolean {
    if ( this._subscribeController == null) {
      return false;
    }

    return this._subscribeController._lastUpdate != null;
  }

  get lastValueUpdate(): ValueUpdate {
    if (hasValueUpdate) {
      return this._subscribeController._lastUpdate;
    } else {
      return null;
    }
  }

  RemoteNode(this.remotePath) {
    _getRawName();
  }

  _getRawName() {
    if (remotePath == '/') {
      name = '/';
    } else {
      name = remotePath
        .split('/')
        .last;
    }
  }

  /// node data is not ready until all profile and mixins are updated
  isUpdated():boolean {
    if (!isSelfUpdated()) {
      return false;
    }

    if ( profile instanceof RemoteNode && !(profile as RemoteNode).isSelfUpdated()) {
      return false;
    }
    return true;
  }

  /// whether the node's own data is updated
  isSelfUpdated():boolean {
    return this._listController != null && this._listController.initialized;
  }

  _list(requester: Requester):Stream<RequesterListUpdate> {
    if ( this._listController == null) {
      _listController = createListController(requester);
    }
    return this._listController.stream;
  }

  /// need a factory function for children class to override
  createListController(requester: Requester):ListController {
    return new ListController(this, requester);
  }

  void _subscribe(requester: Requester, callback(update: ValueUpdate), qos:number) {
    if ( this._subscribeController == null) {
      _subscribeController = new ReqSubscribeController(this, requester);
    }
    _subscribeController.listen(callback, qos);
  }

  void _unsubscribe(requester: Requester, callback(update: ValueUpdate)) {
    if ( this._subscribeController != null) {
      _subscribeController.unlisten(callback);
    }
  }

  _invoke(params: object, requester: Requester,
    maxPermission:number = Permission.CONFIG, fetchRawReq: RequestConsumer):Stream<RequesterInvokeUpdate> {
    return new InvokeController(
      this,
      requester,
      params,
      maxPermission,
      fetchRawReq
    )._stream;
  }

  /// used by list api to update simple data for children
  updateRemoteChildData(object m, cache: RemoteNodeCache) {
    childPathPre: string;
    if (remotePath == '/') {
      childPathPre = '/';
    } else {
      childPathPre = '$remotePath/';
    }

    m.forEach((key: string, value) {
      if (key.startsWith(r'$')) {
        configs[key] = value;
      } else if (key.startsWith('@')) {
        attributes[key] = value;
      } else if ( (value != null && value instanceof Object) ) {
        let node: Node = cache.getRemoteNode('$childPathPre/$key');
        children[key] = node;
        if ( node instanceof RemoteNode ) {
          node.updateRemoteChildData(value, cache);
        }
      }
    });
  }

  /// clear all configs attributes and children
  resetNodeCache() {
    configs.clear();
    attributes.clear();
    children.clear();
  }

  save({boolean includeValue: true}):object {
    var map = {};
    map.addAll(configs);
    map.addAll(attributes);
    for (string key in children.keys) {
      let node: Node = children[key];
      map[key] = node is RemoteNode ? node.save() : node.getSimpleMap();
    }

    if (includeValue &&
      _subscribeController != null &&
      _subscribeController._lastUpdate != null) {
      map["?value"] = this._subscribeController._lastUpdate.value;
      map["?value_timestamp"] = this._subscribeController._lastUpdate.ts;
    }

    return map;
  }
}

export class RemoteDefNode  extends RemoteNode {
  RemoteDefNode(path: string) : super(path);
}

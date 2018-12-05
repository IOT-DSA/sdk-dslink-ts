// part of dslink.requester;

export class RequesterListUpdate  extends RequesterUpdate {
  /// this is only a list of changed fields
  /// when changes is null, means everything could have been changed
  changes: string[];
  node: RemoteNode;

  RequesterListUpdate(this.node, this.changes, streamStatus: string)
      : super(streamStatus);
}

export class ListDefListener  {
  readonly node: RemoteNode;
  readonly requester: Requester;

  listener: StreamSubscription;

  ready: boolean = false;

  ListDefListener(this.node, this.requester,
      void callback(RequesterListUpdate)) {
    listener = requester.list(node.remotePath).listen((update: RequesterListUpdate) {
      ready = update.streamStatus != StreamStatus.initialize;
      callback(update);
    });
  }

  cancel() {
    listener.cancel();
  }
}

export class ListController  implements RequestUpdater, ConnectionProcessor {
  readonly node: RemoteNode;
  readonly requester: Requester;
  _controller: BroadcastStreamController<RequesterListUpdate>;

  Stream<RequesterListUpdate> get stream => this._controller.stream;
  request: Request;

  ListController(this.node, this.requester) {
    _controller = new BroadcastStreamController<RequesterListUpdate>(
        onStartListen, this._onAllCancel, _onListen);
  }

  get initialized(): boolean {
    return request != null && request.streamStatus != StreamStatus.initialize;
  }

  disconnectTs: string;

  onDisconnect() {
    disconnectTs = ValueUpdate.getTs();
    node.configs[r'$disconnectedTs'] = disconnectTs;
    _controller.add(new RequesterListUpdate(
        node, [r'$disconnectedTs'], request.streamStatus));
  }

  onReconnect() {
    if (disconnectTs != null) {
      node.configs.remove(r'$disconnectedTs');
      disconnectTs = null;
      changes.add(r'$disconnectedTs');
    }
  }

  changes: LinkedHashSet<string> = new LinkedHashSet<string>();

  onUpdate(streamStatus: string, updates: List, columns: List, meta: object,
      let error: DSError) {
    reseted: boolean = false;
    // TODO implement error handling
    if (updates != null) {
      for (object update in updates) {
        let name: string;
        let value: object;
        let removed: boolean = false;
        if ( (update != null && update instanceof Object) ) {
          if (typeof update['name'] === 'string') {
            name = update['name'];
          } else {
            continue; // invalid response
          }
          if (update['change'] == 'remove') {
            removed = true;
          } else {
            value = update['value'];
          }
        } else if ( Array.isArray(update) ) {
          if (update.length > 0 && typeof update[0] === 'string') {
            name = update[0];
            if (update.length > 1) {
              value = update[1];
            }
          } else {
            continue; // invalid response
          }
        } else {
          continue; // invalid response
        }
        if (name.startsWith(r'$')) {
          if (!reseted &&
              (name == r'$is' ||
                  name == r'$base' ||
                  (name == r'$disconnectedTs' && typeof value === 'string' ))) {
            reseted = true;
            node.resetNodeCache();
          }
          if (name == r'$is') {
            loadProfile(value);
          }
          changes.add(name);
          if (removed) {
            node.configs.remove(name);
          } else {
            node.configs[name] = value;
          }
        } else if (name.startsWith('@')) {
          changes.add(name);
          if (removed) {
            node.attributes.remove(name);
          } else {
            node.attributes[name] = value;
          }
        } else {
          changes.add(name);
          if (removed) {
            node.children.remove(name);
          } else if ( (value != null && value instanceof Object) ) {
            // TODO, also wait for children $is
            node.children[name] =
                requester.nodeCache.updateRemoteChildNode(node, name, value);
          }
        }
      }
      if (request.streamStatus != StreamStatus.initialize) {
        node.listed = true;
      }
      if ( this._pendingRemoveDef) {
        _checkRemoveDef();
      }
      onProfileUpdated();
    }
  }

  _profileLoader: ListDefListener;

  loadProfile(defName: string) {
    _ready = true;
    defPath: string = defName;
    if (!defPath.startsWith('/')) {
      let base: object = node.configs[r'$base'];
      if ( typeof base === 'string' ) {
        defPath = '$base/defs/profile/$defPath';
      } else {
        defPath = '/defs/profile/$defPath';
      }
    }
    if (node.profile is RemoteNode &&
        (node.profile as RemoteNode).remotePath == defPath) {
      return;
    }
    node.profile = requester.nodeCache.getDefNode(defPath, defName);
    if (defName == 'node') {
      return;
    }
    if ((node.profile is RemoteNode) && !(node.profile as RemoteNode).listed) {
      _ready = false;
      _profileLoader =
      new ListDefListener(node.profile, requester, this._onProfileUpdate);
    }
  }

  static readonly _ignoreProfileProps: string[] = const [
    r'$is',
    r'$permission',
    r'$settings'
  ];

  _onProfileUpdate(update: RequesterListUpdate) {
    if ( this._profileLoader == null) {
//      logger.finest('warning, unexpected state of profile loading');
      return;
    }
    _profileLoader.cancel();
    _profileLoader = null;
    changes.addAll(
        update.changes.where((str) => !_ignoreProfileProps.contains(str)));
    _ready = true;
    onProfileUpdated();
  }

  _ready: boolean = true;

  onProfileUpdated() {
    if ( this._ready) {
      if (request.streamStatus != StreamStatus.initialize) {
        _controller.add(new RequesterListUpdate(
            node, changes.toList(), request.streamStatus));
        changes.clear();
      }
      if (request.streamStatus == StreamStatus.closed) {
        _controller.close();
      }
    }
  }

  _pendingRemoveDef: boolean = false;

  _checkRemoveDef() {
    _pendingRemoveDef = false;
  }

  onStartListen() {
    if (request == null && !waitToSend) {
      waitToSend = true;
      requester.addProcessor(this);
    }
  }
  waitToSend: boolean = false;
  startSendingData(currentTime:number, waitingAckId:number) {
    if (!waitToSend) {
      return;
    }
    request = requester._sendRequest(
              {'method': 'list', 'path': node.remotePath}, this);
    waitToSend = false;
  }

  ackReceived(receiveAckId:number, startTime:number, currentTime:number) {
  }

  void _onListen(callback(update: RequesterListUpdate)) {
    if ( this._ready && request != null) {
      DsTimer.callLater(() {
        if (request == null) {
          return;
        }

        var changes = <string>[];
        changes
          ..addAll(node.configs.keys)
          ..addAll(node.attributes.keys)
          ..addAll(node.children.keys);
        let update: RequesterListUpdate = new RequesterListUpdate(
          node,
          changes,
          request.streamStatus
        );
        callback(update);
      });
    }
  }

  _onAllCancel() {
    _destroy();
  }

  _destroy() {
    waitToSend = false;
    if ( this._profileLoader != null) {
      _profileLoader.cancel();
      _profileLoader = null;
    }
    if (request != null) {
      requester.closeRequest(request);
      request = null;
    }

    _controller.close();
    node._listController = null;
  }
}

// part of dslink.responder;

/// Base Class for responder-side nodes.
export interface LocalNode extends Node {
  _listChangeController: BroadcastStreamController<string>;

  /// Changes to nodes will be added to this controller's stream.
  /// See [updateList].
  get listChangeController(): BroadcastStreamController<string> {
    if ( this._listChangeController == null) {
      _listChangeController = new BroadcastStreamController<string>(
        () {
          onStartListListen();
        }, () {
          onAllListCancel();
        }, null, true);
    }
    return this._listChangeController;
  }

  overrideListChangeController(controller: BroadcastStreamController<string>) {
    _listChangeController = controller;
  }

  /// List Stream.
  /// See [listChangeController].
  Stream<string> get listStream => listChangeController.stream;

  /// Callback for when listing this node has started.
  void onStartListListen() {}

  /// Callback for when all lists are canceled.
  void onAllListCancel() {}

  boolean get _hasListListener => _listChangeController?.hasListener ?? false;

  /// Node Provider
  provider:NodeProvider;

  /// Node Path
  final path: string;

  LocalNode(this.path);

  /// Subscription Callbacks
  callbacks: object<ValueUpdateCallback, int> = new object<ValueUpdateCallback, int>();

  /// Subscribes the given [callback] to this node.
  RespSubscribeListener subscribe(callback(update: ValueUpdate), [qos:number = 0]) {
    callbacks[callback] = qos;
    return new RespSubscribeListener(this, callback);
  }

  /// Unsubscribe the given [callback] from this node.
  unsubscribe(callback: ValueUpdateCallback) {
    if (callbacks.containsKey(callback)) {
      callbacks.remove(callback);
    }
  }

  _lastValueUpdate: ValueUpdate;

  /// Gets the last value update of this node.
  get lastValueUpdate(): ValueUpdate {
    if ( this._lastValueUpdate == null) {
      _lastValueUpdate = new ValueUpdate(null);
    }
    return this._lastValueUpdate;
  }

  /// Gets the current value of this node.
  dynamic get value {
    if ( this._lastValueUpdate != null) {
      return this._lastValueUpdate.value;
    }
    return null;
  }

  _valueReady: boolean = false;
  /// Is the value ready?
  get valueReady(): boolean { return this._valueReady;}

  /// Updates this node's value to the specified [value].
  updateValue(update: object, {boolean force: false}) {
    _valueReady = true;
    if ( update instanceof ValueUpdate ) {
      _lastValueUpdate = update;
      callbacks.forEach((callback, qos) {
        callback( this._lastValueUpdate);
      });
    } else if ( this._lastValueUpdate == null ||
        _lastValueUpdate.value != update ||
        force) {
      _lastValueUpdate = new ValueUpdate(update);
      callbacks.forEach((callback, qos) {
        callback( this._lastValueUpdate);
      });
    }
  }

  clearValue() {
    _valueReady = false;
    _lastValueUpdate = null;
  }

  /// Checks if this node exists.
  /// list and subscribe can be called on a node that doesn't exist
  /// Other things like set remove, and invoke can only be applied to an existing node.
  get exists(): boolean { return true;}

  /// whether the node is ready for returning a list response
  get listReady(): boolean { return true;}

  /// Disconnected Timestamp
  get disconnected(): string { return null;}
  getDisconnectedListResponse():List {
    return [
      [r'$disconnectedTs', disconnected]
    ];
  }


  /// Checks if this node has a subscriber.
  /// Use this for things like polling when you
  /// only want to do something if the node is subscribed to.
  boolean get hasSubscriber => callbacks.isNotEmpty;

  /// Gets the invoke permission for this node.
  getInvokePermission():number {
    return Permission.parse(getConfig(r'$invokable'));
  }

  /// Gets the set permission for this node.
  getSetPermission():number {
    return Permission.parse(getConfig(r'$writable'));
  }

  /// Called by the link internals to invoke this node.
  invoke(
    params: {[key: string]: dynamic},
    responder: Responder,
    response: InvokeResponse,
    parentNode: Node, maxPermission:number = Permission.CONFIG):InvokeResponse {
    return response..close();
  }

  /// Called by the link internals to set an attribute on this node.
  setAttribute(
      let name: string, value: object, responder: Responder, response: Response):Response {
    if (response != null) {
      return response..close();
    } else {
      if (!name.startsWith("@")) {
        name = "@${name}";
      }

      attributes[name] = value;

      if ( provider instanceof SerializableNodeProvider ) {
        (provider as SerializableNodeProvider).persist();
      }

      return null;
    }
  }

  /// Called by the link internals to remove an attribute from this node.
  removeAttribute(
      let name: string, responder: Responder, response: Response):Response {
    if (response != null) {
      return response..close();
    } else {
      if (!name.startsWith("@")) {
        name = "@${name}";
      }

      attributes.remove(name);

      if ( provider instanceof SerializableNodeProvider ) {
        (provider as SerializableNodeProvider).persist();
      }

      return null;
    }
  }

  /// Called by the link internals to set a config on this node.
  setConfig(
      let name: string, value: object, responder: Responder, response: Response):Response {
    if (response != null) {
      return response..close();
    } else {
      if (!name.startsWith(r"$")) {
        name = "\$${name}";
      }

      configs[name] = value;

      return null;
    }
  }

  /// Called by the link internals to remove a config from this node.
  removeConfig(name: string, responder: Responder, response: Response):Response {
    if (response != null) {
      return response..close();
    } else {
      if (!name.startsWith(r"$")) {
        name = "\$${name}";
      }
      configs.remove(name);

      return null;
    }
  }

  /// Called by the link internals to set a value of a node.
  setValue(value: object, responder: Responder, response: Response,
      let maxPermission:number = Permission.CONFIG):Response {
    return response..close();
  }

  /// Shortcut to [get].
  operator [](name: string) {
    return get(name);
  }

  /// Set a config, attribute, or child on this node.
  operator []=(name: string, value: object) {
    if (name.startsWith(r"$")) {
      configs[name] = value;
    } else if (name.startsWith(r"@")) {
      attributes[name] = value;
    } else if ( value instanceof Node ) {
      addChild(name, value);
    }
  }

  load(map: {[key: string]: dynamic}) {
  }
}

/// Provides Nodes for a responder.
/// A single node provider can be reused by multiple responder.
export interface NodeProvider {
  /// Gets an existing node.
  LocalNode getNode(path: string);

  /// Gets a node at the given [path] if it exists.
  /// If it does not exist, create a new node and return it.
  ///
  /// When [addToTree] is false, the node will not be inserted into the node provider.
  LocalNode getOrCreateNode(path: string, [addToTree: boolean = true]);

  /// Gets an existing node, or creates a dummy node for a requester to listen on.
  LocalNode operator [](path: string) {
    return getNode(path);
  }

  /// Get the root node.
  LocalNode operator ~() => getOrCreateNode("/", false);

  /// Create a Responder
  Responder createResponder(dsId: string, sessionId: string);

  /// Get Permissions.
  permissions:IPermissionManager;
}

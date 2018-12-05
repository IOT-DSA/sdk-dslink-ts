// part of dslink.requester;

export class ReqSubscribeListener  implements StreamSubscription {
  callback: ValueUpdateCallback;
  requester: Requester;
  path: string;

  ReqSubscribeListener(this.requester, this.path, this.callback);

  cancel():Future {
    if (callback != null) {
      requester.unsubscribe(path, callback);
      callback = null;
    }
    return null;
  }

  // TODO: define a custom class to replace StreamSubscription
  asFuture(futureValue):Future {
    return null;
  }

  get isPaused(): boolean { return false;}

  void onData(void handleData(data)) {}

  void onDone(void handleDone()) {}

  void onError(handleError: Function) {}

  void pause([Future resumeSignal]) {}

  void resume() {}
}

/// only a place holder for reconnect and disconnect
/// real logic is in SubscribeRequest itself
export class SubscribeController  implements RequestUpdater {
  request: SubscribeRequest;

  SubscribeController();

  onDisconnect() {
    // TODO: implement onDisconnect
  }

  onReconnect() {
    // TODO: implement onReconnect
  }

  onUpdate(status: string, updates: List, columns: List, meta: object,
      let error: DSError) {
    // do nothing
  }
}

export class SubscribeRequest  extends Request implements ConnectionProcessor {
  lastSid:number = 0;

  getNextSid():number {
    do {
      if (lastSid < 0x7FFFFFFF) {
        ++lastSid;
      } else {
        lastSid = 1;
      }
    } while (subscriptionIds.containsKey(lastSid));
    return lastSid;
  }

  readonly subscriptions: {[key: string]: ReqSubscribeController} =
    new {[key: string]: ReqSubscribeController}();

  readonly subscriptionIds: object<int, ReqSubscribeController> =
    new object<int, ReqSubscribeController>();

  SubscribeRequest(requester: Requester, rid:number)
      : super(requester, rid, new SubscribeController(), null) {
    (updater as SubscribeController).request = this;
  }

  @override
  resend() {
    prepareSending();
  }

  @override
  _close(error: DSError) {
    if (subscriptions.isNotEmpty) {
      _changedPaths.addAll(subscriptions.keys);
    }
    _waitingAckCount = 0;
    _lastWatingAckId = -1;
    _sendingAfterAck = false;
  }

  @override
  _update(object m) {
    updates: List = m['updates'];
    if ( Array.isArray(updates) ) {
      for (object update in updates) {
        let path: string;
        let sid:number = -1;
        let value: object;
        let ts: string;
        let meta: object;
        if ( (update != null && update instanceof Object) ) {
          if (typeof update['ts'] === 'string') {
            path = update['path'];
            ts = update['ts'];
            if (typeof update['path'] === 'string') {
              path = update['path'];
            } else if (update['sid'] is int) {
              sid = update['sid'];
            } else {
              continue; // invalid response
            }
          }
          value = update['value'];
          meta = update;
        } else if ( Array.isArray(update) && update.length > 2) {
          if (typeof update[0] === 'string') {
            path = update[0];
          } else if (update[0] is int) {
            sid = update[0];
          } else {
            continue; // invalid response
          }
          value = update[1];
          ts = update[2];
        } else {
          continue; // invalid response
        }

        let controller: ReqSubscribeController;
        if (path != null) {
          controller = subscriptions[path];
        } else if (sid > -1) {
          controller = subscriptionIds[sid];
        }

        if (controller != null) {
          var valueUpdate = new ValueUpdate(value, ts: ts, meta: meta);
          controller.addValue(valueUpdate);
        }
      }
    }
  }

  _changedPaths: Set<string> = new Set<string>();

  addSubscription(controller: ReqSubscribeController, level:number) {
    path: string = controller.node.remotePath;
    subscriptions[path] = controller;
    subscriptionIds[controller.sid] = controller;
    prepareSending();
    _changedPaths.add(path);
  }

  removeSubscription(controller: ReqSubscribeController) {
    path: string = controller.node.remotePath;
    if (subscriptions.containsKey(path)) {
      toRemove[subscriptions[path].sid] = subscriptions[path];
      prepareSending();
    } else if (subscriptionIds.containsKey(controller.sid)) {
//      logger.severe(
          'unexpected remoteSubscription in the requester, sid: ${controller
              .sid}');
    }
  }

  toRemove: object<int, ReqSubscribeController> =
    new object<int, ReqSubscribeController>();

  startSendingData(currentTime:number, waitingAckId:number) {
    _pendingSending = false;

    if (waitingAckId != -1) {
      _waitingAckCount++;
      _lastWatingAckId = waitingAckId;
    }

    if (requester.connection == null) {
      return;
    }
    toAdd: List = [];

    processingPaths: Set<string> = this._changedPaths;
    _changedPaths = new Set<string>();
    for (string path in processingPaths) {
      if (subscriptions.containsKey(path)) {
        let sub: ReqSubscribeController = subscriptions[path];
        object m = {'path': path, 'sid': sub.sid};
        if (sub.currentQos > 0) {
          m['qos'] = sub.currentQos;
        }
        toAdd.add(m);
      }
    }
    if (!toAdd.isEmpty) {
      requester._sendRequest({'method': 'subscribe', 'paths': toAdd}, null);
    }
    if (!toRemove.isEmpty) {
      let removeSids: List = [];
      toRemove.forEach((sid:number, sub: ReqSubscribeController) {
        if (sub.callbacks.isEmpty) {
          removeSids.add(sid);
          subscriptions.remove(sub.node.remotePath);
          subscriptionIds.remove(sub.sid);
          sub._destroy();
        }
      });
      requester._sendRequest(
          {'method': 'unsubscribe', 'sids': removeSids}, null);
      toRemove.clear();
    }
  }

  _pendingSending: boolean = false;
  _waitingAckCount:number = 0;
  _lastWatingAckId:number = -1;

  ackReceived(receiveAckId:number, startTime:number, currentTime:number) {
    if (receiveAckId == this._lastWatingAckId) {
      _waitingAckCount = 0;
    } else {
      _waitingAckCount--;
    }

    if ( this._sendingAfterAck) {
      _sendingAfterAck = false;
      prepareSending();
    }
  }

  _sendingAfterAck: boolean = false;

  prepareSending() {
    if ( this._sendingAfterAck) {
      return;
    }

    if ( this._waitingAckCount > ConnectionProcessor.ACK_WAIT_COUNT) {
      _sendingAfterAck = true;
      return;
    }

    if (!_pendingSending) {
      _pendingSending = true;
      requester.addProcessor(this);
    }
  }
}

export class ReqSubscribeController  {
  readonly node: RemoteNode;
  readonly requester: Requester;

  callbacks: object<Function, int> = new object<Function, int>();
  currentQos:number = -1;
  sid:number;

  ReqSubscribeController(this.node, this.requester) {
    sid = requester._subscription.getNextSid();
  }

  void listen(callback(update: ValueUpdate), qos:number) {
    if (qos < 0 || qos > 3) {
      qos = 0;
    }
    qosChanged: boolean = false;

    if (callbacks.containsKey(callback)) {
      callbacks[callback] = qos;
      qosChanged = updateQos();
    } else {
      callbacks[callback] = qos;
      if (qos > currentQos) {
        qosChanged = true;
        currentQos = qos;
      }
      if ( this._lastUpdate != null) {
        callback( this._lastUpdate);
      }
    }

    if (qosChanged) {
      requester._subscription.addSubscription(this, currentQos);
    }
  }

  void unlisten(callback(update: ValueUpdate)) {
    if (callbacks.containsKey(callback)) {
      let cacheLevel:number = callbacks.remove(callback);
      if (callbacks.isEmpty) {
        requester._subscription.removeSubscription(this);
      } else if (cacheLevel == currentQos && currentQos > 1) {
        updateQos();
      }
    }
  }

  updateQos():boolean {
    maxQos:number = 0;

    for (var qos in callbacks.values) {
      maxQos = (qos > maxQos ? qos : maxQos);
    }

    if (maxQos != currentQos) {
      currentQos = maxQos;
      return true;
    }
    return false;
  }

  _lastUpdate: ValueUpdate;

  addValue(update: ValueUpdate) {
    _lastUpdate = update;
    for (Function callback in callbacks.keys.toList()) {
      callback( this._lastUpdate);
    }
  }

  _destroy() {
    callbacks.clear();
    node._subscribeController = null;
  }
}

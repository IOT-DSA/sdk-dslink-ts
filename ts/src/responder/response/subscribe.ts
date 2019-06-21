// part of dslink.responder;

import {ValueUpdateCallback} from "../../common/value";
import {Response} from "../response";

export class RespSubscribeListener  {
  callback: ValueUpdateCallback;
  node: LocalNode;

  RespSubscribeListener(this.node, this.callback);

  close() {
    if (callback != null) {
      node.unsubscribe(callback);
      callback = null;
    }
  }
}

export class SubscribeResponse  extends Response {
  SubscribeResponse(responder: Responder, rid:number) : super(responder, rid, 'subscribe');

  readonly subscriptions: {[key: string]: RespSubscribeController} =
    new {[key: string]: RespSubscribeController}();
  readonly subsriptionids: object<int, RespSubscribeController> =
    new object<int, RespSubscribeController>();

  readonly changed: Set<RespSubscribeController> =
    new Set<RespSubscribeController>();

  add(path: string, node: LocalNode, sid:number, qos:number):RespSubscribeController {
    controller: RespSubscribeController;
    if (subscriptions[path] != null) {
      controller = subscriptions[path];
      if (controller.sid != sid) {
        if (controller.sid >= 0) {
          subsriptionids.remove(controller.sid);
        }
        controller.sid = sid;
        if (sid >= 0) {
          subsriptionids[sid] = controller;
        }
      }
      controller.qosLevel = qos;
      if (sid > -1 && controller.lastValue != null) {
        subscriptionChanged(controller);
      }
    } else {
      let permission:number = responder.nodeProvider.permissions
          .getPermission(node.path, responder);
      controller = new RespSubscribeController(
          this, node, sid, permission >= Permission.READ, qos);
      subscriptions[path] = controller;

      if (sid >= 0) {
        subsriptionids[sid] = controller;
      }

      if (responder._traceCallbacks != null) {
        let update: ResponseTrace = new ResponseTrace(path, 'subscribe', 0, '+');
        for (ResponseTraceCallback callback of responder._traceCallbacks) {
          callback(update);
        }
      }
    }
    return controller;
  }

  remove(sid:number) {
    if (subsriptionids[sid] != null) {
      let controller: RespSubscribeController = subsriptionids[sid];
      subsriptionids[sid].destroy();
      subsriptionids.remove(sid);
      subscriptions.remove(controller.node.path);
      if (responder._traceCallbacks != null) {
        let update: ResponseTrace = new ResponseTrace(
            controller.node.path, 'subscribe', 0, '-');
        for (ResponseTraceCallback callback of responder._traceCallbacks) {
          callback(update);
        }
      }
      
      if (subsriptionids.isEmpty) {
        _waitingAckCount = 0;
      }
    }
  }

  subscriptionChanged(controller: RespSubscribeController) {
    changed.add(controller);
    prepareSending();
  }

  @override
  startSendingData(currentTime:number, waitingAckId:number) {
    _pendingSending = false;

    if (waitingAckId != -1) {
      _waitingAckCount++;
      _lastWaitingAckId = waitingAckId;
    }

    updates: List = new List();
    for (RespSubscribeController controller of changed) {
      updates.addAll(controller.process(waitingAckId));
    }
    responder.updateResponse(this, updates);
    changed.clear();
  }

  _waitingAckCount:number = 0;
  _lastWaitingAckId:number = -1;

  ackReceived(receiveAckId:number, startTime:number, currentTime:number) {
    if (receiveAckId == this._lastWaitingAckId) {
      _waitingAckCount = 0;
    } else {
      _waitingAckCount--;
    }
    subscriptions.forEach((path: string, controller: RespSubscribeController) {
      if (controller._qosLevel > 0) {
        controller.onAck(receiveAckId);
      }
    });
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
    if (responder.connection == null) {
      // don't pend send, when requester is offline
      return;
    }
    if (!_pendingSending) {
      _pendingSending = true;
      responder.addProcessor(this);
    }
  }

  _close() {
    pendingControllers: List;
    subscriptions.forEach((path, controller: RespSubscribeController) {
      if (controller._qosLevel < 2) {
        controller.destroy();
      } else {
        controller.sid = -1;
        if (pendingControllers == null) {
          pendingControllers = new List();
        }
        pendingControllers.add(controller);
      }
    });
    subscriptions.clear();
    if (pendingControllers != null) {
      for (RespSubscribeController controller of pendingControllers) {
        subscriptions[controller.node.path] = controller;
      }
    }

    subsriptionids.clear();
    _waitingAckCount = 0;
    _lastWaitingAckId = -1;
    _sendingAfterAck = false;
    _pendingSending = false;
  }

  addTraceCallback(_traceCallback: ResponseTraceCallback) {
    subscriptions.forEach((path, controller) {
      let update: ResponseTrace = new ResponseTrace(
          controller.node.path, 'subscribe', 0, '+');
      _traceCallback(update);
    });
  }
}

export class RespSubscribeController  {
  readonly node: LocalNode;
  readonly response: SubscribeResponse;
  _listener: RespSubscribeListener;
  sid:number;

  _permitted: boolean = true;

  set permitted(val: boolean) {
    if (val == this._permitted) return;
    _permitted = val;
    if ( this._permitted && lastValues.length > 0) {
      response.subscriptionChanged(this);
    }
  }

  lastValues: ValueUpdate[] = new ValueUpdate[]();
  waitingValues: ListQueue<ValueUpdate>;

  //; = new ListQueue<ValueUpdate>();
  lastValue: ValueUpdate;

  _qosLevel:number = -1;
  _storage: ISubscriptionNodeStorage;

  set qosLevel(int v) {
    if (v < 0 || v > 3) v = 0;
    if ( this._qosLevel == v)
      return;

    _qosLevel = v;
    if (waitingValues == null && this._qosLevel > 0) {
      waitingValues = new ListQueue<ValueUpdate>();
    }
    caching = (v > 0);
    cachingQueue = (v > 1);
    persist = (v > 2);
    _listener = node.subscribe(addValue, this._qosLevel);
  }

  _caching: boolean = false;

  set caching(val: boolean) {
    if (val == this._caching) return;
    _caching = val;
    if (!_caching) {
      lastValues.length = 0;
    }
  }
  cachingQueue: boolean = false;

  _persist: boolean = false;

  set persist(val: boolean) {
    if (val == this._persist) return;
    _persist = val;
    storageM: ISubscriptionResponderStorage = response.responder.storage;
    if (storageM != null) {
      if ( this._persist) {
        _storage = storageM.getOrCreateValue(node.path);
      } else if ( this._storage != null) {
        storageM.destroyValue(node.path);
        _storage = null;
      }
    }
  }

  RespSubscribeController(this.response, this.node, this.sid, this._permitted,
      let qos:number) {
    this.qosLevel = qos;
    if (node.valueReady && node.lastValueUpdate != null) {
      addValue(node.lastValueUpdate);
    }
  }

  _isCacheValid: boolean = true;

  addValue(val: ValueUpdate) {
    val = val.cloneForAckQueue();
    if ( this._caching && this._isCacheValid) {
      lastValues.add(val);
      let needClearQueue: boolean = (lastValues.length > response.responder.maxCacheLength);
      if (!needClearQueue && !cachingQueue && response._sendingAfterAck && lastValues.length > 1) {
        needClearQueue = true;
      }
      if (needClearQueue) {
        // cache is no longer valid, fallback to rollup mode
        _isCacheValid = false;
        lastValue = new ValueUpdate(null, ts: '');
        for (ValueUpdate update of lastValues) {
          lastValue.mergeAdd(update);
        }
        lastValues.length = 0;
        if ( this._qosLevel > 0) {
          if ( this._storage != null) {
            _storage.setValue(waitingValues, lastValue);
          }
          waitingValues
            ..clear()
            ..add(lastValue);
        }
      } else {
        lastValue = val;
        if ( this._qosLevel > 0) {
          waitingValues.add(lastValue);
          if ( this._storage != null) {
            _storage.addValue(lastValue);
          }
        }
      }
    } else {
      if (lastValue != null) {
        lastValue = new ValueUpdate.merge(lastValue, val);
      } else {
        lastValue = val;
      }
      if ( this._qosLevel > 0) {
        if ( this._storage != null) {
          _storage.setValue(waitingValues, lastValue);
        }
        waitingValues
          ..clear()
          ..add(lastValue);
      }
    }
    // TODO, don't allow this to be called from same controller more often than 100ms
    // the first response can happen ASAP, but
    if ( this._permitted && sid > -1) {
      response.subscriptionChanged(this);
    }
  }

  process(waitingAckId:number):List {
    rslts: List = new List();
    if ( this._caching && this._isCacheValid) {
      for (ValueUpdate lastValue of lastValues) {
        rslts.add([sid, lastValue.value, lastValue.ts]);
      }

      if ( this._qosLevel > 0) {
        for (ValueUpdate update of lastValues) {
          update.waitingAck = waitingAckId;
        }
      }
      lastValues.length = 0;
    } else {
      if (lastValue.count > 1 || lastValue.status != null) {
        object m = lastValue.toMap();
        m['sid'] = sid;
        rslts.add(m);
      } else {
        rslts.add([sid, lastValue.value, lastValue.ts]);
      }
      if ( this._qosLevel > 0) {
        lastValue.waitingAck = waitingAckId;
      }
      _isCacheValid = true;
    }
    lastValue = null;
    return rslts;
  }

  onAck(ackId:number) {
    if (waitingValues.isEmpty) {
      return;
    }
    valueRemoved: boolean = false;
    if (!waitingValues.isEmpty && waitingValues.first.waitingAck != ackId) {
      let matchUpdate: ValueUpdate;
      for (ValueUpdate update of waitingValues) {
        if (update.waitingAck == ackId) {
          matchUpdate = update;
          break;
        }
      }

      if (matchUpdate != null) {
        while (!waitingValues.isEmpty && waitingValues.first != matchUpdate) {
          let removed: ValueUpdate = waitingValues.removeFirst();
          if ( this._storage != null) {
            _storage.removeValue(removed);
            valueRemoved = true;
          }
        }
      }
    }

    while (!waitingValues.isEmpty && waitingValues.first.waitingAck == ackId) {
      let removed: ValueUpdate = waitingValues.removeFirst();
      if ( this._storage != null) {
        _storage.removeValue(removed);
        valueRemoved = true;
      }
    }

    if (valueRemoved && this._storage != null) {
      _storage.valueRemoved(waitingValues);
    }
  }

  resetCache(values: ValueUpdate[]) {
    if (this._caching) {
      if (lastValues.length > 0 && lastValues.first.equals(values.last)) {
        lastValues.removeAt(0);
      }
      lastValues = values..addAll(lastValues);
      if (waitingValues != null) {
        waitingValues.clear();
        waitingValues.addAll(lastValues);
      }
    } else {
      lastValues.length = 0;
      if (waitingValues != null) {
        waitingValues.clear();
        waitingValues.add(values.last);
      }
    }
    lastValue = values.last;
  }

  destroy() {
    if ( this._storage != null) {
      let storageM: ISubscriptionResponderStorage = response.responder.storage;
      storageM.destroyValue(node.path);
      _storage = null;
    }
    _listener.close();
  }
}

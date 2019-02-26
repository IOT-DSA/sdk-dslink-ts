"use strict";
// part of dslink.responder;
Object.defineProperty(exports, "__esModule", { value: true });
class RespSubscribeListener {
    close() {
        if (callback != null) {
            node.unsubscribe(callback);
            callback = null;
        }
    }
}
exports.RespSubscribeListener = RespSubscribeListener;
class SubscribeResponse extends Response {
}
exports.SubscribeResponse = SubscribeResponse;
(responder, rid, 'subscribe');
subscriptions: {
    [key, string];
    RespSubscribeController;
}
new { [key]: string, RespSubscribeController }();
subsriptionids: object < int, RespSubscribeController > ;
new object();
changed: LinkedHashSet < RespSubscribeController > ;
new LinkedHashSet();
add(path, string, node, LocalNode, sid, number, qos, number);
RespSubscribeController;
{
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
    }
    else {
        let permission = responder.nodeProvider.permissions
            .getPermission(node.path, responder);
        controller = new RespSubscribeController(this, node, sid, permission >= Permission.READ, qos);
        subscriptions[path] = controller;
        if (sid >= 0) {
            subsriptionids[sid] = controller;
        }
        if (responder._traceCallbacks != null) {
            let update = new ResponseTrace(path, 'subscribe', 0, '+');
            for (ResponseTraceCallback; callback; of)
                responder._traceCallbacks;
            {
                callback(update);
            }
        }
    }
    return controller;
}
remove(sid, number);
{
    if (subsriptionids[sid] != null) {
        let controller = subsriptionids[sid];
        subsriptionids[sid].destroy();
        subsriptionids.remove(sid);
        subscriptions.remove(controller.node.path);
        if (responder._traceCallbacks != null) {
            let update = new ResponseTrace(controller.node.path, 'subscribe', 0, '-');
            for (ResponseTraceCallback; callback; of)
                responder._traceCallbacks;
            {
                callback(update);
            }
        }
        if (subsriptionids.isEmpty) {
            _waitingAckCount = 0;
        }
    }
}
subscriptionChanged(controller, RespSubscribeController);
{
    changed.add(controller);
    prepareSending();
}
startSendingData(currentTime, number, waitingAckId, number);
{
    _pendingSending = false;
    if (waitingAckId != -1) {
        _waitingAckCount++;
        _lastWaitingAckId = waitingAckId;
    }
    updates: List = new List();
    for (RespSubscribeController; controller; of)
        changed;
    {
        updates.addAll(controller.process(waitingAckId));
    }
    responder.updateResponse(this, updates);
    changed.clear();
}
_waitingAckCount: number = 0;
_lastWaitingAckId: number = -1;
ackReceived(receiveAckId, number, startTime, number, currentTime, number);
{
    if (receiveAckId == this._lastWaitingAckId) {
        _waitingAckCount = 0;
    }
    else {
        _waitingAckCount--;
    }
    subscriptions.forEach((path, controller) => {
        if (controller._qosLevel > 0) {
            controller.onAck(receiveAckId);
        }
    });
    if (this._sendingAfterAck) {
        _sendingAfterAck = false;
        prepareSending();
    }
}
_sendingAfterAck: boolean = false;
prepareSending();
{
    if (this._sendingAfterAck) {
        return;
    }
    if (this._waitingAckCount > ConnectionProcessor.ACK_WAIT_COUNT) {
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
_close();
{
    pendingControllers: List;
    subscriptions.forEach((path, controller) => {
        if (controller._qosLevel < 2) {
            controller.destroy();
        }
        else {
            controller.sid = -1;
            if (pendingControllers == null) {
                pendingControllers = new List();
            }
            pendingControllers.add(controller);
        }
    });
    subscriptions.clear();
    if (pendingControllers != null) {
        for (RespSubscribeController; controller; of)
            pendingControllers;
        {
            subscriptions[controller.node.path] = controller;
        }
    }
    subsriptionids.clear();
    _waitingAckCount = 0;
    _lastWaitingAckId = -1;
    _sendingAfterAck = false;
    _pendingSending = false;
}
addTraceCallback(_traceCallback, ResponseTraceCallback);
{
    subscriptions.forEach((path, controller) => {
        let update = new ResponseTrace(controller.node.path, 'subscribe', 0, '+');
        _traceCallback(update);
    });
}
class RespSubscribeController {
    constructor() {
        this._permitted = true;
        this.lastValues = new ValueUpdate[]();
        this._qosLevel = -1;
        this._caching = false;
        this.cachingQueue = false;
        this._persist = false;
        this._isCacheValid = true;
    }
    set permitted(val) {
        if (val == this._permitted)
            return;
        _permitted = val;
        if (this._permitted && lastValues.length > 0) {
            response.subscriptionChanged(this);
        }
    }
    set qosLevel(int, v) {
        if (v < 0 || v > 3)
            v = 0;
        if (this._qosLevel == v)
            return;
        _qosLevel = v;
        if (waitingValues == null && this._qosLevel > 0) {
            waitingValues = new ListQueue();
        }
        caching = (v > 0);
        cachingQueue = (v > 1);
        persist = (v > 2);
        _listener = node.subscribe(addValue, this._qosLevel);
    }
    set caching(val) {
        if (val == this._caching)
            return;
        _caching = val;
        if (!_caching) {
            lastValues.length = 0;
        }
    }
    set persist(val) {
        if (val == this._persist)
            return;
        _persist = val;
        storageM: ISubscriptionResponderStorage = response.responder.storage;
        if (storageM != null) {
            if (this._persist) {
                _storage = storageM.getOrCreateValue(node.path);
            }
            else if (this._storage != null) {
                storageM.destroyValue(node.path);
                _storage = null;
            }
        }
    }
    RespSubscribeController(response, node, sid, _permitted, let, qos) {
        this.qosLevel = qos;
        if (node.valueReady && node.lastValueUpdate != null) {
            addValue(node.lastValueUpdate);
        }
    }
    addValue(val) {
        val = val.cloneForAckQueue();
        if (this._caching && this._isCacheValid) {
            lastValues.add(val);
            let needClearQueue = (lastValues.length > response.responder.maxCacheLength);
            if (!needClearQueue && !cachingQueue && response._sendingAfterAck && lastValues.length > 1) {
                needClearQueue = true;
            }
            if (needClearQueue) {
                // cache is no longer valid, fallback to rollup mode
                _isCacheValid = false;
                lastValue = new ValueUpdate(null, ts, '');
                for (ValueUpdate; update; of)
                    lastValues;
                {
                    lastValue.mergeAdd(update);
                }
                lastValues.length = 0;
                if (this._qosLevel > 0) {
                    if (this._storage != null) {
                        _storage.setValue(waitingValues, lastValue);
                    }
                    waitingValues
                        ..clear()
                        ..add(lastValue);
                }
            }
            else {
                lastValue = val;
                if (this._qosLevel > 0) {
                    waitingValues.add(lastValue);
                    if (this._storage != null) {
                        _storage.addValue(lastValue);
                    }
                }
            }
        }
        else {
            if (lastValue != null) {
                lastValue = new ValueUpdate.merge(lastValue, val);
            }
            else {
                lastValue = val;
            }
            if (this._qosLevel > 0) {
                if (this._storage != null) {
                    _storage.setValue(waitingValues, lastValue);
                }
                waitingValues
                    ..clear()
                    ..add(lastValue);
            }
        }
        // TODO, don't allow this to be called from same controller more often than 100ms
        // the first response can happen ASAP, but
        if (this._permitted && sid > -1) {
            response.subscriptionChanged(this);
        }
    }
    process(waitingAckId) {
        rslts: List = new List();
        if (this._caching && this._isCacheValid) {
            for (ValueUpdate; lastValue; of)
                lastValues;
            {
                rslts.add([sid, lastValue.value, lastValue.ts]);
            }
            if (this._qosLevel > 0) {
                for (ValueUpdate; update; of)
                    lastValues;
                {
                    update.waitingAck = waitingAckId;
                }
            }
            lastValues.length = 0;
        }
        else {
            if (lastValue.count > 1 || lastValue.status != null) {
                object;
                m = lastValue.toMap();
                m['sid'] = sid;
                rslts.add(m);
            }
            else {
                rslts.add([sid, lastValue.value, lastValue.ts]);
            }
            if (this._qosLevel > 0) {
                lastValue.waitingAck = waitingAckId;
            }
            _isCacheValid = true;
        }
        lastValue = null;
        return rslts;
    }
    onAck(ackId) {
        if (waitingValues.isEmpty) {
            return;
        }
        valueRemoved: boolean = false;
        if (!waitingValues.isEmpty && waitingValues.first.waitingAck != ackId) {
            let matchUpdate;
            for (ValueUpdate; update; of)
                waitingValues;
            {
                if (update.waitingAck == ackId) {
                    matchUpdate = update;
                    break;
                }
            }
            if (matchUpdate != null) {
                while (!waitingValues.isEmpty && waitingValues.first != matchUpdate) {
                    let removed = waitingValues.removeFirst();
                    if (this._storage != null) {
                        _storage.removeValue(removed);
                        valueRemoved = true;
                    }
                }
            }
        }
        while (!waitingValues.isEmpty && waitingValues.first.waitingAck == ackId) {
            let removed = waitingValues.removeFirst();
            if (this._storage != null) {
                _storage.removeValue(removed);
                valueRemoved = true;
            }
        }
        if (valueRemoved && this._storage != null) {
            _storage.valueRemoved(waitingValues);
        }
    }
    resetCache(values) {
        if (this._caching) {
            if (lastValues.length > 0 && lastValues.first.equals(values.last)) {
                lastValues.removeAt(0);
            }
            lastValues = values..addAll(lastValues);
            if (waitingValues != null) {
                waitingValues.clear();
                waitingValues.addAll(lastValues);
            }
        }
        else {
            lastValues.length = 0;
            if (waitingValues != null) {
                waitingValues.clear();
                waitingValues.add(values.last);
            }
        }
        lastValue = values.last;
    }
    destroy() {
        if (this._storage != null) {
            let storageM = response.responder.storage;
            storageM.destroyValue(node.path);
            _storage = null;
        }
        _listener.close();
    }
}
exports.RespSubscribeController = RespSubscribeController;
//# sourceMappingURL=subscribe.js.map
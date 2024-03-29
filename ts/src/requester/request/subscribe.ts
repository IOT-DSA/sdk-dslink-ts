import {Closable} from '../../utils/async';
import {Request} from '../request';
import {Requester} from '../requester';
import {ConnectionProcessor, DsError} from '../../common/interfaces';
import {ValueUpdate, ValueUpdateCallback} from '../../common/value';
import {RemoteNode} from '../node_cache';
import {DSA_CONFIG} from '../../common/connection-handler';
import {RequestUpdater} from '../interface';
import {logError} from '../../utils/error-callback';

// delay 3s for web appilcation and 50ms for nodejs
const UNSUBSCRIBE_DELAY_MS = typeof window === 'undefined' ? 50 : 3000;

export class ReqSubscribeListener implements Closable {
  timeout: any;

  /** @ignore */
  constructor(
    public requester: Requester,
    public path: string,
    public callback: ValueUpdateCallback,
    qos: number,
    timeout: number
  ) {
    let node: RemoteNode = requester.nodeCache.getRemoteNode(path);

    if (timeout) {
      this.timeout = setTimeout(this.onTimeOut, timeout);
    }
    node._subscribe(requester, this.callbackWrapper, qos);
  }

  callbackWrapper = (value: ValueUpdate) => {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    try {
      this.callback?.(value);
    } catch (e) {
      logError(e);
    }
  };

  onTimeOut = () => {
    this.timeout = null;
    this.callbackWrapper(new ValueUpdate(null, null, {status: 'unknown'}));
  };

  close() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.callback = null;
    setTimeout(() => {
      this.requester.unsubscribe(this.path, this.callbackWrapper);
    }, UNSUBSCRIBE_DELAY_MS);
  }
}

/// only a place holder for reconnect and disconnect
/// real logic is in SubscribeRequest itself
/** @ignore */
export class SubscribeController implements RequestUpdater {
  request: SubscribeRequest;

  onDisconnect() {
    // TODO: implement onDisconnect
  }

  onReconnect() {
    // TODO: implement onReconnect
  }

  onUpdate(status: string, updates: any[], columns: any[], meta: {[key: string]: any}, error: DsError) {
    // do nothing
  }
}

/** @ignore */
export class SubscribeRequest extends Request implements ConnectionProcessor {
  lastSid: number = 0;

  getNextSid(): number {
    do {
      if (this.lastSid < 0x7fffffff) {
        ++this.lastSid;
      } else {
        this.lastSid = 1;
      }
    } while (this.subscriptionIds.has(this.lastSid));
    return this.lastSid;
  }

  readonly subscriptions: Map<string, ReqSubscribeController> = new Map();

  readonly subscriptionIds: Map<number, ReqSubscribeController> = new Map();

  constructor(requester: Requester, rid: number) {
    super(requester, rid, new SubscribeController(), null);
    (this.updater as SubscribeController).request = this;
  }

  resend() {
    this.prepareSending();
  }

  _close(error: DsError) {
    if (this.subscriptions.size > 0) {
      for (let [key, s] of this.subscriptions) {
        this._changedPaths.add(key);
      }
    }
    this._waitingAckCount = 0;
    this._lastWatingAckId = -1;
    this._sendingAfterAck = false;
  }

  _update(m: {[key: string]: any}) {
    let updates = m['updates'];
    if (Array.isArray(updates)) {
      for (let update of updates) {
        let path: string;
        let sid = -1;
        let value: {[key: string]: any};
        let ts: string;
        let options: {[key: string]: any};
        if (Array.isArray(update) && update.length > 2) {
          if (typeof update[0] === 'string') {
            path = update[0];
          } else if (typeof update[0] === 'number') {
            sid = update[0];
          } else {
            continue; // invalid response
          }
          value = update[1];
          ts = update[2];
        } else if (update != null && update instanceof Object) {
          if (typeof update['ts'] === 'string') {
            path = update['path'];
            ts = update['ts'];
            if (typeof update['path'] === 'string') {
              path = update['path'];
            } else if (typeof update['sid'] === 'number') {
              sid = update['sid'];
            } else {
              continue; // invalid response
            }
          }
          value = update['value'];
          options = update;
        } else {
          continue; // invalid response
        }

        let controller: ReqSubscribeController;
        if (path != null) {
          controller = this.subscriptions.get(path);
        } else if (sid > -1) {
          controller = this.subscriptionIds.get(sid);
        }

        if (controller != null) {
          let valueUpdate = new ValueUpdate(value, ts, options);
          controller.addValue(valueUpdate);
        }
      }
    }
  }

  _changedPaths: Set<string> = new Set<string>();
  toRemove: Map<number, ReqSubscribeController> = new Map();

  addSubscription(controller: ReqSubscribeController, level: number) {
    let path: string = controller.node.remotePath;
    this.subscriptions.set(path, controller);
    this.subscriptionIds.set(controller.sid, controller);
    this.prepareSending();
    this._changedPaths.add(path);
  }

  removeSubscription(controller: ReqSubscribeController) {
    let path: string = controller.node.remotePath;
    if (this.subscriptions.has(path)) {
      this.toRemove.set(this.subscriptions.get(path).sid, this.subscriptions.get(path));
      this.prepareSending();
    } else if (this.subscriptionIds.has(controller.sid)) {
      console.error(`unexpected remoteSubscription in the requester, sid: ${controller.sid}`);
    }
  }

  startSendingData(currentTime: number, waitingAckId: number) {
    this._pendingSending = false;

    if (waitingAckId !== -1) {
      this._waitingAckCount++;
      this._lastWatingAckId = waitingAckId;
    }

    if (this.requester.connection == null) {
      return;
    }
    let toAdd: any[] = [];

    let processingPaths: Set<string> = this._changedPaths;
    if (processingPaths.size > 32) {
      processingPaths = new Set<string>();
      let pendingPaths = new Set<string>();
      let count = 0;
      for (let path of this._changedPaths) {
        if (++count > 32) {
          pendingPaths.add(path);
        } else {
          processingPaths.add(path);
        }
      }
      this._changedPaths = pendingPaths;
      this.prepareSending();
    } else {
      this._changedPaths = new Set<string>();
    }
    for (let path of processingPaths) {
      if (this.subscriptions.has(path)) {
        let sub: ReqSubscribeController = this.subscriptions.get(path);
        let m: any = {path, sid: sub.sid};
        if (sub.currentQos > 0) {
          m['qos'] = sub.currentQos;
        }
        toAdd.push(m);
      }
    }
    if (toAdd.length > 0) {
      this.requester._sendRequest({method: 'subscribe', paths: toAdd}, null);
    }
    if (this.toRemove.size > 0) {
      let removeSids: any[] = [];
      for (let [sid, sub] of this.toRemove) {
        if (removeSids.length >= 32) {
          this.prepareSending();
          break;
        }
        if (sub.callbacks.size === 0) {
          removeSids.push(sid);
          this.subscriptions.delete(sub.node.remotePath);
          this.subscriptionIds.delete(sub.sid);
          sub._destroy();
        }
        this.toRemove.delete(sid);
      }
      this.requester._sendRequest({method: 'unsubscribe', sids: removeSids}, null);
    }
  }

  _pendingSending: boolean = false;
  _waitingAckCount: number = 0;
  _lastWatingAckId: number = -1;

  ackReceived(receiveAckId: number, startTime: number, currentTime: number) {
    if (receiveAckId === this._lastWatingAckId) {
      this._waitingAckCount = 0;
    } else {
      this._waitingAckCount--;
    }

    if (this._sendingAfterAck) {
      this._sendingAfterAck = false;
      this.prepareSending();
    }
  }

  _sendingAfterAck: boolean = false;

  prepareSending() {
    if (this._sendingAfterAck) {
      return;
    }

    if (this._waitingAckCount > DSA_CONFIG.ackWaitCount) {
      this._sendingAfterAck = true;
      return;
    }

    if (!this._pendingSending) {
      this._pendingSending = true;
      this.requester.addProcessor(this);
    }
  }
}

/** @ignore */
export class ReqSubscribeController {
  readonly node: RemoteNode;
  readonly requester: Requester;

  callbacks: Map<(update: ValueUpdate) => void, number> = new Map<(update: ValueUpdate) => void, number>();
  currentQos: number = -1;
  sid: number;

  constructor(node: RemoteNode, requester: Requester) {
    this.node = node;
    this.requester = requester;
    this.sid = requester._subscription.getNextSid();
  }

  listen(callback: (update: ValueUpdate) => void, qos: number) {
    if (qos < 0 || qos > 3) {
      qos = 0;
    }
    let qosChanged = false;

    if (this.callbacks.has(callback)) {
      this.callbacks.set(callback, qos);
      qosChanged = this.updateQos();
    } else {
      this.callbacks.set(callback, qos);
      if (qos > this.currentQos) {
        qosChanged = true;
        this.currentQos = qos;
      }
      if (this._lastUpdate != null) {
        setTimeout(() => {
          if (this.callbacks.has(callback) && this._lastUpdate != null) {
            callback(this._lastUpdate);
          }
        }, 0);
      }
    }

    if (qosChanged) {
      this.requester._subscription.addSubscription(this, this.currentQos);
    }
  }

  unlisten(callback: (update: ValueUpdate) => void) {
    if (this.callbacks.has(callback)) {
      let cacheLevel = this.callbacks.get(callback);
      this.callbacks.delete(callback);
      if (this.callbacks.size === 0) {
        this.requester._subscription.removeSubscription(this);
      } else if (cacheLevel === this.currentQos && this.currentQos > 1) {
        this.updateQos();
      }
    }
  }

  updateQos(): boolean {
    let maxQos = 0;

    for (let qos of this.callbacks.values()) {
      maxQos = qos > maxQos ? qos : maxQos;
    }

    if (maxQos !== this.currentQos) {
      this.currentQos = maxQos;
      return true;
    }
    return false;
  }

  _lastUpdate: ValueUpdate;

  addValue(update: ValueUpdate) {
    this._lastUpdate = update;

    for (let callback of Array.from(this.callbacks.keys())) {
      callback(this._lastUpdate);
    }
  }

  _destroy() {
    this.callbacks.clear();
    this.node._subscribeController = null;
  }
}

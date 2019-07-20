import {RequesterUpdate, RequestUpdater} from "./interface";
import {Listener, Stream, StreamSubscription} from "../utils/async";
import {Request} from "./request";
import {ConnectionHandler} from "../common/connection-handler";
import {RemoteNode, RemoteNodeCache} from "./node_cache";
import {ReqSubscribeListener, SubscribeRequest} from "./request/subscribe";
import {DsError, ProcessorResult, StreamStatus} from "../common/interfaces";
import {ValueUpdate} from "../common/value";
import {ListController, RequesterListUpdate} from "./request/list";
import {Permission} from "../common/permission";
import {RequesterInvokeStream, RequesterInvokeUpdate} from "./request/invoke";
import {SetController} from "./request/set";
import {RemoveController} from "./request/remove";


export class Requester extends ConnectionHandler {
  /** @ignore */
  _requests: Map<number, Request> = new Map<number, Request>();

  /// caching of nodes
  /** @ignore */
  readonly nodeCache: RemoteNodeCache;
  /** @ignore */
  _subscription: SubscribeRequest;

  constructor(cache?: RemoteNodeCache) {
    super();
    this.nodeCache = cache ? cache : new RemoteNodeCache();
    this._subscription = new SubscribeRequest(this, 0);
    this._requests.set(0, this._subscription);
  }

  get subscriptionCount(): number {
    return this._subscription.subscriptions.size;
  }

  get openRequestCount(): number {
    return this._requests.size;
  }

  /** @ignore */
  onData = (list: any[]) => {
    if (Array.isArray(list)) {
      for (let resp of list) {
        if ((resp != null && resp instanceof Object)) {
          this._onReceiveUpdate(resp);
        }
      }
    }
  };

  /** @ignore */
  _onReceiveUpdate(m: any) {
    if (typeof m['rid'] === 'number' && this._requests.has(m['rid'])) {
      this._requests.get(m['rid'])._update(m);
    }
  }

  /** @ignore */
  onError: Stream<DsError> = new Stream<DsError>();

  /** @ignore */
  lastRid = 0;

  /** @ignore */
  getNextRid(): number {
    do {
      if (this.lastRid < 0x7FFFFFFF) {
        ++this.lastRid;
      } else {
        this.lastRid = 1;
      }
    } while (this._requests.has(this.lastRid));
    return this.lastRid;
  }

  /** @ignore */
  getSendingData(currentTime: number, waitingAckId: number): ProcessorResult {
    let rslt: ProcessorResult = super.getSendingData(currentTime, waitingAckId);
    return rslt;
  }

  /** @ignore */
  sendRequest(m: {[key: string]: any}, updater: RequestUpdater) {
    return this._sendRequest(m, updater);
  }

  /** @ignore */
  _sendRequest(m: {[key: string]: any}, updater: RequestUpdater): Request {
    m['rid'] = this.getNextRid();
    let req: Request;
    if (updater != null) {
      req = new Request(this, this.lastRid, updater, m);
      this._requests.set(this.lastRid, req);
    }
    if (this._conn) {
      this.addToSendList(m);
    }
    return req;
  }

  isNodeCached(path: string): boolean {
    return this.nodeCache.isNodeCached(path);
  }

  /**
   * Subscribe a path and get value updates in a async callback
   * If you only need to get the current value once, use [[subscribeOnce]] instead.
   *
   * A Subscription listener should be closed with [[ReqSubscribeListener.close]] when it's no longer needed.
   * You can also use the [[unsubscribe]] method to close the callback.
   *
   * @param callback - if same callback is subscribed twice, the previous one will be overwritten with new qos value
   * @param qos - qos level of the subscription
   *   - 0: allow value skipping as long as the last update is received
   *   - 1: no value skipping
   */
  subscribe(path: string, callback: (update: ValueUpdate) => void,
            qos: number = 0): ReqSubscribeListener {
    let node: RemoteNode = this.nodeCache.getRemoteNode(path);
    node._subscribe(this, callback, qos);
    return new ReqSubscribeListener(this, path, callback);
  }

  /**
   * Unsubscribe the callback
   */
  unsubscribe(path: string, callback: (update: ValueUpdate) => void) {
    let node: RemoteNode = this.nodeCache.getRemoteNode(path);
    node._unsubscribe(this, callback);
  }

  /** @ignore */
  onValueChange(path: string, qos: number = 0): Stream<ValueUpdate> {
    let listener: ReqSubscribeListener;
    let stream: Stream<ValueUpdate>;
    stream = new Stream<ValueUpdate>(() => {

      if (listener == null) {
        listener = this.subscribe(path, (update: ValueUpdate) => {
          stream.add(update);
        }, qos);
      }
    }, () => {
      if (listener) {
        listener.close();
        listener = null;
      }
    });
    return stream;
  }

  /**
   * Subscribe and get value update only once, subscription will be closed automatically when an update is received
   */
  subscribeOnce(path: string, timeoutMs: number = 0): Promise<ValueUpdate> {
    return new Promise((resolve, reject) => {
      let timer: any;
      let listener = this.subscribe(path, (update: ValueUpdate) => {
        resolve(update);

        if (listener != null) {
          listener.close();
          listener = null;
        }
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      });
      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          timer = null;
          if (listener) {
            listener.close();
            listener = null;
          }
          reject(new Error(`failed to receive value, timeout: ${timeoutMs}ms`));
        }, timeoutMs);
      }
    });
  }

  /**
   * List and get node metadata and children summary only once, subscription will be closed automatically when an update is received
   */
  listOnce(path: string): Promise<RemoteNode> {
    return new Promise((resolve, reject) => {
      let sub = this.list(path, (update) => {
        resolve(update.node);

        if (sub != null) {
          sub.close();
        }
      });
    });

  }

  /**
   * List a path and get the node metadata as well as a summary of children nodes.
   * This method will keep a stream and continue to get updates. If you only need to get the current value once, use [[listOnce]] instead.
   *
   * A Subscription should be closed with [[StreamSubscription.close]] when it's no longer needed.
   */

  list(path: string, callback: Listener<RequesterListUpdate>): StreamSubscription<RequesterListUpdate> {
    let node: RemoteNode = this.nodeCache.getRemoteNode(path);
    return node._list(this).listen(callback);
  }

  /**
   * Invoke a node action, and receive updates.
   * Usually an action stream will be closed on server side,
   * but in the case of a streaming action the returned stream needs to be closed with [[RequesterInvokeStream.close]]
   */
  invoke(path: string, params: {[key: string]: any} = {}, callback?: Listener<RequesterInvokeUpdate>,
         maxPermission: number = Permission.CONFIG): RequesterInvokeStream {
    let node: RemoteNode = this.nodeCache.getRemoteNode(path);
    let stream = node._invoke(params, this, maxPermission);

    let mergedUpdate: any[] = [];
    let mappedStream: RequesterInvokeStream = new RequesterInvokeStream();
    mappedStream.request = stream.request;
    stream.listen((update: RequesterInvokeUpdate) => {
      if (mergedUpdate) {
        update.updates = mergedUpdate.concat(update.updates);
      }
      mergedUpdate = update.updates;
      if (update.streamStatus !== 'initialize') {
        mappedStream.add(update);
      }
    });

    if (callback) {
      mappedStream.listen(callback);
    }
    return mappedStream;
  }

  /**
   * Invoke a node action, and receive update only once, stream will be closed automatically if necessary
   */
  invokeOnce(path: string, params: {[key: string]: any} = {}, maxPermission: number = Permission.CONFIG): Promise<RequesterInvokeUpdate> {
    let stream = this.invoke(path, params, null, maxPermission);
    return new Promise((resolve, reject) => {

      stream.listen((update: RequesterInvokeUpdate) => {

        if (update.streamStatus !== "closed") {
          stream.close();
        }
        if (update.error) {
          reject(update.error);
        } else {
          resolve(update);
        }
      });
    });
  }

  /**
   * Invoke a node action, and receive raw update.
   * Steaming updates won't be merged
   */
  invokeStream(path: string, params: {[key: string]: any} = {}, callback?: Listener<RequesterInvokeUpdate>,
         maxPermission: number = Permission.CONFIG): RequesterInvokeStream {
    let node: RemoteNode = this.nodeCache.getRemoteNode(path);
    let stream = node._invoke(params, this, maxPermission);

    if (callback) {
      stream.listen(callback);
    }
    return stream;
  }

  /**
   * Set the value of an attribute, the attribute will be created if not exists
   */
  set(path: string, value: any,
      maxPermission: number = Permission.CONFIG): Promise<RequesterUpdate> {
    return new SetController(this, path, value, maxPermission).future;
  }

  /**
   * Remove an attribute
   */
  remove(path: string): Promise<RequesterUpdate> {
    return new RemoveController(this, path).future;
  }

  /// close the request from requester side and notify responder
  /** @ignore */
  closeRequest(request: Request) {
    if (this._requests.has(request.rid)) {
      if (request.streamStatus !== "closed") {
        this.addToSendList({'method': 'close', 'rid': request.rid});
      }
      this._requests.delete(request.rid);
      request.close();
    }
  }

  /** @ignore */
  _connected: boolean = false;

  /** @ignore */
  onDisconnected() {
    if (!this._connected) return;
    this._connected = false;

    let newRequests = new Map<number, Request>();
    newRequests.set(0, this._subscription);
    for (let [n, req] of this._requests) {
      if (req.rid <= this.lastRid && !(req.updater instanceof ListController)) {
        req._close(DsError.DISCONNECTED);
      } else {
        newRequests.set(req.rid, req);
        req.updater.onDisconnect();
      }
    }
    this._requests = newRequests;
  }

  /** @ignore */
  onReconnected() {
    if (this._connected) return;
    this._connected = true;

    super.onReconnected();

    for (let [n, req] of this._requests) {
      req.updater.onReconnect();
      req.resend();
    }
  }
}

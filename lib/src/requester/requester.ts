//typedef T RequestConsumer<T>(request: Request);

import {Stream} from "../utils/async";
import {Request} from "./request";
import {ConnectionHandler} from "../common/connection_handler";
import {RemoteNodeCache} from "./node_cache";
import {SubscribeRequest} from "./request/subscribe";
import {DSError} from "../common/interfaces";

type RequestConsumer<T> = (request: Request) => T;

export interface RequestUpdater {
  onUpdate(status: string, updates: any[], columns: any[], meta: {[key: string]: any}, error: DSError): void;

  onDisconnect(): void;

  onReconnect(): void;
}

export class RequesterUpdate {
  readonly streamStatus: string;

  constructor(streamStatus: string) {
    this.streamStatus = streamStatus;
  }
}

export class Requester extends ConnectionHandler {
  _requests: Map<number, Request> = new Map<number, Request>();

  /// caching of nodes
  readonly nodeCache: RemoteNodeCache;

  _subscription: SubscribeRequest;

  constructor(cache?: RemoteNodeCache) {
    super();
    this.nodeCache = cache ? cache : new RemoteNodeCache();
    this._subscription = new SubscribeRequest(this, 0);
    this._requests.set(0, this._subscription);
  }

  get subscriptionCount(): number {
    return this._subscription.subscriptions.length;
  }

  get openRequestCount(): number {
    return this._requests.size;
  }

  onData(list: any[]) {
    for (let resp: any of list) {
      if ((resp != null && resp instanceof Object)) {
        this._onReceiveUpdate(resp);
      }
    }
  }

  _onReceiveUpdate(m: any) {
    if (typeof m['rid'] === 'number' && this._requests.has(m['rid'])) {
      this._requests.get(m['rid'])._update(m);
    }
  }

  onError: Stream<DSError> = new Stream<DSError>();


  lastRid = 0;

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

  getSendingData(currentTime: number, waitingAckId: number): ProcessorResult {
    let rslt: ProcessorResult = super.getSendingData(currentTime, waitingAckId);
    return rslt;
  }

  sendRequest(m: {[key: string]: any}, updater: RequestUpdater) {
    return this._sendRequest(m, updater);
  }


  _sendRequest(m: {[key: string]: any}, updater: RequestUpdater): Request {
    m['rid'] = this.getNextRid();
    let req: Request;
    if (updater != null) {
      req = new Request(this, this.lastRid, updater, m);
      this._requests.set(this.lastRid, req);
    }
    this.addToSendList(m);
    return req;
  }

  isNodeCached(path: string): boolean {
    return this.nodeCache.isNodeCached(path);
  }

  subscribe(path: string, callback: (update: ValueUpdate) => void,
            qos?: number = 0): ReqSubscribeListener {
    let node: RemoteNode = this.nodeCache.getRemoteNode(path);
    node._subscribe(this, callback, qos);
    return new ReqSubscribeListener(this, path, callback);
  }

  onValueChange(path: string, qos: number = 0): Stream<ValueUpdate> {
    let listener: ReqSubscribeListener;
    let stream: Stream<ValueUpdate>;
    stream = new Stream<ValueUpdate>(() => {

      if (listener == null) {
        listener = subscribe(path, (update: ValueUpdate) => {
          stream.add(update);
        }, qos);
      }
    }, () => {
      if (listener) {
        listener.cancel();
        listener = null;
      }
    });
    return stream;
  }

  getNodeValue(path: string, timeoutMs: number = 0): Promise<ValueUpdate> {
    return new Promise((resolve, reject) => {
      let listener: ReqSubscribeListener;
      let timer: any;
      listener = this.subscribe(path, (update: ValueUpdate) => {
        resolve(update);

        if (listener != null) {
          listener.cancel();
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
            listener.cancel();
            listener = null;
          }
          reject(new TimeoutException("failed to receive value", timeoutMs));
        }, timeoutMs);
      }
    });
  }

  getRemoteNode(path: string): Promise<RemoteNode> {
    let sub: StreamSubscription;
    return new Promise((resolve, reject) => {
      sub = this.list(path).listen((update) => {
        resolve(update.node);

        if (sub != null) {
          sub.cancel();
        }
      });
    });

  }

  unsubscribe(path: string, callback: (update: ValueUpdate) => void) {
    let node: RemoteNode = this.nodeCache.getRemoteNode(path);
    node._unsubscribe(this, callback);
  }

  list(path: string): Stream<RequesterListUpdate> {
    let node: RemoteNode = this.nodeCache.getRemoteNode(path);
    return node._list(this);
  }

  invoke(path: string, params: {[key: string]: any} = {},
         maxPermission: number = Permission.CONFIG, fetchRawReq?: RequestConsumer): Stream<RequesterInvokeUpdate> {
    let node: RemoteNode = this.nodeCache.getRemoteNode(path);
    return node._invoke(params, this, maxPermission, fetchRawReq);
  }

  set(path: string, value: object,
      maxPermission: number = Permission.CONFIG): Promise<RequesterUpdate> {
    return new SetController(this, path, value, maxPermission).promise;
  }

  remove(path: string): Promise<RequesterUpdate> {
    return new RemoveController(this, path).promise;
  }

  /// close the request from requester side and notify responder
  closeRequest(request: Request) {
    if (this._requests.has(request.rid)) {
      if (request.streamStatus != StreamStatus.closed) {
        this.addToSendList({'method': 'close', 'rid': request.rid});
      }
      this._requests.delete(request.rid);
      request._close();
    }
  }

  _connected: boolean = false;

  onDisconnected() {
    if (!this._connected) return;
    this._connected = false;

    let newRequests = new Map<number, Request>();
    newRequests.set(0, this._subscription);
    for (let [n, req] of this._requests) {
      if (req.rid <= this.lastRid && !(req.updater instanceof ListController)) {
        req._close(DSError.DISCONNECTED);
      } else {
        newRequests[req.rid] = req;
        req.updater.onDisconnect();
      }
    }
    this._requests = newRequests;
  }

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

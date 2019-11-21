import { RequesterUpdate, RequestUpdater } from './interface';
import { Listener, Stream, StreamSubscription } from '../utils/async';
import { Request } from './request';
import { ConnectionHandler } from '../common/connection-handler';
import { RemoteNode, RemoteNodeCache } from './node_cache';
import { ReqSubscribeListener, SubscribeRequest } from './request/subscribe';
import { DsError, ProcessorResult } from '../common/interfaces';
import { ValueUpdate } from '../common/value';
import { RequesterListUpdate } from './request/list';
import { RequesterInvokeStream, RequesterInvokeUpdate } from './request/invoke';
import { NodeQueryStructure } from './query/query-structure';
import { NodeQueryResult } from './query/result';
export declare class Requester extends ConnectionHandler {
    /** @ignore */
    _requests: Map<number, Request>;
    /** @ignore */
    readonly nodeCache: RemoteNodeCache;
    /** @ignore */
    _subscription: SubscribeRequest;
    constructor(cache?: RemoteNodeCache);
    get subscriptionCount(): number;
    get openRequestCount(): number;
    /** @ignore */
    onData: (list: any[]) => void;
    /** @ignore */
    _onReceiveUpdate(m: any): void;
    /** @ignore */
    onError: Stream<DsError>;
    /** @ignore */
    lastRid: number;
    /** @ignore */
    getNextRid(): number;
    /** @ignore */
    getSendingData(currentTime: number, waitingAckId: number): ProcessorResult;
    /** @ignore */
    sendRequest(m: {
        [key: string]: any;
    }, updater: RequestUpdater): Request;
    /** @ignore */
    _sendRequest(m: {
        [key: string]: any;
    }, updater: RequestUpdater): Request;
    isNodeCached(path: string): boolean;
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
    subscribe(path: string, callback: (update: ValueUpdate) => void, qos?: number): ReqSubscribeListener;
    /**
     * Unsubscribe the callback
     */
    unsubscribe(path: string, callback: (update: ValueUpdate) => void): void;
    /** @ignore */
    onValueChange(path: string, qos?: number): Stream<ValueUpdate>;
    /**
     * Subscribe and get value update only once, subscription will be closed automatically when an update is received
     */
    subscribeOnce(path: string, timeoutMs?: number): Promise<ValueUpdate>;
    /**
     * List and get node metadata and children summary only once, subscription will be closed automatically when an update is received
     */
    listOnce(path: string): Promise<RemoteNode>;
    /**
     * List a path and get the node metadata as well as a summary of children nodes.
     * This method will keep a stream and continue to get updates. If you only need to get the current value once, use [[listOnce]] instead.
     *
     * A Subscription should be closed with [[StreamSubscription.close]] when it's no longer needed.
     */
    list(path: string, callback: Listener<RequesterListUpdate>): StreamSubscription<RequesterListUpdate>;
    /**
     * Invoke a node action, and receive updates.
     * Usually an action stream will be closed on server side,
     * but in the case of a streaming action the returned stream needs to be closed with [[RequesterInvokeStream.close]]
     */
    invoke(path: string, params?: {
        [key: string]: any;
    }, callback?: Listener<RequesterInvokeUpdate>, maxPermission?: number): RequesterInvokeStream;
    /**
     * Invoke a node action, and receive update only once, stream will be closed automatically if necessary
     */
    invokeOnce(path: string, params?: {
        [key: string]: any;
    }, maxPermission?: number): Promise<RequesterInvokeUpdate>;
    /**
     * Invoke a node action, and receive raw update.
     * Steaming updates won't be merged
     */
    invokeStream(path: string, params?: {
        [key: string]: any;
    }, callback?: Listener<RequesterInvokeUpdate>, maxPermission?: number): RequesterInvokeStream;
    /**
     * Set the value of an attribute, the attribute will be created if not exists
     */
    set(path: string, value: any, maxPermission?: number): Promise<RequesterUpdate>;
    /**
     * Remove an attribute
     */
    remove(path: string): Promise<RequesterUpdate>;
    query(path: string, queryStruct: NodeQueryStructure, callback?: Listener<NodeQueryResult>): StreamSubscription<NodeQueryResult>;
    /** @ignore */
    closeRequest(request: Request): void;
    /** @ignore */
    _connected: boolean;
    /** @ignore */
    onDisconnected(): void;
    /** @ignore */
    onReconnected(): void;
}

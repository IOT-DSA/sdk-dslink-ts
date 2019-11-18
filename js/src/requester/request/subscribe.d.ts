import { Closable } from '../../utils/async';
import { Request } from '../request';
import { Requester } from '../requester';
import { ConnectionProcessor, DsError } from '../../common/interfaces';
import { ValueUpdate, ValueUpdateCallback } from '../../common/value';
import { RemoteNode } from '../node_cache';
import { RequestUpdater } from '../interface';
export declare class ReqSubscribeListener implements Closable {
    callback: ValueUpdateCallback;
    requester: Requester;
    path: string;
    /** @ignore */
    constructor(requester: Requester, path: string, callback: ValueUpdateCallback);
    close(): void;
}
/** @ignore */
export declare class SubscribeController implements RequestUpdater {
    request: SubscribeRequest;
    onDisconnect(): void;
    onReconnect(): void;
    onUpdate(status: string, updates: any[], columns: any[], meta: {
        [key: string]: any;
    }, error: DsError): void;
}
/** @ignore */
export declare class SubscribeRequest extends Request implements ConnectionProcessor {
    lastSid: number;
    getNextSid(): number;
    readonly subscriptions: Map<string, ReqSubscribeController>;
    readonly subscriptionIds: Map<number, ReqSubscribeController>;
    constructor(requester: Requester, rid: number);
    resend(): void;
    _close(error: DsError): void;
    _update(m: {
        [key: string]: any;
    }): void;
    _changedPaths: Set<string>;
    toRemove: Map<number, ReqSubscribeController>;
    addSubscription(controller: ReqSubscribeController, level: number): void;
    removeSubscription(controller: ReqSubscribeController): void;
    startSendingData(currentTime: number, waitingAckId: number): void;
    _pendingSending: boolean;
    _waitingAckCount: number;
    _lastWatingAckId: number;
    ackReceived(receiveAckId: number, startTime: number, currentTime: number): void;
    _sendingAfterAck: boolean;
    prepareSending(): void;
}
/** @ignore */
export declare class ReqSubscribeController {
    readonly node: RemoteNode;
    readonly requester: Requester;
    callbacks: Map<(update: ValueUpdate) => void, number>;
    currentQos: number;
    sid: number;
    constructor(node: RemoteNode, requester: Requester);
    listen(callback: (update: ValueUpdate) => void, qos: number): void;
    unlisten(callback: (update: ValueUpdate) => void): void;
    updateQos(): boolean;
    _lastUpdate: ValueUpdate;
    addValue(update: ValueUpdate): void;
    _destroy(): void;
}

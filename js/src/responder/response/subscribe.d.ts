import { ValueUpdate } from '../../common/value';
import { Response } from '../response';
import { NodeState } from '../node_state';
import { Responder } from '../responder';
import Denque = require('denque');
interface ISubscriptionNodeStorage {
}
export declare class SubscribeResponse extends Response {
    constructor(responder: Responder, rid: number);
    readonly subscriptions: Map<string, ValueSubscriber>;
    readonly subsriptionids: Map<number, ValueSubscriber>;
    readonly changed: Set<ValueSubscriber>;
    add(path: string, node: NodeState, sid: number, qos: number): ValueSubscriber;
    remove(sid: number): void;
    subscriptionChanged(subscriber: ValueSubscriber): void;
    startSendingData(currentTime: number, waitingAckId: number): void;
    _waitingAckCount: number;
    _lastWaitingAckId: number;
    ackReceived(receiveAckId: number, startTime: number, currentTime: number): void;
    _sendingAfterAck: boolean;
    prepareSending(): void;
    _close(): void;
}
export declare class ValueSubscriber {
    readonly node: NodeState;
    readonly response: SubscribeResponse;
    sid: number;
    lastValues: ValueUpdate[];
    waitingValues: Denque<ValueUpdate>;
    lastValue: ValueUpdate;
    _qosLevel: number;
    _storage: ISubscriptionNodeStorage;
    qosLevel: number;
    _caching: boolean;
    caching: boolean;
    cachingQueue: boolean;
    _persist: boolean;
    persist: boolean;
    constructor(response: SubscribeResponse, node: NodeState, sid: number, qos: number);
    _isCacheValid: boolean;
    addValue(val: ValueUpdate): void;
    process(waitingAckId: number): any[];
    onAck(ackId: number): void;
    rollback(): void;
    resetCache(values: ValueUpdate[]): void;
    destroy(): void;
}
export {};

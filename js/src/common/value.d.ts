export declare type ValueUpdateCallback = (update: ValueUpdate) => any;
export declare type ValueCallback<T> = (value: T) => any;
export declare class ValueUpdate {
    static _lastTsStr: string;
    static _lastTs: number;
    static getTs(): string;
    waitingAck: number;
    value: any;
    ts: string;
    _timestamp: Date;
    readonly timestamp: Date;
    status: string;
    count: number;
    created: Date;
    constructor(value: any, ts?: string, options?: {
        status?: string;
        count?: number;
    });
    static merge(oldUpdate: ValueUpdate, newUpdate: ValueUpdate): ValueUpdate;
    _latency: number;
    readonly latency: number;
    mergeAdd(newUpdate: ValueUpdate): void;
    equals(other: ValueUpdate): boolean;
    toMap(): {
        [key: string]: any;
    };
    storedData: {
        [key: string]: any;
    };
    _cloned: boolean;
    cloneForAckQueue(): ValueUpdate;
}

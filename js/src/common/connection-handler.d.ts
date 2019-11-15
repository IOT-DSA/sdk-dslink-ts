import { ConnectionChannel, ConnectionProcessor, ProcessorResult } from './interfaces';
import { StreamSubscription } from '../utils/async';
export declare const DSA_CONFIG: {
    ackWaitCount: number;
    defaultCacheSize: number;
};
export declare abstract class ConnectionHandler {
    /** @ignore */
    _conn: ConnectionChannel;
    /** @ignore */
    _connListener: StreamSubscription<any[]>;
    /** @ignore */
    /** @ignore */
    connection: ConnectionChannel;
    /** @ignore */
    _onDisconnected(conn: ConnectionChannel): void;
    abstract onDisconnected(): void;
    /** @ignore */
    onReconnected(): void;
    abstract onData(m: any[]): void;
    /** @ignore */
    _toSendList: any[];
    /** @ignore */
    addToSendList(m: any): void;
    /** @ignore */
    _processors: ConnectionProcessor[];
    /** @ignore */
    addProcessor(processor: ConnectionProcessor): void;
    /** @ignore */
    _pendingSend: boolean;
    /** @ignore */
    getSendingData(currentTime: number, waitingAckId: number): ProcessorResult;
    /** @ignore */
    clearProcessors(): void;
}

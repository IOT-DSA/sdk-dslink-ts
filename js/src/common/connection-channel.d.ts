import { Completer, Stream } from '../utils/async';
import { Connection, ConnectionChannel, ProcessorResult } from './interfaces';
import { ConnectionHandler } from './connection-handler';
export declare class PassiveChannel implements ConnectionChannel {
    onReceive: Stream<any[]>;
    _processors: Function[];
    readonly conn: Connection;
    constructor(conn: Connection, connected?: boolean);
    handler: ConnectionHandler;
    sendWhenReady(handler: ConnectionHandler): void;
    getSendingData(currentTime: number, waitingAckId: number): ProcessorResult;
    _isReady: boolean;
    get isReady(): boolean;
    set isReady(val: boolean);
    connected: boolean;
    readonly onDisconnectController: Completer<ConnectionChannel>;
    get onDisconnected(): Promise<ConnectionChannel>;
    readonly onConnectController: Completer<ConnectionChannel>;
    get onConnected(): Promise<ConnectionChannel>;
    updateConnect(): void;
}

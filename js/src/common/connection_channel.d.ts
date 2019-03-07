import { Completer, Stream } from "../utils/async";
import { Connection, ConnectionChannel, ProcessorResult } from "./interfaces";
import { ConnectionHandler } from "./connection_handler";
export declare class PassiveChannel implements ConnectionChannel {
    onReceive: Stream<any[]>;
    _processors: Function[];
    readonly conn: Connection;
    constructor(conn: Connection, connected?: boolean);
    handler: ConnectionHandler;
    sendWhenReady(handler: ConnectionHandler): void;
    getSendingData(currentTime: number, waitingAckId: number): ProcessorResult;
    _isReady: boolean;
    isReady: boolean;
    connected: boolean;
    readonly onDisconnectController: Completer<ConnectionChannel>;
    readonly onDisconnected: Promise<ConnectionChannel>;
    readonly onConnectController: Completer<ConnectionChannel>;
    readonly onConnected: Promise<ConnectionChannel>;
    updateConnect(): void;
}

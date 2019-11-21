import WebSocket from 'ws';
import { ClientLink, Connection, ConnectionChannel } from '../common/interfaces';
import { PassiveChannel } from '../common/connection-channel';
import { Completer } from '../utils/async';
import { DsCodec } from '../utils/codec';
export declare class WebSocketConnection extends Connection {
    _responderChannel: PassiveChannel;
    get responderChannel(): ConnectionChannel;
    _requesterChannel: PassiveChannel;
    get requesterChannel(): ConnectionChannel;
    _onRequestReadyCompleter: Completer<ConnectionChannel>;
    get onRequesterReady(): Promise<ConnectionChannel>;
    _onDisconnectedCompleter: Completer<boolean>;
    get onDisconnected(): Promise<boolean>;
    readonly clientLink: ClientLink;
    readonly socket: WebSocket;
    onConnect: Function;
    _onDoneHandled: boolean;
    constructor(socket: WebSocket, clientLink: ClientLink, onConnect: Function, useCodec: DsCodec);
    pingTimer: any;
    _dataSent: boolean;
    _dataReceiveCount: number;
    onPingTimer: () => void;
    requireSend(): void;
    _opened: boolean;
    get opened(): boolean;
    _onOpen: (e: {
        target: WebSocket;
    }) => void;
    _msgCommand: {
        [key: string]: any;
    };
    addConnCommand(key: string, value: any): void;
    _onData: (e: {
        data: WebSocket.Data;
        type: string;
        target: WebSocket;
    }) => void;
    nextMsgId: number;
    _sending: boolean;
    _send(): void;
    _onDone: () => void;
    close(): void;
}

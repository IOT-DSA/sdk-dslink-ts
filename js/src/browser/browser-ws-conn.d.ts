import { ClientLink, Connection, ConnectionChannel } from '../common/interfaces';
import { PassiveChannel } from '../common/connection-channel';
import { Completer } from '../utils/async';
import { DsCodec } from '../utils/codec';
export declare class WebSocketConnection extends Connection {
    _responderChannel: PassiveChannel;
    readonly responderChannel: ConnectionChannel;
    _requesterChannel: PassiveChannel;
    readonly requesterChannel: ConnectionChannel;
    _onRequestReadyCompleter: Completer<ConnectionChannel>;
    readonly onRequesterReady: Promise<ConnectionChannel>;
    _onDisconnectedCompleter: Completer<boolean>;
    readonly onDisconnected: Promise<boolean>;
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
    readonly opened: boolean;
    _onOpen: (e: Event) => void;
    _msgCommand: {
        [key: string]: any;
    };
    addConnCommand(key: string, value: object): void;
    _onData: (e: MessageEvent) => void;
    nextMsgId: number;
    _sending: boolean;
    _send(): void;
    _authError: boolean;
    _onDone: (o?: any) => void;
    close(): void;
}

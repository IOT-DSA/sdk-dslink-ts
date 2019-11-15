import { ClientLink, ECDH } from '../common/interfaces';
import { Completer } from '../utils/async';
import { Requester } from '../requester/requester';
import { PrivateKey } from '../crypto/pk';
import { WebSocketConnection } from './browser-ws-conn';
export declare class BrowserUserLink extends ClientLink {
    /** @ignore */
    _onRequesterReadyCompleter: Completer<Requester>;
    readonly onRequesterReady: Promise<Requester>;
    /** @ignore */
    static session: string;
    readonly requester: Requester;
    /** @ignore */
    readonly nonce: ECDH;
    /** @ignore */
    privateKey: PrivateKey;
    /** @ignore */
    _wsConnection: WebSocketConnection;
    /** @ignore */
    updateSalt(salt: string): void;
    /** @ignore */
    wsUpdateUri: string;
    /** @ignore */
    format: string;
    constructor(wsUpdateUri: string, format?: string);
    _connect(): Promise<Requester>;
    /** @ignore */
    _wsDelay: number;
    /** @ignore */
    _initSocketTimer: any;
    /** @ignore */
    initWebsocketLater(ms: number): void;
    /** @ignore */
    initWebsocket: (reconnect?: boolean) => void;
    onDisConnect(reconnect: boolean): void;
    reconnect(): void;
    close(): void;
}

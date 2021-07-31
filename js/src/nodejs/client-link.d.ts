import { ClientLink, ECDH } from '../common/interfaces';
import { Completer } from '../utils/async';
import { Requester } from '../requester/requester';
import { WebSocketConnection } from './websocket-conn';
import { Responder } from '../responder/responder';
import { PrivateKey } from '../crypto/pk';
import { LocalNode, NodeProvider } from '../responder/node_state';
export declare class HttpClientLink extends ClientLink {
    /** @ignore */
    _onReadyCompleter: Completer<[Requester, Responder]>;
    get onReady(): Promise<[Requester, Responder]>;
    remotePath: string;
    readonly dsId: string;
    /** @ignore */
    readonly privateKey: PrivateKey;
    readonly nodeProvider: NodeProvider;
    readonly requester: Requester;
    readonly responder: Responder;
    /** @ignore */
    tokenHash: string;
    /** @ignore */
    _nonce: ECDH;
    /** @ignore */
    get nonce(): ECDH;
    /** @ignore */
    _wsConnection: WebSocketConnection;
    /** @ignore */
    salt: string;
    /** @ignore */
    updateSalt(salt: string): void;
    /** @ignore */
    _wsUpdateUri: string;
    /** @ignore */
    _conn: string;
    /** @ignore */
    _connectionHeaders: {
        [key: string]: string;
    };
    /** @ignore */
    linkData: {
        [key: string]: any;
    };
    /** @ignore
     * formats sent to broker
     */
    formats: string[];
    /** @ignore
     * format received from broker
     */
    format: string;
    constructor(conn: string, dsIdPrefix: string, options?: {
        rootNode?: LocalNode;
        privateKey?: PrivateKey;
        isRequester?: boolean;
        saveNodes?: boolean | string | ((data: any) => void);
        token?: string;
        linkData?: {
            [key: string]: any;
        };
        format?: string[] | string;
        connectionHeaders?: {
            [key: string]: string;
        };
    });
    /** @ignore */
    _connDelay: number;
    /** @ignore */
    _connDelayTimer: any;
    /** @ignore */
    connDelay(): void;
    /** @ignore */
    _connect(): Promise<void>;
    /** @ignore */
    _wsDelay: number;
    /** @ignore */
    _wsDelayTimer: any;
    /** @ignore */
    _reconnectWSCount: number;
    /** @ignore */
    initWebsocket(reconnect?: boolean): Promise<void>;
    /** @ignore */
    _closed: boolean;
    close(): void;
}

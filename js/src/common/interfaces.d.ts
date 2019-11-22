import Denque from 'denque';
import { Stream } from '../utils/async';
import { ConnectionHandler } from './connection-handler';
import { DsCodec } from '../utils/codec';
import { PrivateKey, PublicKey } from '../crypto/pk';
import { LocalNode } from '../responder/node_state';
import { Responder } from '../responder/responder';
import { Requester } from '../requester/requester';
export declare abstract class ECDH {
    abstract get encodedPublicKey(): string;
    abstract hashSalt(salt: string): string;
    verifySalt(salt: string, hash: string): boolean;
}
/** @ignore */
export declare class DummyECDH implements ECDH {
    readonly encodedPublicKey: string;
    hashSalt(salt: string): string;
    verifySalt(salt: string, hash: string): boolean;
}
export declare abstract class Connection {
    requesterChannel: ConnectionChannel;
    responderChannel: ConnectionChannel;
    onRequesterReady: Promise<ConnectionChannel>;
    onDisconnected: Promise<boolean>;
    abstract requireSend(): void;
    abstract addConnCommand(key: string, value: object): void;
    abstract close(): void;
    codec: DsCodec;
    pendingAcks: Denque<ConnectionAckGroup>;
    ack(ackId: number): void;
}
export interface ConnectionProcessor {
    startSendingData(waitingAckId: number, currentTime: number): void;
    ackReceived(receiveAckId: number, startTime: number, currentTime: number): void;
}
export declare class ProcessorResult {
    messages: any[];
    processors: ConnectionProcessor[];
    constructor(messages: any[], processors: ConnectionProcessor[]);
}
export declare class ConnectionAckGroup {
    ackId: number;
    startTime: number;
    expectedAckTime: number;
    processors: ConnectionProcessor[];
    constructor(ackId: number, startTime: number, processors: ConnectionProcessor[]);
    ackAll(ackid: number, time: number): void;
}
export interface ConnectionChannel {
    sendWhenReady(handler: ConnectionHandler): void;
    onReceive: Stream<any[]>;
    isReady: boolean;
    connected: boolean;
    onDisconnected: Promise<ConnectionChannel>;
    onConnected: Promise<ConnectionChannel>;
}
export declare abstract class BaseLink {
    /** @ignore */
    requester: Requester;
    /** @ignore */
    responder: Responder;
    /** @ignore */
    nonce: ECDH;
    onRequesterReady: Promise<Requester>;
    abstract close(): void;
}
export declare abstract class ServerLink extends BaseLink {
    dsId: string;
    session: string;
    publicKey: PublicKey;
    abstract close(): void;
}
export declare abstract class ClientLink extends BaseLink {
    /** @ignore */
    privateKey: PrivateKey;
    /** @ignore */
    abstract updateSalt(salt: string): void;
    /** @ignore */
    get logName(): string;
    /** @ignore */
    formatLogMessage(msg: string): string;
    /** @ignore */
    abstract _connect(): void;
    onConnect: Stream<boolean>;
    /** @ignore */
    _onConnect: () => void;
    onDisconnect: Stream<boolean>;
    /** @ignore */
    _onDisconnect: () => void;
    connect(): Promise<any>;
}
export interface ServerLinkManager {
    getLinkPath(dsId: string, token: string): string;
    addLink(link: ServerLink): boolean;
    onLinkDisconnected(link: ServerLink): void;
    removeLink(link: ServerLink, id: string): void;
    getLinkAndConnectNode(dsId: string, sessionId?: string): ServerLink;
    getRequester(dsId: string): Requester;
    getResponder(dsId: string, nodeProvider: NodeProvider, sessionId?: string, trusted?: boolean): Responder;
    updateLinkData(dsId: string, m: any): void;
}
export declare type StreamStatus = 'initialize' | 'open' | 'closed';
export declare class ErrorPhase {
    static readonly request: string;
    static readonly response: string;
}
export declare class DsError {
    type: string;
    detail: string;
    msg: string;
    path: string;
    phase: string;
    constructor(type: string, options?: {
        msg?: string;
        detail?: string;
        path?: string;
        phase?: string;
    });
    static fromMap(m: any): DsError;
    getMessage(): string;
    serialize(): any;
    static readonly PERMISSION_DENIED: DsError;
    static readonly INVALID_METHOD: DsError;
    static readonly NOT_IMPLEMENTED: DsError;
    static readonly INVALID_PATH: DsError;
    static readonly INVALID_PATHS: DsError;
    static readonly INVALID_VALUE: DsError;
    static readonly INVALID_PARAMETER: DsError;
    static readonly DISCONNECTED: DsError;
    static readonly FAILED: DsError;
}
export interface NodeProvider {
    getNode(path: string): LocalNode;
    getOrCreateNode(path: string, addToTree?: boolean): LocalNode;
}

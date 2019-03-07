import Denque from "denque";
import { Stream } from "../utils/async";
import { ConnectionHandler } from "./connection_handler";
import { DsCodec } from "../utils/codec";
import { PrivateKey, PublicKey } from "../crypto/pk";
import { LocalNode } from "../responder/node_provider";
import { Responder } from "../responder/responder";
import { Requester } from "../requester/requester";
export declare abstract class ECDH {
    abstract readonly encodedPublicKey: string;
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
    readonly logName: string;
    /** @ignore */
    formatLogMessage(msg: string): string;
    abstract connect(): void;
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
export declare class StreamStatus {
    static readonly initialize: string;
    static readonly open: string;
    static readonly closed: string;
}
export declare class ErrorPhase {
    static readonly request: string;
    static readonly response: string;
}
export declare class DSError {
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
    static fromMap(m: any): DSError;
    getMessage(): string;
    serialize(): any;
    static readonly PERMISSION_DENIED: DSError;
    static readonly INVALID_METHOD: DSError;
    static readonly NOT_IMPLEMENTED: DSError;
    static readonly INVALID_PATH: DSError;
    static readonly INVALID_PATHS: DSError;
    static readonly INVALID_VALUE: DSError;
    static readonly INVALID_PARAMETER: DSError;
    static readonly DISCONNECTED: DSError;
    static readonly FAILED: DSError;
}
export declare class Unspecified {
}
export interface IPermissionManager {
    getPermission(path: string, resp: Responder): number;
}
export interface NodeProvider {
    getNode(path: string): LocalNode;
    getOrCreateNode(path: string, addToTree?: boolean): LocalNode;
    createResponder(dsId: string, sessionId: string): Responder;
    permissions: IPermissionManager;
}

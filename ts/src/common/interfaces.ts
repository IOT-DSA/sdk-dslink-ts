import Denque from 'denque';
import {Stream} from '../utils/async';
import {ConnectionHandler} from './connection-handler';
import {DsCodec} from '../utils/codec';
import {PrivateKey, PublicKey} from '../crypto/pk';
import {LocalNode} from '../responder/node_state';
import {Responder} from '../responder/responder';
import {Requester} from '../requester/requester';
import {logger as mainLogger} from '../utils/logger';

export abstract class ECDH {
  abstract get encodedPublicKey(): string;

  abstract hashSalt(salt: string): string;

  verifySalt(salt: string, hash: string): boolean {
    return this.hashSalt(salt) === hash;
  }
}

/** @ignore */
export class DummyECDH implements ECDH {
  readonly encodedPublicKey: string = '';

  hashSalt(salt: string): string {
    return '';
  }

  verifySalt(salt: string, hash: string): boolean {
    return true;
  }
}

export abstract class Connection {
  requesterChannel: ConnectionChannel;

  responderChannel: ConnectionChannel;

  /// trigger when requester channel is Ready
  onRequesterReady: Promise<ConnectionChannel>;

  /// return true if it's authentication error
  onDisconnected: Promise<boolean>;

  /// notify the connection channel need to send data
  abstract requireSend(): void;

  /// send a connection command
  abstract addConnCommand(key: string, value: object): void;

  /// close the connection
  abstract close(): void;

  codec: DsCodec = DsCodec.defaultCodec;

  pendingAcks: Denque<ConnectionAckGroup> = new Denque<ConnectionAckGroup>();

  ack(ackId: number) {
    let findAckGroup: ConnectionAckGroup;
    for (let i = 0; i < this.pendingAcks.length; ++i) {
      let ackGroup = this.pendingAcks.peekAt(i);
      if (ackGroup.ackId === ackId) {
        findAckGroup = ackGroup;
        break;
      } else if (ackGroup.ackId < ackId) {
        findAckGroup = ackGroup;
      }
    }

    if (findAckGroup != null) {
      let ts: number = new Date().getTime();
      do {
        let ackGroup: ConnectionAckGroup = this.pendingAcks.shift();
        ackGroup.ackAll(ackId, ts);
        if (ackGroup === findAckGroup) {
          break;
        }
      } while (findAckGroup != null);
    }
  }
}

export interface ConnectionProcessor {
  startSendingData(waitingAckId: number, currentTime: number): void;

  ackReceived(receiveAckId: number, startTime: number, currentTime: number): void;
}

/// generate message right before sending to get the latest update
/// return messages and the processors that need ack callback
export class ProcessorResult {
  messages: any[];
  processors: ConnectionProcessor[];

  constructor(messages: any[], processors: ConnectionProcessor[]) {
    this.messages = messages;
    this.processors = processors;
  }
}

export class ConnectionAckGroup {
  ackId: number;
  startTime: number;
  expectedAckTime: number;
  processors: ConnectionProcessor[];

  constructor(ackId: number, startTime: number, processors: ConnectionProcessor[]) {
    this.ackId = ackId;
    this.startTime = startTime;
    this.processors = processors;
  }

  ackAll(ackid: number, time: number) {
    for (let processor of this.processors) {
      processor.ackReceived(this.ackId, this.startTime, time);
    }
  }
}

export interface ConnectionChannel {
  /// raw connection need to handle error and resending of data, so it can only send one map at a time
  /// a new getData function will always overwrite the previous one;
  /// requester and responder should handle the merging of methods
  sendWhenReady(handler: ConnectionHandler): void;

  /// receive data from method stream
  onReceive: Stream<any[]>;

  /// whether the connection is ready to send and receive data
  isReady: boolean;

  connected: boolean;

  onDisconnected: Promise<ConnectionChannel>;

  onConnected: Promise<ConnectionChannel>;
}

/// Base Class for Links
export abstract class BaseLink {
  /** @ignore */
  requester: Requester;
  /** @ignore */
  responder: Responder;
  /** @ignore */
  nonce: ECDH;

  /// trigger when requester channel is Ready
  onRequesterReady: Promise<Requester>;

  abstract close(): void;
}

/// Base Class for Server Link implementations.
export abstract class ServerLink extends BaseLink {
  /// dsId or username
  dsId: string;

  session: string;

  publicKey: PublicKey;

  abstract close(): void;
}

let linkLogger = mainLogger.tag('link');

/// Base Class for Client Link implementations.
export abstract class ClientLink extends BaseLink {
  /** @ignore */
  privateKey: PrivateKey;

  /** @ignore */
  abstract updateSalt(salt: string): void;

  /** @ignore */
  get logName(): string {
    return null;
  }

  /** @ignore */
  formatLogMessage(msg: string): string {
    if (this.logName != null) {
      return `[${this.logName}] ${msg}`;
    }
    return msg;
  }

  /** @ignore */
  abstract _connect(): void;

  onConnect: Stream<boolean> = new Stream(null, null, null, true);
  /** @ignore */
  _onConnect = () => {
    this.onConnect.add(true);
    this.onDisconnect.reset();
    linkLogger.info('Connected');
  };

  onDisconnect: Stream<boolean> = new Stream(null, null, null, true);
  /** @ignore */
  _onDisconnect = () => {
    if (this.onConnect._value) {
      this.onDisconnect.add(true);
      linkLogger.info('Disconnected');
      this.onConnect.reset();
    }
  };

  async connect() {
    this._connect();
    return new Promise<any>((resolve) => {
      let listener = this.onConnect.listen((connected: boolean) => {
        resolve(connected);
        listener.close();
      });
    });
  }
}

export interface ServerLinkManager {
  getLinkPath(dsId: string, token: string): string;

  /// return true if link is added
  addLink(link: ServerLink): boolean;

  onLinkDisconnected(link: ServerLink): void;

  removeLink(link: ServerLink, id: string): void;

  getLinkAndConnectNode(dsId: string, sessionId?: string): ServerLink;

  getRequester(dsId: string): Requester;

  getResponder(dsId: string, nodeProvider: NodeStore, sessionId?: string, trusted?: boolean): Responder;

  updateLinkData(dsId: string, m: any): void;
}

/// DSA Stream Status
export type StreamStatus = 'initialize' | 'open' | 'closed';

export class ErrorPhase {
  static readonly request: string = 'request';
  static readonly response: string = 'response';
}

export class DsError {
  /// type of error
  type: string;
  detail: string;
  msg: string;
  path: string;
  phase: string;

  constructor(type: string, options: {msg?: string; detail?: string; path?: string; phase?: string} = {}) {
    this.type = type;
    this.msg = options.msg;
    this.detail = options.detail;
    this.path = options.path;
    if (options.phase) {
      this.phase = options.phase;
    } else {
      this.phase = ErrorPhase.response;
    }
  }

  static fromMap(m: any) {
    let error = new DsError('');
    if (typeof m['type'] === 'string') {
      error.type = m['type'];
    }
    if (typeof m['msg'] === 'string') {
      error.msg = m['msg'];
    }
    if (typeof m['path'] === 'string') {
      error.path = m['path'];
    }
    if (typeof m['phase'] === 'string') {
      error.phase = m['phase'];
    }
    if (typeof m['detail'] === 'string') {
      error.detail = m['detail'];
    }
    return error;
  }

  getMessage(): string {
    if (this.msg) {
      return this.msg;
    }
    if (this.type) {
      // TODO, return normal case instead of camel case
      return this.type;
    }
    return 'Error';
  }

  serialize(): any {
    let rslt: any = {};
    if (this.msg != null) {
      rslt['msg'] = this.msg;
    }
    if (this.type != null) {
      rslt['type'] = this.type;
    }
    if (this.path != null) {
      rslt['path'] = this.path;
    }
    if (this.phase === ErrorPhase.request) {
      rslt['phase'] = ErrorPhase.request;
    }
    if (this.detail != null) {
      rslt['detail'] = this.detail;
    }
    return rslt;
  }

  static readonly PERMISSION_DENIED = new DsError('permissionDenied');
  static readonly INVALID_METHOD = new DsError('invalidMethod');
  static readonly NOT_IMPLEMENTED = new DsError('notImplemented');
  static readonly INVALID_PATH = new DsError('invalidPath');
  static readonly INVALID_PATHS = new DsError('invalidPaths');
  static readonly INVALID_VALUE = new DsError('invalidValue');
  static readonly INVALID_PARAMETER = new DsError('invalidParameter');
  static readonly DISCONNECTED = new DsError('disconnected', {phase: ErrorPhase.request});
  static readonly FAILED = new DsError('failed');
}

/// Provides Nodes for a responder.
/// A single node provider can be reused by multiple responder.
export interface NodeStore {
  /// Gets an existing node.
  getNode(path: string): LocalNode;
}

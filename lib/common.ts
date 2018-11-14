/// Shared APIs between all DSA Components.
library dslink.common;

import "dart:async";
import "dart:collection";

import "requester.dart";
import "responder.dart";
import "utils.dart";

import "src/crypto/pk.dart";

part "src/common/node.dart";
part "src/common/table.dart";
part "src/common/value.dart";
part "src/common/connection_channel.dart";
part "src/common/connection_handler.dart";
part "src/common/permission.dart";
part "src/common/default_defs.dart";

export interface Connection {
  ConnectionChannel get requesterChannel;

  ConnectionChannel get responderChannel;

  /// trigger when requester channel is Ready
  Future<ConnectionChannel> get onRequesterReady;

  /// return true if it's authentication error
  Future<boolean> get onDisconnected;

  /// notify the connection channel need to send data
  void requireSend();

  /// send a connection command
  void addConnCommand(key: string, value: object);

  /// close the connection
  void close();

  codec: DsCodec = DsCodec.defaultCodec;

  pendingAcks: ListQueue<ConnectionAckGroup> = new ListQueue<
      ConnectionAckGroup>();

  ack(ackId:number) {
    findAckGroup: ConnectionAckGroup;
    for (ConnectionAckGroup ackGroup in pendingAcks) {
      if (ackGroup.ackId == ackId) {
        findAckGroup = ackGroup;
        break;
      } else if (ackGroup.ackId < ackId) {
        findAckGroup = ackGroup;
      }
    }

    if (findAckGroup != null) {
      let ts:number = (new DateTime.now()).millisecondsSinceEpoch;
      do {
        let ackGroup: ConnectionAckGroup = pendingAcks.removeFirst();
        ackGroup.ackAll(ackId, ts);
        if (ackGroup == findAckGroup) {
          break;
        }
      } while (findAckGroup != null);
    }
  }
}

/// generate message right before sending to get the latest update
/// return messages and the processors that need ack callback
export class ProcessorResult  {
  messages: object[];
  processors: ConnectionProcessor[];

  ProcessorResult(this.messages, this.processors);
}

export class ConnectionAckGroup  {
  ackId:number;
  startTime:number;
  expectedAckTime:number;
  processors: ConnectionProcessor[];

  ConnectionAckGroup(this.ackId, this.startTime, this.processors);

  ackAll(ackid:number, time:number) {
    for (ConnectionProcessor processor in processors) {
      processor.ackReceived(ackId, startTime, time);
    }
  }
}

export interface ConnectionChannel {
  /// raw connection need to handle error and resending of data, so it can only send one map at a time
  /// a new getData function will always overwrite the previous one;
  /// requester and responder should handle the merging of methods
  void sendWhenReady(handler: ConnectionHandler);

  /// receive data from method stream
  Stream<List> get onReceive;

  /// whether the connection is ready to send and receive data
  boolean get isReady;

  boolean get connected;

  Future<ConnectionChannel> get onDisconnected;

  Future<ConnectionChannel> get onConnected;
}

/// Base Class for Links
export interface BaseLink {
  Requester get requester;

  Responder get responder;

  ECDH get nonce;

  /// trigger when requester channel is Ready
  Future<Requester> get onRequesterReady;

  void close();
}

/// Base Class for Server Link implementations.
export interface ServerLink extends BaseLink {
  /// dsId or username
  string get dsId;

  string get session;

  PublicKey get publicKey;

  void close();
}

/// Base Class for Client Link implementations.
export interface ClientLink extends BaseLink {
  PrivateKey get privateKey;

  /// shortPolling is only valid in http mode
  /// saltId: 0 salt, 1:saltS, 2:saltL
  updateSalt(salt: string, [saltId:number = 0]);

  get logName(): string { return null;}

  formatLogMessage(msg: string):string {
    if (logName != null) {
      return "[${logName}] ${msg}";
    }
    return msg;
  }

  connect();
}

export interface ServerLinkManager {

  string getLinkPath(dsId: string, token: string);

  /// return true if link is added
  boolean addLink(link: ServerLink);

  void onLinkDisconnected(link: ServerLink);
  
  void removeLink(link: ServerLink, id: string);

  ServerLink getLinkAndConnectNode(dsId: string, {string sessionId: ""});

  Requester getRequester(dsId: string);

  Responder getResponder(dsId: string, nodeProvider: NodeProvider,
      [sessionId: string = "", trusted: boolean = false]);

  void updateLinkData(dsId: string, object m);
}

/// DSA Stream Status
export class StreamStatus  {
  /// Stream should be initialized.
  static const initialize: string = "initialize";

  /// Stream is open.
  static const open: string = "open";

  /// Stream is closed.
  static const closed: string = "closed";
}

export class ErrorPhase  {
  static const request: string = "request";
  static const response: string = "response";
}

export class DSError  {
  /// type of error
  type: string;
  detail: string;
  msg: string;
  path: string;
  phase: string;

  DSError(this.type,
      {this.msg, this.detail, this.path, this.phase: ErrorPhase.response});

  DSError.fromMap(object m) {
    if (m["type"] is string) {
      type = m["type"];
    }
    if (m["msg"] is string) {
      msg = m["msg"];
    }
    if (m["path"] is string) {
      path = m["path"];
    }
    if (m["phase"] is string) {
      phase = m["phase"];
    }
    if (m["detail"] is string) {
      detail = m["detail"];
    }
  }

  getMessage():string {
    if (msg != null) {
      return msg;
    }
    if (type != null) {
      // TODO, return normal case instead of camel case
      return type;
    }
    return "Error";
  }

  serialize():object {
    rslt: object = {};
    if (msg != null) {
      rslt["msg"] = msg;
    }
    if (type != null) {
      rslt["type"] = type;
    }
    if (path != null) {
      rslt["path"] = path;
    }
    if (phase == ErrorPhase.request) {
      rslt["phase"] = ErrorPhase.request;
    }
    if (detail != null) {
      rslt["detail"] = detail;
    }
    return rslt;
  }

  static final DSError PERMISSION_DENIED = new DSError("permissionDenied");
  static final DSError INVALID_METHOD = new DSError("invalidMethod");
  static final DSError NOT_IMPLEMENTED = new DSError("notImplemented");
  static final DSError INVALID_PATH = new DSError("invalidPath");
  static final DSError INVALID_PATHS = new DSError("invalidPaths");
  static final DSError INVALID_VALUE = new DSError("invalidValue");
  static final DSError INVALID_PARAMETER = new DSError("invalidParameter");
  static final DSError DISCONNECTED = new DSError("disconnected", phase: ErrorPhase.request);
  static final DSError FAILED = new DSError("failed");
}

/// Marks something as being unspecified.
const unspecified: Unspecified = const Unspecified();

/// Unspecified means that something has never been set.
export class Unspecified  {
  const Unspecified();
}

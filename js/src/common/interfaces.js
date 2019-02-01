import Denque from "denque";
import { DsCodec } from "../utils/codec";
export class ECDH {
    verifySalt(salt, hash) {
        return this.hashSalt(salt) === hash;
    }
}
export class Connection {
    constructor() {
        this.codec = DsCodec.defaultCodec;
        this.pendingAcks = new Denque();
    }
    ack(ackId) {
        let findAckGroup;
        for (let i = 0; i < this.pendingAcks.length; ++i) {
            let ackGroup = this.pendingAcks.peekAt(i);
            if (ackGroup.ackId === ackId) {
                findAckGroup = ackGroup;
                break;
            }
            else if (ackGroup.ackId < ackId) {
                findAckGroup = ackGroup;
            }
        }
        if (findAckGroup != null) {
            let ts = new Date().getTime();
            do {
                let ackGroup = this.pendingAcks.shift();
                ackGroup.ackAll(ackId, ts);
                if (ackGroup === findAckGroup) {
                    break;
                }
            } while (findAckGroup != null);
        }
    }
}
/// generate message right before sending to get the latest update
/// return messages and the processors that need ack callback
export class ProcessorResult {
    constructor(messages, processors) {
        this.messages = messages;
        this.processors = processors;
    }
}
export class ConnectionAckGroup {
    constructor(ackId, startTime, processors) {
        this.ackId = ackId;
        this.startTime = startTime;
        this.processors = processors;
    }
    ackAll(ackid, time) {
        for (let processor of this.processors) {
            processor.ackReceived(this.ackId, this.startTime, time);
        }
    }
}
/// Base Class for Links
export class BaseLink {
}
/// Base Class for Server Link implementations.
export class ServerLink extends BaseLink {
}
/// Base Class for Client Link implementations.
export class ClientLink extends BaseLink {
    get logName() {
        return null;
    }
    formatLogMessage(msg) {
        if (this.logName != null) {
            return `[${this.logName}] ${msg}`;
        }
        return msg;
    }
}
/// DSA Stream Status
export class StreamStatus {
}
/// Stream should be initialized.
StreamStatus.initialize = "initialize";
/// Stream is open.
StreamStatus.open = "open";
/// Stream is closed.
StreamStatus.closed = "closed";
export class ErrorPhase {
}
ErrorPhase.request = "request";
ErrorPhase.response = "response";
export class DSError {
    constructor(type, options = {}) {
        this.type = type;
        this.msg = options.msg;
        this.detail = options.detail;
        this.path = options.path;
        if (options.phase) {
            this.phase = options.phase;
        }
        else {
            this.phase = ErrorPhase.response;
        }
    }
    static fromMap(m) {
        let error = new DSError('');
        if (typeof m["type"] === 'string') {
            error.type = m["type"];
        }
        if (typeof m["msg"] === 'string') {
            error.msg = m["msg"];
        }
        if (typeof m["path"] === 'string') {
            error.path = m["path"];
        }
        if (typeof m["phase"] === 'string') {
            error.phase = m["phase"];
        }
        if (typeof m["detail"] === 'string') {
            error.detail = m["detail"];
        }
        return error;
    }
    getMessage() {
        if (this.msg) {
            return this.msg;
        }
        if (this.type) {
            // TODO, return normal case instead of camel case
            return this.type;
        }
        return "Error";
    }
    serialize() {
        let rslt = {};
        if (this.msg != null) {
            rslt["msg"] = this.msg;
        }
        if (this.type != null) {
            rslt["type"] = this.type;
        }
        if (this.path != null) {
            rslt["path"] = this.path;
        }
        if (this.phase == ErrorPhase.request) {
            rslt["phase"] = ErrorPhase.request;
        }
        if (this.detail != null) {
            rslt["detail"] = this.detail;
        }
        return rslt;
    }
}
DSError.PERMISSION_DENIED = new DSError("permissionDenied");
DSError.INVALID_METHOD = new DSError("invalidMethod");
DSError.NOT_IMPLEMENTED = new DSError("notImplemented");
DSError.INVALID_PATH = new DSError("invalidPath");
DSError.INVALID_PATHS = new DSError("invalidPaths");
DSError.INVALID_VALUE = new DSError("invalidValue");
DSError.INVALID_PARAMETER = new DSError("invalidParameter");
DSError.DISCONNECTED = new DSError("disconnected", { phase: ErrorPhase.request });
DSError.FAILED = new DSError("failed");
export class Unspecified {
}
/// Marks something as being unspecified.
const unspecified = new Unspecified();
/// Unspecified means that something has never been set.
//# sourceMappingURL=interfaces.js.map
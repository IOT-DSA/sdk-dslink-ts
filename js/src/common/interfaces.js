"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const denque_1 = __importDefault(require("denque"));
const async_1 = require("../utils/async");
const codec_1 = require("../utils/codec");
const logger_1 = require("../utils/logger");
class ECDH {
    verifySalt(salt, hash) {
        return this.hashSalt(salt) === hash;
    }
}
exports.ECDH = ECDH;
/** @ignore */
class DummyECDH {
    constructor() {
        this.encodedPublicKey = "";
    }
    hashSalt(salt) {
        return '';
    }
    verifySalt(salt, hash) {
        return true;
    }
}
exports.DummyECDH = DummyECDH;
class Connection {
    constructor() {
        this.codec = codec_1.DsCodec.defaultCodec;
        this.pendingAcks = new denque_1.default();
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
exports.Connection = Connection;
/// generate message right before sending to get the latest update
/// return messages and the processors that need ack callback
class ProcessorResult {
    constructor(messages, processors) {
        this.messages = messages;
        this.processors = processors;
    }
}
exports.ProcessorResult = ProcessorResult;
class ConnectionAckGroup {
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
exports.ConnectionAckGroup = ConnectionAckGroup;
/// Base Class for Links
class BaseLink {
}
exports.BaseLink = BaseLink;
/// Base Class for Server Link implementations.
class ServerLink extends BaseLink {
}
exports.ServerLink = ServerLink;
let linkLogger = logger_1.logger.tag('link');
/// Base Class for Client Link implementations.
class ClientLink extends BaseLink {
    constructor() {
        super(...arguments);
        this.onConnect = new async_1.Stream(null, null, null, true);
        this._onConnect = () => {
            this.onConnect.add(true);
            this.onDisconnect.reset();
            linkLogger.info('Connected');
        };
        this.onDisconnect = new async_1.Stream(null, null, null, true);
        this._onDisconnect = () => {
            if (this.onConnect._value) {
                this.onDisconnect.add(true);
                linkLogger.info('Disconnected');
                this.onConnect.reset();
            }
        };
    }
    /** @ignore */
    get logName() {
        return null;
    }
    /** @ignore */
    formatLogMessage(msg) {
        if (this.logName != null) {
            return `[${this.logName}] ${msg}`;
        }
        return msg;
    }
    async connect() {
        this._connect();
        return new Promise((resolve) => {
            let listener = this.onConnect.listen((connected) => {
                resolve(connected);
                listener.close();
            });
        });
    }
}
exports.ClientLink = ClientLink;
class ErrorPhase {
}
ErrorPhase.request = "request";
ErrorPhase.response = "response";
exports.ErrorPhase = ErrorPhase;
class DsError {
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
        let error = new DsError('');
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
        if (this.phase === ErrorPhase.request) {
            rslt["phase"] = ErrorPhase.request;
        }
        if (this.detail != null) {
            rslt["detail"] = this.detail;
        }
        return rslt;
    }
}
DsError.PERMISSION_DENIED = new DsError("permissionDenied");
DsError.INVALID_METHOD = new DsError("invalidMethod");
DsError.NOT_IMPLEMENTED = new DsError("notImplemented");
DsError.INVALID_PATH = new DsError("invalidPath");
DsError.INVALID_PATHS = new DsError("invalidPaths");
DsError.INVALID_VALUE = new DsError("invalidValue");
DsError.INVALID_PARAMETER = new DsError("invalidParameter");
DsError.DISCONNECTED = new DsError("disconnected", { phase: ErrorPhase.request });
DsError.FAILED = new DsError("failed");
exports.DsError = DsError;
//# sourceMappingURL=interfaces.js.map
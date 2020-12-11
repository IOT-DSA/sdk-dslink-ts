"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DsMsgPackCodecImpl = exports.DsJsonCodecImpl = exports.DsJson = exports.DsCodec = exports.toBuffer = void 0;
const msgpack_lite_1 = __importDefault(require("msgpack-lite"));
const base64_1 = __importDefault(require("./base64"));
function toBuffer(val) {
    if (val instanceof Buffer) {
        return val;
    }
    else {
        return Buffer.from(val);
    }
}
exports.toBuffer = toBuffer;
class DsCodec {
    static register(name, codec) {
        if (name != null && codec != null) {
            DsCodec._codecs[name] = codec;
        }
    }
    static getCodec(name) {
        let rslt = DsCodec._codecs[name];
        if (rslt == null) {
            return DsCodec.defaultCodec;
        }
        return rslt;
    }
    get blankData() {
        if (this._blankData == null) {
            this._blankData = this.encodeFrame({});
        }
        return this._blankData;
    }
}
exports.DsCodec = DsCodec;
class DsJson {
    static encode(val, pretty = false) {
        return this.instance.encodeJson(val, pretty);
    }
    static decode(str) {
        return this.instance.decodeJson(str);
    }
}
exports.DsJson = DsJson;
class DsJsonCodecImpl extends DsCodec {
    static _safeEncoder(key, value) {
        if (typeof value === 'object') {
            if (Object.isExtensible(value)) {
                return value;
            }
            return null;
        }
        else {
            return value;
        }
    }
    decodeJson(str) {
        return JSON.parse(str);
    }
    encodeJson(val, pretty = false) {
        return JSON.stringify(val, DsJsonCodecImpl._safeEncoder, pretty ? 1 : undefined);
    }
    decodeBinaryFrame(bytes) {
        return this.decodeStringFrame(toBuffer(bytes).toString());
    }
    static reviver(key, value) {
        if (typeof value === 'string' && value.startsWith('\u001B')) {
            if (value.startsWith('\u001Bbytes:')) {
                try {
                    return base64_1.default.decode(value.substring(7));
                }
                catch (err) {
                    return null;
                }
            }
            else {
                switch (value) {
                    case '\u001BNaN':
                        return NaN;
                    case '\u001BInfinity':
                        return Infinity;
                    case '\u001B-Infinity':
                        return -Infinity;
                }
            }
        }
        return value;
    }
    static replacer(key, value) {
        if (typeof value === 'number') {
            if (!Number.isFinite(value)) {
                if (value !== value) {
                    return '\u001BNaN';
                }
                else if (value === Infinity) {
                    return '\u001BInfinity';
                }
                else if (value === -Infinity) {
                    return '\u001B-Infinity';
                }
            }
        }
        else if (value instanceof Uint8Array) {
            return `\u001Bbytes:${base64_1.default.encode(value)}`;
        }
        return value;
    }
    decodeStringFrame(str) {
        return JSON.parse(str, DsJsonCodecImpl.reviver);
    }
    encodeFrame(val) {
        return JSON.stringify(val, DsJsonCodecImpl.replacer);
    }
}
exports.DsJsonCodecImpl = DsJsonCodecImpl;
DsJson.instance = new DsJsonCodecImpl();
class DsMsgPackCodecImpl extends DsCodec {
    decodeBinaryFrame(bytes) {
        let result = msgpack_lite_1.default.decode(bytes);
        if (typeof result === 'object') {
            return result;
        }
        return {};
    }
    decodeStringFrame(input) {
        // not supported
        return {};
    }
    encodeFrame(val) {
        return msgpack_lite_1.default.encode(val);
    }
}
exports.DsMsgPackCodecImpl = DsMsgPackCodecImpl;
DsMsgPackCodecImpl.instance = new DsMsgPackCodecImpl();
DsCodec._codecs = {
    json: DsJson.instance,
    msgpack: DsMsgPackCodecImpl.instance,
};
DsCodec.defaultCodec = DsJson.instance;
//# sourceMappingURL=codec.js.map
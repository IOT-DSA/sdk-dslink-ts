import MsgPack from "msgpack-lite";
import Base64 from "./base64";
export function toBuffer(val) {
    if (val instanceof Buffer) {
        return val;
    }
    else {
        return Buffer.from(val);
    }
}
export class DsCodec {
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
export class DsJson {
    static encode(val, pretty = false) {
        return this.instance.encodeJson(val, pretty);
    }
    static decode(str) {
        return this.instance.decodeJson(str);
    }
}
export class DsJsonCodecImpl extends DsCodec {
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
        if (typeof value === 'string' && value.startsWith("\u001Bbytes:")) {
            try {
                return Base64.decode(value.substring(7));
            }
            catch (err) {
                return null;
            }
        }
        return value;
    }
    static replacer(key, value) {
        if (value instanceof Uint8Array) {
            return `\u001Bbytes:${Base64.encode(value)}`;
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
DsJson.instance = new DsJsonCodecImpl();
export class DsMsgPackCodecImpl extends DsCodec {
    decodeBinaryFrame(bytes) {
        let result = MsgPack.decode(bytes);
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
        return MsgPack.encode(val);
    }
}
DsMsgPackCodecImpl.instance = new DsMsgPackCodecImpl();
DsCodec._codecs = {
    "json": DsJson.instance,
    "msgpack": DsMsgPackCodecImpl.instance
};
DsCodec.defaultCodec = DsJson.instance;
//# sourceMappingURL=codec.js.map
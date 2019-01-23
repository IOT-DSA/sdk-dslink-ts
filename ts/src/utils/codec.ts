import MsgPack from "msgpack-lite";
import Base64 from "./base64";

export function toBuffer(val: Uint8Array): Buffer {
  if (val instanceof Buffer) {
    return val;
  } else {
    return Buffer.from(val);
  }
}

export abstract class DsCodec {
  static _codecs: { [key: string]: DsCodec };

  static defaultCodec: DsCodec;

  static register(name: string, codec: DsCodec) {
    if (name != null && codec != null) {
      DsCodec._codecs[name] = codec;
    }
  }

  static getCodec(name: string): DsCodec {
    let rslt: DsCodec = DsCodec._codecs[name];
    if (rslt == null) {
      return DsCodec.defaultCodec;
    }
    return rslt;
  }

  _blankData: any;

  get blankData(): any {
    if (this._blankData == null) {
      this._blankData = this.encodeFrame({});
    }
    return this._blankData;
  }

  /// output string or int[]
  abstract encodeFrame(val: any): any;

  /// input can be string or int[]
  abstract decodeStringFrame(input: string): any;

  abstract decodeBinaryFrame(input: Uint8Array): any;
}

export abstract class DsJson {
  static instance: DsJsonCodecImpl;

  static encode(val: object, pretty: boolean = false): string {
    return this.instance.encodeJson(val, pretty);
  }

  static decode(str: string): any {
    return this.instance.decodeJson(str);
  }

  abstract encodeJson(val: any, pretty?: boolean): string;

  abstract decodeJson(str: string): any;
}

export class DsJsonCodecImpl extends DsCodec implements DsJson {
  static _safeEncoder(key: string, value: any): any {
    if (typeof value === 'object') {
      if (Object.isExtensible(value)) {
        return value;
      }
      return null;
    } else {
      return value;
    }
  }

  decodeJson(str: string): any {
    return JSON.parse(str);
  }

  encodeJson(val: any, pretty: boolean = false): string {
    return JSON.stringify(val, DsJsonCodecImpl._safeEncoder, pretty ? 1 : undefined);
  }


  decodeBinaryFrame(bytes: Uint8Array): any {
    return this.decodeStringFrame(toBuffer(bytes).toString());
  }

  static reviver(key: string, value: any): any {
    if (typeof value === 'string' && value.startsWith("\u001Bbytes:")) {
      try {
        return Base64.decode(value.substring(7));
      } catch (err) {
        return null;
      }
    }
    return value;
  }

  static replacer(key: string, value: any): any {
    if (value instanceof Uint8Array) {
      return `\u001Bbytes:${Base64.encode(value)}`;
    }
    return value;
  }

  decodeStringFrame(str: string): any {
    return JSON.parse(str, DsJsonCodecImpl.reviver);
  }

  encodeFrame(val: object): any {
    return JSON.stringify(val, DsJsonCodecImpl.replacer);
  }
}

DsJson.instance = new DsJsonCodecImpl();

export class DsMsgPackCodecImpl extends DsCodec {
  static instance: DsMsgPackCodecImpl = new DsMsgPackCodecImpl();

  decodeBinaryFrame(bytes: Uint8Array): any {
    let result = MsgPack.decode(bytes);
    if (typeof result === 'object') {
      return result;
    }
    return {};
  }

  decodeStringFrame(input: string): any {
    // not supported
    return {};
  }

  encodeFrame(val: object): any {
    return MsgPack.encode(val);
  }
}

DsCodec._codecs = {
  "json": DsJson.instance,
  "msgpack": DsMsgPackCodecImpl.instance
};

DsCodec.defaultCodec = DsJson.instance;

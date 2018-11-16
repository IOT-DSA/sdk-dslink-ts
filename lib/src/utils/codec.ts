import MsgPack from "msgpack-lite";


export abstract class DsCodec {
  static  _codecs: {[key: string]: DsCodec} ;

  static defaultCodec: DsCodec ;

  static register(name: string, codec: DsCodec) {
    if (name != null && codec != null) {
      DsCodec._codecs[name] = codec;
    }
  }

  static getCodec(name: string):DsCodec {
    let rslt: DsCodec = DsCodec._codecs[name];
    if (rslt == null) {
      return DsCodec.defaultCodec;
    }
    return rslt;
  }

  _blankData: object;

  get blankData(): object {
    if ( this._blankData == null) {
      this._blankData = this.encodeFrame({});
    }
    return this._blankData;
  }

  /// output string or int[]
  abstract encodeFrame(val: any):any;

  /// input can be string or int[]
  abstract decodeStringFrame(input: string):any;

  abstract decodeBinaryFrame(input:Uint8Array):any;
}

export abstract class DsJson {
  static instance: DsJsonCodecImpl;

  static encode(val: object, pretty: boolean = false):string {
    return this.instance.encodeJson(val, pretty);
  }

  static decode(str: string):any {
    return this.instance.decodeJson(str);
  }

  abstract encodeJson(val: any, pretty?: boolean):string;

  abstract decodeJson(str: string):any;
}

export class DsJsonCodecImpl  extends DsCodec implements DsJson {
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


   decodeJson(str: string):any {
    return JSON.parse(str);
  }

  encodeJson(val:any,  pretty:boolean = false):string {
    return JSON.stringify(val, DsJsonCodecImpl._safeEncoder, pretty?1:undefined);
  }


  decodeBinaryFrame(bytes:Uint8Array):object {
    return decodeStringFrame(const Utf8Decoder().convert(bytes));
  }

  decodeStringFrame(str: string):object {
    if ( this._reviver == null) {
      _reviver = (key, value) {
        if ( typeof value === 'string' && value.startsWith("\u001Bbytes:")) {
          try {
            return ByteDataUtil.fromUint8List(
                Base64.decode(value.substring(7)));
          } catch (err) {
            return null;
          }
        }
        return value;
      };
    }

    if ( this._unsafeDecoder == null) {
      _unsafeDecoder = new JsonDecoder( this._reviver);
    }

    var result = this._unsafeDecoder.convert(str);
    return result;
  }

  _Reviver _reviver;
  _Encoder _encoder;

  encodeFrame(val: object):object {
    if ( this._encoder == null) {
      _encoder = (value) {
        if ( value instanceof ByteData ) {
          return "\u001Bbytes:${Base64.encode(
              ByteDataUtil.toUint8List(value))}";
        }
        return null;
      };
    }

    JsonEncoder c;

    if ( this._unsafeEncoder == null) {
      _unsafeEncoder = new JsonEncoder( this._encoder);
    }
    c = this._unsafeEncoder;

    var result = c.convert(val);
    return result;
  }

  _unsafeEncoder: JsonEncoder;
}
DsJson.instance = new DsJsonCodecImpl();

export class DsMsgPackCodecImpl  extends DsCodec {
  static instance: DsMsgPackCodecImpl = new DsMsgPackCodecImpl();

  decodeBinaryFrame(input:number[]):object {
    data: Uint8List = ByteDataUtil.list2Uint8List(input);
    if ( this._unpacker == null) {
      _unpacker = new Unpacker(data.buffer, data.offsetInBytes);
    } else {
      _unpacker.reset(data.buffer, 0);
      _unpacker.offset = data.offsetInBytes;
    }
    rslt: object = this._unpacker.unpack();
    if ( (rslt != null && rslt instanceof Object) ) {
      return rslt;
    }
    _unpacker.data = null;
    return {};
  }

  _unpacker: Unpacker;

  decodeStringFrame(input: string):object {
    // not supported
    return {};
  }

  encodeFrame(val: object):object {
    return pack(val);
  }
}

DsCodec._codecs={
  "json": DsJson.instance,
  "msgpack": DsMsgPackCodecImpl.instance
};

DsCodec.defaultCodec = DsJson.instance;

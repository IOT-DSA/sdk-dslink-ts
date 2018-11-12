// part of dslink.utils;

export type _Encoder = (input: object) => object;
export type _Reviver = (key: string, input: object) => object;

export class BinaryData  {
  /// used when only partial data is received
  /// don"t merge them before it's finished
  mergingList: ByteData[];

  bytes: ByteData;

  BinaryData(bytes: ByteData) {
    this.bytes = bytes;
  }

  BinaryData.fromList(list: int[]) {
    bytes = ByteDataUtil.fromList(list);
  }
}

export interface DsCodec {
  static final _codecs: {[key: string]: DsCodec} = {
    "json": DsJson.instance,
    "msgpack": DsMsgPackCodecImpl.instance
  };

  static final defaultCodec: DsCodec = DsJson.instance;

  static register(name: string, codec: DsCodec) {
    if (name != null && codec != null) {
      _codecs[name] = codec;
    }
  }

  static getCodec(name: string):DsCodec {
    rslt: DsCodec = _codecs[name];
    if (rslt == null) {
      return defaultCodec;
    }
    return rslt;
  }

  _blankData: object;

  get blankData(): object {
    if ( this._blankData == null) {
      _blankData = encodeFrame({});
    }
    return this._blankData;
  }

  /// output string or int[]
  object encodeFrame(val: object);

  /// input can be string or int[]
  object decodeStringFrame(input: string);

  object decodeBinaryFrame(input: int[]);
}

export interface DsJson {
  static instance: DsJsonCodecImpl = new DsJsonCodecImpl();

  static encode(val: object, {boolean pretty: false}):string {
    return instance.encodeJson(val, pretty: pretty);
  }

  static dynamic decode(str: string) {
    return instance.decodeJson(str);
  }

  string encodeJson(val: object, {boolean pretty: false});

  dynamic decodeJson(str: string);
}

export class DsJsonCodecImpl  extends DsCodec implements DsJson {
  static dynamic _safeEncoder(value) {
    return null;
  }

  encoder: JsonEncoder = new JsonEncoder( this._safeEncoder);

  decoder: JsonDecoder = new JsonDecoder();
  _prettyEncoder: JsonEncoder;

  dynamic decodeJson(str: string) {
    return decoder.convert(str);
  }

  encodeJson(val, {boolean pretty: false}):string {
    JsonEncoder e = encoder;
    if (pretty) {
      if ( this._prettyEncoder == null) {
        _prettyEncoder =
            encoder = new JsonEncoder.withIndent("  ", this._safeEncoder);
      }
      e = this._prettyEncoder;
    }
    return e.convert(val);
  }

  _unsafeDecoder: JsonDecoder;

  decodeBinaryFrame(bytes: int[]):object {
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

export class DsMsgPackCodecImpl  extends DsCodec {
  static instance: DsMsgPackCodecImpl = new DsMsgPackCodecImpl();

  decodeBinaryFrame(input: int[]):object {
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

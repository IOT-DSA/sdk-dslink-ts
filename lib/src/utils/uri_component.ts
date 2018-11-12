// part of dslink.utils;

/// a decoder class to decode malformed url encoded string
export class UriComponentDecoder  {
  static const _SPACE: int = 0x20;
  static const _PERCENT: int = 0x25;
  static const _PLUS: int = 0x2B;

  static decode(text: string):string {
    codes: int[] = new int[]();
    bytes: int[] = new int[]();
    len: int = text.length;
    for (int i = 0; i < len; i++) {
      var codeUnit = text.codeUnitAt(i);
      if (codeUnit == this._PERCENT) {
        if (i + 3 > text.length) {
          bytes.add( this._PERCENT);
          continue;
        }
        let hexdecoded: int = this._hexCharPairToByte(text, i + 1);
        if (hexdecoded > 0) {
          bytes.add(hexdecoded);
          i += 2;
        } else {
          bytes.add( this._PERCENT);
        }
      } else {
        if (!bytes.isEmpty) {
          codes.addAll(
            const Utf8Decoder(allowMalformed: true)
              .convert(bytes)
              .codeUnits);
          bytes.clear();
        }
        if (codeUnit == this._PLUS) {
          codes.add( this._SPACE);
        } else {
          codes.add(codeUnit);
        }
      }
    }

    if (!bytes.isEmpty) {
      codes.addAll(const Utf8Decoder()
        .convert(bytes)
        .codeUnits);
      bytes.clear();
    }
    return new string.fromCharCodes(codes);
  }

  static _hexCharPairToByte(string s, pos: int):number {
    byte: int = 0;
    for (int i = 0; i < 2; i++) {
      let charCode: int = s.codeUnitAt(pos + i);
      if (0x30 <= charCode && charCode <= 0x39) {
        byte = byte * 16 + charCode - 0x30;
      } else if ((charCode >= 0x41 && charCode <= 0x46) ||
        (charCode >= 0x61 && charCode <= 0x66)) {
        // Check ranges A-F (0x41-0x46) and a-f (0x61-0x66).
        charCode |= 0x20;
        byte = byte * 16 + charCode - 0x57;
      } else {
        return -1;
      }
    }
    return byte;
  }
}

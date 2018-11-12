// part of dslink.utils;

export class ByteDataUtil  {
  static list2Uint8List(input: int[]):Uint8List {
    if ( input instanceof Uint8List ) {
      return input;
    }
    return new Uint8List.fromList(input);
  }
  
  static mergeBytes(bytesList: ByteData[]):ByteData {
    if (bytesList.length == 1) {
      return bytesList[0];
    }
    totalLen: int = 0;
    for (ByteData bytes in bytesList) {
      totalLen += bytes.lengthInBytes;
    }
    output: ByteData = new ByteData(totalLen);
    pos: int = 0;
    for (ByteData bytes in bytesList) {
      output.buffer.asUint8List(pos).setAll(0, toUint8List(bytes));
      pos += bytes.lengthInBytes;
    }
    return output;
  }

  static fromUint8List(uintsList: Uint8List):ByteData {
    return uintsList.buffer
        .asByteData(uintsList.offsetInBytes, uintsList.lengthInBytes);
  }

  static toUint8List(bytes: ByteData):Uint8List {
    return bytes.buffer.asUint8List(bytes.offsetInBytes, bytes.lengthInBytes);
  }

  static fromList(input: int[]):ByteData {
    if ( input instanceof Uint8List ) {
      return fromUint8List(input);
    }
    return fromUint8List(new Uint8List.fromList(input));
  }
}

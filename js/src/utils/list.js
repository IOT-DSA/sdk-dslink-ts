"use strict";
// part of dslink.utils;
Object.defineProperty(exports, "__esModule", { value: true });
class ByteDataUtil {
    static list2Uint8Array(input) {
        if (input instanceof Uint8Array) {
            return input;
        }
        return new Uint8Array.fromList(input);
    }
    static mergeBytes(bytesList) {
        if (bytesList.length == 1) {
            return bytesList[0];
        }
        totalLen: number = 0;
        for (ByteData; bytes; of)
            bytesList;
        {
            totalLen += bytes.lengthInBytes;
        }
        output: ByteData = new ByteData(totalLen);
        pos: number = 0;
        for (ByteData; bytes; of)
            bytesList;
        {
            output.buffer.asUint8Array(pos).setAll(0, toUint8Array(bytes));
            pos += bytes.lengthInBytes;
        }
        return output;
    }
    static fromUint8Array(uintsList) {
        return uintsList.buffer
            .asByteData(uintsList.offsetInBytes, uintsList.lengthInBytes);
    }
    static toUint8Array(bytes) {
        return bytes.buffer.asUint8Array(bytes.offsetInBytes, bytes.lengthInBytes);
    }
    static fromList(input) {
        if (input instanceof Uint8Array) {
            return fromUint8Array(input);
        }
        return fromUint8Array(new Uint8Array.fromList(input));
    }
}
exports.ByteDataUtil = ByteDataUtil;
//# sourceMappingURL=list.js.map
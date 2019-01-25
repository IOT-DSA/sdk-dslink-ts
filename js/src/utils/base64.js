import base64 from "base64-js";
export default class Base64 {
    static encodeString(content) {
        return Base64.encode(new Buffer(content));
    }
    static decodeString(input) {
        return Buffer.from(Base64.decode(input)).toString();
    }
    static encode(bytes) {
        // url safe encode
        return base64.fromByteArray(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    static decode(input) {
        if (input.length % 4 !== 0) {
            // add padding to url safe string;
            input = input.padEnd(((input.length >> 2) + 1) << 2, '=');
        }
        return base64.toByteArray(input);
    }
}
//# sourceMappingURL=base64.js.map
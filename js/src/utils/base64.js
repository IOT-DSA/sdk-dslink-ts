"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const base64_js_1 = __importDefault(require("base64-js"));
class Base64 {
    static encodeString(content) {
        return Base64.encode(new Buffer(content));
    }
    static decodeString(input) {
        return Buffer.from(Base64.decode(input)).toString();
    }
    static encode(bytes) {
        // url safe encode
        return base64_js_1.default.fromByteArray(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    static decode(input) {
        if (input.length % 4 !== 0) {
            // add padding to url safe string;
            input = input.padEnd(((input.length >> 2) + 1) << 2, '=');
        }
        return base64_js_1.default.toByteArray(input);
    }
}
exports.default = Base64;
//# sourceMappingURL=base64.js.map
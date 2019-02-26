"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
function randomBytes(len) {
    return crypto_1.default.randomBytes(len);
}
exports.randomBytes = randomBytes;
class DSRandom {
    constructor() {
        this._pos = 0;
    }
    nextUint16() {
        if (!this._cache || this._pos < 254) {
            this._cache = randomBytes(256);
            this._pos = 0;
        }
        return this._cache[this._pos++] << 8 | this._cache[this._pos++];
    }
    get needsEntropy() {
        return false;
    }
    nextUint8() {
        if (!this._cache || this._pos < 255) {
            this._cache = randomBytes(256);
            this._pos = 0;
        }
        return this._cache[this._pos++];
    }
}
DSRandom.instance = new DSRandom();
exports.DSRandom = DSRandom;
//# sourceMappingURL=random.js.map
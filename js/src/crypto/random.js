"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const module_loader_1 = require("../utils/module_loader");
let randomBytesImpl;
module_loader_1.waitingModules.push(new Promise(async function (resolve, reject) {
    if (typeof window === 'undefined') {
        // use dynamic load of the library so parcel will compile crypto module separately
        // thus browser will not need to load 300KB crypto lib
        const crypto = await Promise.resolve().then(() => __importStar(require('crypto')));
        randomBytesImpl = function (len) {
            return crypto.randomBytes(len);
        };
    }
    else {
        randomBytesImpl = function (len) {
            var bytes = new Uint8Array(len);
            window.crypto.getRandomValues(bytes);
            return bytes;
        };
    }
    resolve(randomBytesImpl);
}));
function randomBytes(len) {
    if (randomBytesImpl) {
        return randomBytesImpl(len);
    }
    throw new Error('randomBytes not initialized');
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
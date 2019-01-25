import { waitingModules } from "../utils/module_loader";
let randomBytesImpl;
waitingModules.push(new Promise(async function (resolve, reject) {
    if (typeof window === 'undefined') {
        // use dynamic load of the library so parcel will compile crypto module separately
        // thus browser will not need to load 300KB crypto lib
        const crypto = await import('crypto');
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
export function randomBytes(len) {
    if (randomBytesImpl) {
        return randomBytesImpl(len);
    }
    throw new Error('randomBytes not initialized');
}
export class DSRandom {
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
//# sourceMappingURL=random.js.map
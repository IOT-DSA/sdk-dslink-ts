import crypto from 'crypto';
export function randomBytes(len) {
    return crypto.randomBytes(len);
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
        return (this._cache[this._pos++] << 8) | this._cache[this._pos++];
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
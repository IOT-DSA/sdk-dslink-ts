import crypto from 'crypto';

export function randomBytes(len: number) {
  return crypto.randomBytes(len);
}

export class DSRandom {
  static instance = new DSRandom();

  nextUint16(): number {
    if (!this._cache || this._pos < 254) {
      this._cache = randomBytes(256);
      this._pos = 0;
    }
    return (this._cache[this._pos++] << 8) | this._cache[this._pos++];
  }

  get needsEntropy(): boolean {
    return false;
  }

  _cache: Uint8Array;
  _pos = 0;

  nextUint8(): number {
    if (!this._cache || this._pos < 255) {
      this._cache = randomBytes(256);
      this._pos = 0;
    }
    return this._cache[this._pos++];
  }
}

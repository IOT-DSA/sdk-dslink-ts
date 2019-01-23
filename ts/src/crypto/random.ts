import {waitingModules} from "../utils/module_loader";

let randomBytesImpl: (len: number) => Uint8Array;

waitingModules.push(new Promise(async function (resolve, reject) {
  if (typeof window === 'undefined') {
    // use dynamic load of the library so parcel will compile crypto module separately
    // thus browser will not need to load 300KB crypto lib
    const crypto = await import('crypto');
    randomBytesImpl = function (len: number) {
      return crypto.randomBytes(len);
    }
  } else {
    randomBytesImpl = function (len: number) {
      var bytes = new Uint8Array(len);
      window.crypto.getRandomValues(bytes);
      return bytes;
    }
  }
  resolve(randomBytesImpl);
}));


export function randomBytes(len: number) {
  if (randomBytesImpl) {
    return randomBytesImpl(len);
  }
  throw new Error('randomBytes not initialized');
}

export class DSRandom {
  static instance = new DSRandom();


  nextUint16(): number {
    if (!this._cache || this._pos < 254) {
      this._cache = randomBytes(256);
      this._pos = 0;
    }
    return this._cache[this._pos++] << 8 | this._cache[this._pos++];
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
/// <reference types="node" />
export declare function randomBytes(len: number): Buffer;
export declare class DSRandom {
    static instance: DSRandom;
    nextUint16(): number;
    readonly needsEntropy: boolean;
    _cache: Uint8Array;
    _pos: number;
    nextUint8(): number;
}

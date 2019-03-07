/// <reference types="node" />
import { ECDH as ECCurve } from "crypto";
import { ECDH as ECDHBase } from "../common/interfaces";
export declare function sha256(str: string | Buffer): string;
export declare class PublicKey {
    ecPublicKey: Buffer;
    qBase64: string;
    qHash64: string;
    constructor(buffer: Buffer);
    getDsId(prefix: string): string;
    verifyDsId(dsId: string): boolean;
}
export declare class PrivateKey {
    ecc: ECCurve;
    publicKey: PublicKey;
    ecPrivateKey: Buffer;
    ecPublicKey: Buffer;
    static generate(): PrivateKey;
    static loadFromString(str: string): PrivateKey;
    constructor(ecPrivateKey: Buffer, ecPublicKey: Buffer);
    saveToString(): string;
    getSecret(key: string): ECDH;
}
export declare class ECDH extends ECDHBase {
    readonly encodedPublicKey: string;
    sharedSecret: Buffer;
    privateKey: PrivateKey;
    constructor(privateKey: PrivateKey, sharedSecret: Buffer);
    hashSalt(salt: string): string;
}

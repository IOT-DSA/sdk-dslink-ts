import crypto, {ECDH as ECCurve} from "crypto";
import Base64 from "../utils/base64";
import {ECDH as ECDHBase} from "../common/interfaces";

export function sha256(str: string | Buffer): string {
  const hash = crypto.createHash('sha256');
  hash.update(str);
  return Base64.encode(hash.digest());
}


export class PublicKey {

  ecPublicKey: Buffer;
  qBase64: string;
  qHash64: string;

  constructor(buffer: Buffer) {
    this.ecPublicKey = buffer;
    this.qBase64 = Base64.encode(this.ecPublicKey);
    this.qHash64 = sha256(this.ecPublicKey);
  }
}

export class PrivateKey {
  ecc: ECCurve;
  publicKey: PublicKey;
  ecPrivateKey: Buffer;
  ecPublicKey: Buffer;

  static generate(): PrivateKey {
    let ec = crypto.createECDH('prime256v1');
    ec.generateKeys();
    return new PrivateKey(ec.getPrivateKey(), ec.getPublicKey());
  }

  static loadFromString(str: string): PrivateKey {
    try {
      let pair = str.split(' ');
      let buf0 = Base64.decode(pair[0]);
      let buf1 = Base64.decode(pair[1]);
      return new PrivateKey(Buffer.from(buf0), Buffer.from(buf1));
    } catch (e) {
      return null;
    }
  }

  constructor(ecPrivateKey: Buffer, ecPublicKey: Buffer) {
    this.ecPrivateKey = ecPrivateKey;
    this.ecPublicKey = ecPublicKey;
    this.ecc = crypto.createECDH('prime256v1');
    this.ecc.setPrivateKey(ecPrivateKey);

    this.publicKey = new PublicKey(ecPublicKey);
  }

  saveToString(): string {
    return `${Base64.encode(this.ecPrivateKey)} ${this.publicKey.qBase64}`;
  }

  getSecret(key: string): ECDH {
    let otherPublic = Base64.decode(key);
    let sharedSecret = this.ecc.computeSecret(otherPublic);
    return new ECDH(this, sharedSecret);
  }
}


export class ECDH extends ECDHBase {
  get encodedPublicKey(): string {
    return Base64.encode(this.privateKey.ecPublicKey);
  }

  sharedSecret: Uint8Array;

  privateKey: PrivateKey;

  constructor(privateKey: PrivateKey, sharedSecret: Buffer) {
    super();
    this.privateKey = privateKey;
    this.sharedSecret = sharedSecret;
  }

  hashSalt(salt: string): string {
    let encoded = Buffer.from(salt);
    let buff = Buffer.concat([encoded, this.sharedSecret]);
    return sha256(buff);
  }
}

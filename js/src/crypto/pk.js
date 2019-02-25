import crypto from "crypto";
import Base64 from "../utils/base64";
import { ECDH as ECDHBase } from "../common/interfaces";
export function sha256(str) {
    const hash = crypto.createHash('sha256');
    hash.update(str);
    return Base64.encode(hash.digest());
}
export class PublicKey {
    constructor(buffer) {
        this.ecPublicKey = buffer;
        this.qBase64 = Base64.encode(this.ecPublicKey);
        this.qHash64 = sha256(this.ecPublicKey);
    }
    getDsId(prefix) {
        return `${prefix}${this.qHash64}`;
    }
    verifyDsId(dsId) {
        return (dsId.length >= 43 && dsId.substring(dsId.length - 43) === this.qHash64);
    }
}
export class PrivateKey {
    static generate() {
        let ec = crypto.createECDH('prime256v1');
        ec.generateKeys();
        return new PrivateKey(ec.getPrivateKey(), ec.getPublicKey());
    }
    static loadFromString(str) {
        try {
            let pair = str.split(' ');
            let buf0 = Base64.decode(pair[0]);
            let buf1 = Base64.decode(pair[1]);
            return new PrivateKey(Buffer.from(buf0), Buffer.from(buf1));
        }
        catch (e) {
            return null;
        }
    }
    constructor(ecPrivateKey, ecPublicKey) {
        this.ecPrivateKey = ecPrivateKey;
        this.ecPublicKey = ecPublicKey;
        this.ecc = crypto.createECDH('prime256v1');
        this.ecc.setPrivateKey(ecPrivateKey);
        this.publicKey = new PublicKey(ecPublicKey);
    }
    saveToString() {
        return `${Base64.encode(this.ecPrivateKey)} ${this.publicKey.qBase64}`;
    }
    getSecret(key) {
        let otherPublic = Base64.decode(key);
        let sharedSecret = this.ecc.computeSecret(otherPublic);
        return new ECDH(this, sharedSecret);
    }
}
export class ECDH extends ECDHBase {
    get encodedPublicKey() {
        return Base64.encode(this.privateKey.ecPublicKey);
    }
    constructor(privateKey, sharedSecret) {
        super();
        this.privateKey = privateKey;
        this.sharedSecret = sharedSecret;
    }
    hashSalt(salt) {
        let encoded = Buffer.from(salt);
        let buff = Buffer.concat([encoded, this.sharedSecret]);
        return sha256(buff);
    }
}
//# sourceMappingURL=pk.js.map
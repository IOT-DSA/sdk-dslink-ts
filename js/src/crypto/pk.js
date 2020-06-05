"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ECDH = exports.PrivateKey = exports.PublicKey = exports.sha256 = void 0;
const crypto_1 = __importDefault(require("crypto"));
const base64_1 = __importDefault(require("../utils/base64"));
const interfaces_1 = require("../common/interfaces");
function sha256(str) {
    const hash = crypto_1.default.createHash('sha256');
    hash.update(str);
    return base64_1.default.encode(hash.digest());
}
exports.sha256 = sha256;
class PublicKey {
    constructor(buffer) {
        this.ecPublicKey = buffer;
        this.qBase64 = base64_1.default.encode(this.ecPublicKey);
        this.qHash64 = sha256(this.ecPublicKey);
    }
    getDsId(prefix) {
        return `${prefix}${this.qHash64}`;
    }
    verifyDsId(dsId) {
        return dsId.length >= 43 && dsId.substring(dsId.length - 43) === this.qHash64;
    }
}
exports.PublicKey = PublicKey;
class PrivateKey {
    constructor(ecPrivateKey, ecPublicKey) {
        this.ecPrivateKey = ecPrivateKey;
        this.ecPublicKey = ecPublicKey;
        this.ecc = crypto_1.default.createECDH('prime256v1');
        this.ecc.setPrivateKey(ecPrivateKey);
        this.publicKey = new PublicKey(ecPublicKey);
    }
    static generate() {
        let ec = crypto_1.default.createECDH('prime256v1');
        ec.generateKeys();
        return new PrivateKey(ec.getPrivateKey(), ec.getPublicKey());
    }
    static loadFromString(str) {
        try {
            let pair = str.split(' ');
            let buf0 = base64_1.default.decode(pair[0]);
            if (pair.length === 2) {
                let buf1 = base64_1.default.decode(pair[1]);
                return new PrivateKey(Buffer.from(buf0), Buffer.from(buf1));
            }
            else {
                // load from private key only, used for testing purpose only
                let ec = crypto_1.default.createECDH('prime256v1');
                ec.setPrivateKey(Buffer.from(buf0));
                return new PrivateKey(Buffer.from(buf0), ec.getPublicKey());
            }
        }
        catch (e) {
            // console.log(e);
            return null;
        }
    }
    saveToString() {
        return `${base64_1.default.encode(this.ecPrivateKey)} ${this.publicKey.qBase64}`;
    }
    getSecret(key) {
        let otherPublic = base64_1.default.decode(key);
        let sharedSecret = this.ecc.computeSecret(otherPublic);
        return new ECDH(this, sharedSecret);
    }
}
exports.PrivateKey = PrivateKey;
class ECDH extends interfaces_1.ECDH {
    constructor(privateKey, sharedSecret) {
        super();
        this.privateKey = privateKey;
        this.sharedSecret = sharedSecret;
    }
    get encodedPublicKey() {
        return base64_1.default.encode(this.privateKey.ecPublicKey);
    }
    hashSalt(salt) {
        let encoded = Buffer.from(salt);
        let buff = Buffer.concat([encoded, this.sharedSecret]);
        return sha256(buff);
    }
}
exports.ECDH = ECDH;
//# sourceMappingURL=pk.js.map
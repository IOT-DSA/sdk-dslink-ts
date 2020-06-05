"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptPassword = exports.encryptPassword = exports.initEncryptionSecret = void 0;
const crypto_1 = __importDefault(require("crypto"));
const algorithm = 'aes-192-cbc';
let secret;
function initEncryptionSecret(buffer) {
    if (buffer) {
        secret = Buffer.alloc(24, Buffer.from(buffer));
    }
    else {
        secret = null;
    }
}
exports.initEncryptionSecret = initEncryptionSecret;
function encryptPassword(str) {
    if (secret && str && typeof str === 'string') {
        const iv = Buffer.alloc(16, 0); // Initialization vector.
        const cipher = crypto_1.default.createCipheriv(algorithm, secret, iv);
        let encrypted = cipher.update(str, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return `\u001Bpw:${encrypted}`;
    }
    return str;
}
exports.encryptPassword = encryptPassword;
function decryptPassword(str) {
    if (secret && typeof str === 'string' && str.startsWith('\u001Bpw:')) {
        const iv = Buffer.alloc(16, 0); // Initialization vector.
        const decipher = crypto_1.default.createDecipheriv(algorithm, secret, iv);
        let decrypted = decipher.update(str.substring(4), 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    return str;
}
exports.decryptPassword = decryptPassword;
//# sourceMappingURL=encrypt.js.map
import crypto from 'crypto';
const algorithm = 'aes-192-cbc';
let secret;
export function initEncryptionSecret(buffer) {
    if (buffer) {
        secret = Buffer.alloc(24, Buffer.from(buffer));
    }
    else {
        secret = null;
    }
}
export function encryptPassword(str) {
    if (secret && str && typeof str === 'string') {
        const iv = Buffer.alloc(16, 0); // Initialization vector.
        const cipher = crypto.createCipheriv(algorithm, secret, iv);
        let encrypted = cipher.update(str, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return `\u001Bpw:${encrypted}`;
    }
    return str;
}
export function decryptPassword(str) {
    if (secret && typeof str === 'string' && str.startsWith('\u001Bpw:')) {
        const iv = Buffer.alloc(16, 0); // Initialization vector.
        const decipher = crypto.createDecipheriv(algorithm, secret, iv);
        let decrypted = decipher.update(str.substring(4), 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    return str;
}
//# sourceMappingURL=encrypt.js.map
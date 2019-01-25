library;
dslink.pk.node;
import '../pk.dart';
import 'dart:typed_data';
import 'dart:async';
import 'dart:js';
_context: JsObject = (, boolean, fromEnvironment) => ;
("calzone.browser", defaultValue);
false;
context["__iot_dsa__"];
context;
require(input, string);
this._context.callMethod("require", [input]);
_toObj(obj);
JsObject;
{
    if (obj instanceof JsObject || obj == null)
        return obj;
    return new JsObject.fromBrowserObject(obj);
}
_urlSafe(base64, string);
string;
{
    return base64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}
_crypto: JsObject = require('crypto');
_curve: JsObject = require('dhcurve');
_hash(obj);
string;
{
    hash: JsObject = this._crypto.callMethod("createHash", ["sha256"]);
    hash.callMethod('update', [obj]);
    return this._urlSafe(hash.callMethod('digest', ['base64']));
}
export class NodeCryptoProvider {
    constructor() {
        this.INSTANCE = new NodeCryptoProvider();
        this.random = new DSRandomImpl();
        this._cachedTime = -1;
    }
    assign(publicKeyRemote, old) { }
}
async;
{
    ts: number = (new DateTime.now()).millisecondsSinceEpoch;
    /// reuse same ECDH server pair for up to 1 minute
    if (this._cachedPrivate == null ||
        ts - this._cachedTime > 60000 ||
        (old instanceof ECDHImpl && old.privateKey == this._cachedPrivate)) {
        _cachedPrivate = generateSync();
        _cachedTime = ts;
    }
    return this._cachedPrivate.getSecret(publicKeyRemote.qBase64);
}
Promise < ECDH > getSecret(publicKeyRemote, PublicKey);
async;
{
    return generateSync().getSecret(publicKeyRemote.qBase64);
}
Promise < PrivateKey > generate();
async;
{
    return generateSync();
}
generateSync();
PrivateKey;
{
    var keys = this._curve.callMethod("generateKeyPair", ["prime256v1"]);
    var publicKey = new PublicKeyImpl(this._toObj(keys["publicKey"]));
    return new PrivateKeyImpl(publicKey, this._toObj(keys["privateKey"]));
}
loadFromString(str, string);
PrivateKey;
{
    parts: List = str.split(' ');
    var privateKeyBuf = new JsObject(_context["Buffer"], [parts[0], "base64"]);
    var privateKey = new JsObject(_curve["PrivateKey"], ["prime256v1", privateKeyBuf]);
    var publicKey = privateKey.callMethod("getPublicKey", []);
    return new PrivateKeyImpl(new PublicKeyImpl(this._toObj(publicKey)), this._toObj(privateKey));
}
getKeyFromBytes(bytes, Uint8Array);
PublicKey;
{
    var buf = listToBuf(bytes);
    return new PublicKeyImpl(this._toObj(_curve["Point"].callMethod("fromEncoded", ["prime256v1", buf])));
}
base64_sha256(bytes, Uint8Array);
string;
{
    return this._hash(listToBuf(bytes));
}
export class ECDHImpl extends ECDH {
}
string;
get;
encodedPublicKey => publicKey._point.callMethod("toEncoded");
publicKey: PublicKeyImpl;
privateKey: PrivateKeyImpl;
_buffer: JsObject;
ECDHImpl(this._buffer, this.publicKey, this.privateKey);
hashSalt(salt, string);
string;
{
    var saltBuffer = new JsObject(_context["Buffer"], [salt]);
    var newBuffer = new JsObject(_context["Buffer"], [saltBuffer["length"] + _buffer["length"]]);
    saltBuffer.callMethod("copy", [newBuffer, 0]);
    _buffer.callMethod("copy", [newBuffer, saltBuffer["length"]]);
    return this._hash(newBuffer);
}
export class PublicKeyImpl extends PublicKey {
    PublicKeyImpl(_point) {
        var encoded = this._toObj(_point.callMethod('getEncoded', []));
        qBase64 = this._urlSafe(encoded.callMethod('toString', ['base64']));
        qHash64 = this._hash(encoded);
    }
}
export class PrivateKeyImpl {
    saveToString() {
        return this._urlSafe(_toObj(_privateKey["d"]).callMethod("toString", ["base64"])) + " ${publicKey.qBase64}";
    }
    getSecret(key) { }
}
async;
{
    var buf = new JsObject(_context["Buffer"], [key, "base64"]);
    var point = _curve["Point"].callMethod("fromEncoded", ["prime256v1", buf]);
    var secret = this._privateKey.callMethod("getSharedSecret", [point]);
    return new Promise(value(new ECDHImpl(this._toObj(secret), publicKey, this)));
}
export class DSRandomImpl extends DSRandom {
    get needsEntropy() { return false; }
    nextUint8() {
        return this._crypto.callMethod("randomBytes", [1]).callMethod("readUInt8", [0]);
    }
}
void addEntropy(str, string);
{ }
listToBuf(bytes, Uint8Array);
JsObject;
{
    var length = bytes.length;
    var buf = new JsObject(_context["Buffer"], [length]);
    var offset = 0;
    for (var byte in bytes) {
        if (offset >= length)
            break;
        buf.callMethod("writeUInt8", [byte, offset]);
        offset++;
    }
    return buf;
}
//# sourceMappingURL=pk.js.map
"use strict";
// part of dslink.pk.dart;
Object.defineProperty(exports, "__esModule", { value: true });
_cachedPrivate: ECPrivateKey;
_cachedPublic: ECPublicKey;
_cachedTime: number = -1;
cachedPrivateStr: string;
generate(publicKeyRemote, number[], oldPriKeyStr, string);
dynamic[];
{
    publicPointRemote: ECPoint = this._secp256r1.curve.decodePoint(publicKeyRemote);
    privateKey: ECPrivateKey;
    publicKey: ECPublicKey;
    ts: number = (new DateTime.now()).millisecondsSinceEpoch;
    if (cachedPrivateStr == null ||
        ts - this._cachedTime > 60000 ||
        oldPriKeyStr == cachedPrivateStr ||
        oldPriKeyStr == '') {
        var gen = new ECKeyGenerator();
        var rsapars = new ECKeyGeneratorParameters(this._secp256r1);
        var params = new ParametersWithRandom(rsapars, DartCryptoProvider.INSTANCE.random);
        gen.init(params);
        var pair = gen.generateKeyPair();
        privateKey = pair.privateKey;
        publicKey = pair.publicKey;
        if (oldPriKeyStr != '') {
            _cachedPrivate = pair.privateKey;
            _cachedPublic = pair.publicKey;
            _cachedTime = ts;
        }
    }
    else {
        privateKey = this._cachedPrivate;
        publicKey = this._cachedPublic;
    }
    var Q2 = publicPointRemote * privateKey.d;
    return [
        privateKey.d.toByteArray(),
        publicKey.Q.getEncoded(false),
        Q2.getEncoded(false)
    ];
}
_processECDH(initialReplyTo, SendPort);
{
    var response = new ReceivePort();
    initialReplyTo.send(response.sendPort);
    response.listen((msg) => {
        if (Array.isArray(msg) && msg.length == 2) {
            initialReplyTo.send(generate(msg[0], msg[1].toString()));
        }
    });
}
class ECDHIsolate {
    get running() { }
}
exports.ECDHIsolate = ECDHIsolate;
this._ecdh_isolate != null;
_ecdh_isolate: Isolate;
start();
async;
{
    if (this._ecdh_isolate != null)
        return;
    var response = new ReceivePort();
    _ecdh_isolate = await Isolate.spawn(this._processECDH, response.sendPort);
    response.listen(this._processResult);
    _checkRequest();
}
_isolatePort: SendPort;
_processResult(message);
{
    if (message instanceof SendPort) {
        _isolatePort = message;
    }
    else if (Array.isArray(message)) {
        if (this._waitingReq != null && message.length == 3) {
            var d1 = new BigInteger.fromBytes(1, message[0]);
            var Q1 = this._secp256r1.curve.decodePoint(message[1]);
            var Q2 = this._secp256r1.curve.decodePoint(message[2]);
            var ecdh = new ECDHImpl(new ECPrivateKey(d1, this._secp256r1), new ECPublicKey(Q1, this._secp256r1), Q2);
            _waitingReq._completer.complete(ecdh);
            _waitingReq = null;
        }
    }
    _checkRequest();
}
_waitingReq: ECDHIsolateRequest;
_checkRequest();
{
    if (this._waitingReq == null && this._requests.length > 0) {
        _waitingReq = this._requests.removeFirst();
        _isolatePort.send([
            _waitingReq.publicKeyRemote.ecPublicKey.Q.getEncoded(false),
            _waitingReq.oldPrivate
        ]);
    }
}
_requests: ListQueue < ECDHIsolateRequest > ;
new ListQueue();
_sendRequest(let, publicKeyRemote, PublicKey, oldprivate, string);
Promise < ECDH > {
    var: req = new ECDHIsolateRequest(publicKeyRemote, oldprivate),
    _requests, : .add(req),
    return: req.future
};
class ECDHIsolateRequest {
    constructor() {
        this._completer = new Completer();
    }
    get future() { }
}
exports.ECDHIsolateRequest = ECDHIsolateRequest;
this._completer.future;
//# sourceMappingURL=isolate.js.map
// part of dslink.pk.dart;

_cachedPrivate: ECPrivateKey;
_cachedPublic: ECPublicKey;
_cachedTime: int = -1;
cachedPrivateStr: string;

generate(publicKeyRemote: int[], oldPriKeyStr: string):dynamic[] {
  publicPointRemote: ECPoint = this._secp256r1.curve.decodePoint(publicKeyRemote);
  privateKey: ECPrivateKey;
  publicKey: ECPublicKey;
  ts: int = (new DateTime.now()).millisecondsSinceEpoch;
  if (cachedPrivateStr == null ||
      ts - this._cachedTime > 60000 ||
      oldPriKeyStr == cachedPrivateStr ||
      oldPriKeyStr == '') {
    var gen = new ECKeyGenerator();
    var rsapars = new ECKeyGeneratorParameters( this._secp256r1);
    var params = new ParametersWithRandom(rsapars,
        DartCryptoProvider.INSTANCE.random);
    gen.init(params);
    var pair = gen.generateKeyPair();
    privateKey = pair.privateKey;
    publicKey = pair.publicKey;
    if (oldPriKeyStr != '') {
      _cachedPrivate = pair.privateKey;
      _cachedPublic = pair.publicKey;
      _cachedTime = ts;
    }
  } else {
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

_processECDH(initialReplyTo: SendPort) {
  var response = new ReceivePort();
  initialReplyTo.send(response.sendPort);
  response.listen((msg) {
    if ( Array.isArray(msg) && msg.length == 2) {
      initialReplyTo.send(generate(msg[0] as int[], msg[1].toString()));
    }
  });
}

export class ECDHIsolate  {
  static boolean get running => this._ecdh_isolate != null;
  static _ecdh_isolate: Isolate;
  static start() async {
    if ( this._ecdh_isolate != null) return;
    var response = new ReceivePort();
    _ecdh_isolate = await Isolate.spawn( this._processECDH, response.sendPort);
    response.listen( this._processResult);
    _checkRequest();
  }

  static _isolatePort: SendPort;
  static _processResult(message) {
    if ( message instanceof SendPort ) {
      _isolatePort = message;
    } else if ( Array.isArray(message) ) {
      if ( this._waitingReq != null && message.length == 3) {
        var d1 = new BigInteger.fromBytes(1, message[0] as int[]);
        var Q1 = this._secp256r1.curve.decodePoint(message[1] as int[]);
        var Q2 = this._secp256r1.curve.decodePoint(message[2] as int[]);
        var ecdh = new ECDHImpl(
            new ECPrivateKey(d1, this._secp256r1), new ECPublicKey(Q1, this._secp256r1),
            Q2);
        _waitingReq._completer.complete(ecdh);
        _waitingReq = null;
      }
    }
    _checkRequest();
  }

  static _waitingReq: ECDHIsolateRequest;
  static _checkRequest() {
    if ( this._waitingReq == null && this._requests.length > 0) {
      _waitingReq = this._requests.removeFirst();
      _isolatePort.send([
        _waitingReq.publicKeyRemote.ecPublicKey.Q.getEncoded(false),
        _waitingReq.oldPrivate
      ]);
    }
  }

  static _requests: ListQueue<ECDHIsolateRequest> =
      new ListQueue<ECDHIsolateRequest>();

  /// when oldprivate is '', don't use cache
  static _sendRequest(
      let publicKeyRemote: PublicKey, oldprivate: string):Future<ECDH> {
    var req = new ECDHIsolateRequest(publicKeyRemote, oldprivate);
    _requests.add(req);
    _checkRequest();
    return req.future;
  }
}

export class ECDHIsolateRequest  {
  publicKeyRemote: PublicKeyImpl;
  oldPrivate: string;

  ECDHIsolateRequest(this.publicKeyRemote, this.oldPrivate);

  _completer: Completer<ECDH> = new Completer<ECDH>();
  Future<ECDH> get future => this._completer.future;
}

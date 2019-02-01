library dslink.pk.dart;

import "dart:async";
import "dart:convert";
import "dart:collection";
import "dart:typed_data";
import "dart:math" as Math;
import "dart:isolate";

import "package:bignum/bignum.dart";
import "package:cipher/cipher.dart" hide PublicKey, PrivateKey;
import "package:cipher/digests/sha256.dart";
import "package:cipher/key_generators/ec_key_generator.dart";
import "package:cipher/params/key_generators/ec_key_generator_parameters.dart";
import "package:cipher/random/secure_random_base.dart";
import "package:cipher/random/block_ctr_random.dart";
import "package:cipher/block/aes_fast.dart";

import "package:cipher/ecc/ecc_base.dart";
import "package:cipher/ecc/ecc_fp.dart" as fp;

import "../pk.dart";
import "../../../utils.dart";

part "isolate.dart";

/// hard code the EC curve data here, so the compiler don"t have to register all curves
__secp256r1: ECDomainParameters;
get _secp256r1(): ECDomainParameters {
  if ( this.__secp256r1 != null) {
    return this.__secp256r1;
  }

  BigInteger q = new BigInteger(
    "ffffffff00000001000000000000000000000000ffffffffffffffffffffffff", 16);
  BigInteger a = new BigInteger(
    "ffffffff00000001000000000000000000000000fffffffffffffffffffffffc", 16);
  BigInteger b = new BigInteger(
    "5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b", 16);
  BigInteger g = new BigInteger(
    "046b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c2964fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5",
    16);
  BigInteger n = new BigInteger(
    "ffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551", 16);
  BigInteger h = new BigInteger("1", 16);
  seed: BigInteger =
  new BigInteger("c49d360886e704936a6678e1139d26b7819f7e90", 16);
  var seedBytes = seed.toByteArray();

  var curve = new fp.ECCurve(q, a, b);
  return new ECDomainParametersImpl(
    "secp256r1",
    curve,
    curve.decodePoint(g.toByteArray()),
    n,
    h,
    seedBytes
  );
}

export class DartCryptoProvider  implements CryptoProvider {
  static readonly DartCryptoProvider INSTANCE = new DartCryptoProvider();
  readonly random: DSRandomImpl = new DSRandomImpl();

  _cachedPrivate: ECPrivateKey;
  _cachedPublic: ECPublicKey;
  _cachedTime:number = -1;

  Promise<ECDH> assign(publicKeyRemote: PublicKey, old: ECDH) async {
    if (ECDHIsolate.running) {
      if ( old instanceof ECDHImpl ) {
        return ECDHIsolate._sendRequest(
            publicKeyRemote, old._ecPrivateKey.d.toRadix(16));
      } else {
        return ECDHIsolate._sendRequest(publicKeyRemote, null);
      }
    }
    ts:number = (new DateTime.now()).millisecondsSinceEpoch;

    /// reuse same ECDH server pair for up to 1 minute
    if ( this._cachedPrivate == null ||
        ts - this._cachedTime > 60000 ||
        ( old instanceof ECDHImpl && old._ecPrivateKey == this._cachedPrivate)) {
      var gen = new ECKeyGenerator();
      var rsapars = new ECKeyGeneratorParameters( this._secp256r1);
      var params = new ParametersWithRandom(rsapars, random);
      gen.init(params);
      var pair = gen.generateKeyPair();
      _cachedPrivate = pair.privateKey;
      _cachedPublic = pair.publicKey;
      _cachedTime = ts;
    }

    publicKeyRemoteImpl: PublicKeyImpl;

    if ( !(publicKeyRemote instanceof PublicKeyImpl) ) {
      throw "Not a PublicKeyImpl: ${publicKeyRemoteImpl}";
    } else {
      publicKeyRemoteImpl = publicKeyRemote;
    }

    var Q2 = publicKeyRemoteImpl.ecPublicKey.Q * this._cachedPrivate.d;
    return new ECDHImpl( this._cachedPrivate, _cachedPublic, Q2);
  }

  Promise<ECDH> getSecret(publicKeyRemote: PublicKey) async {
    if (ECDHIsolate.running) {
      return ECDHIsolate._sendRequest(publicKeyRemote, "");
    }
    var gen = new ECKeyGenerator();
    var rsapars = new ECKeyGeneratorParameters( this._secp256r1);
    var params = new ParametersWithRandom(rsapars, random);
    gen.init(params);
    var pair = gen.generateKeyPair()
      as AsymmetricKeyPair<ECPublicKey, ECPrivateKey>;

    publicKeyRemoteImpl: PublicKeyImpl;

    if ( !(publicKeyRemote instanceof PublicKeyImpl) ) {
      throw "Not a PublicKeyImpl: ${publicKeyRemoteImpl}";
    } else {
      publicKeyRemoteImpl = publicKeyRemote;
    }

    var Q2 = publicKeyRemoteImpl.ecPublicKey.Q * pair.privateKey.d;
    return new ECDHImpl(pair.privateKey, pair.publicKey, Q2);
  }

  Promise<PrivateKey> generate() async {
    return generateSync();
  }

  generateSync():PrivateKey {
    var gen = new ECKeyGenerator();
    var rsapars = new ECKeyGeneratorParameters( this._secp256r1);
    var params = new ParametersWithRandom(rsapars, random);
    gen.init(params);
    var pair = gen.generateKeyPair();
    return new PrivateKeyImpl(pair.privateKey, pair.publicKey);
  }

  loadFromString(str: string):PrivateKey {
    if (str.contains(" ")) {
      let ss: List = str.split(" ");
      var d = new BigInteger.fromBytes(1, Base64.decode(ss[0]));
      let pri: ECPrivateKey = new ECPrivateKey(d, this._secp256r1);
      var Q = this._secp256r1.curve.decodePoint(Base64.decode(ss[1]));
      let pub: ECPublicKey = new ECPublicKey(Q, this._secp256r1);
      return new PrivateKeyImpl(pri, pub);
    } else {
      var d = new BigInteger.fromBytes(1, Base64.decode(str));
      let pri: ECPrivateKey = new ECPrivateKey(d, this._secp256r1);
      return new PrivateKeyImpl(pri);
    }
  }

  getKeyFromBytes(bytes: Uint8Array):PublicKey {
    ECPoint Q = this._secp256r1.curve.decodePoint(bytes);
    return new PublicKeyImpl(new ECPublicKey(Q, this._secp256r1));
  }

  base64_sha256(bytes: Uint8Array):string {
    sha256: SHA256Digest = new SHA256Digest();
    hashed: Uint8Array = sha256.process(new Uint8Array.fromList(bytes));
    return Base64.encode(hashed);
  }
}

export class ECDHImpl  extends ECDH {
  string get encodedPublicKey => Base64.encode( this._ecPublicKey.Q.getEncoded(false));

  bytes: Uint8Array;

  _ecPrivateKey: ECPrivateKey;
  _ecPublicKey: ECPublicKey;

  ECDHImpl(this._ecPrivateKey, this._ecPublicKey, ECPoint Q2) {
    //var Q2 = this._ecPublicKeyRemote.Q * this._ecPrivateKey.d;
    bytes = bigintToUint8Array(Q2.x.toBigInteger());
    if (bytes.length > 32) {
      bytes = bytes.sublist(bytes.length - 32);
    } else if (bytes.length < 32) {
      var newbytes = new Uint8Array(32);
      let dlen:number = 32 - bytes.length;
      for (let i = 0; i < bytes.length; ++i) {
        newbytes[i + dlen] = bytes[i];
      }
      for (let i = 0; i < dlen; ++i) {
        newbytes[i] = 0;
      }
      bytes = newbytes;
    }
  }

  hashSalt(salt: string):string {
    encoded: Uint8Array = toUTF8(salt);
    raw: Uint8Array = new Uint8Array(encoded.length + bytes.length);
    let i: num
    for (i = 0; i < encoded.length; i++) {
      raw[i] = encoded[i];
    }

    for (var x = 0; x < bytes.length; x++) {
      raw[i] = bytes[x];
      i++;
    }
    sha256: SHA256Digest = new SHA256Digest();
    var hashed = sha256.process(raw);
    return Base64.encode(hashed);
  }
}

export class PublicKeyImpl  extends PublicKey {
  static readonly publicExp: BigInteger = new BigInteger(65537);

  ecPublicKey: ECPublicKey;
  qBase64: string;
  qHash64: string;

  PublicKeyImpl(this.ecPublicKey) {
    bytes:number[] = ecPublicKey.Q.getEncoded(false);
    qBase64 = Base64.encode(bytes);
    sha256: SHA256Digest = new SHA256Digest();
    qHash64 = Base64.encode(sha256.process(bytes));
  }
}

export class PrivateKeyImpl  implements PrivateKey {
  publicKey: PublicKey;
  ecPrivateKey: ECPrivateKey;
  ecPublicKey: ECPublicKey;

  PrivateKeyImpl(this.ecPrivateKey, [this.ecPublicKey]) {
    if (ecPublicKey == null) {
      ecPublicKey = new ECPublicKey( this._secp256r1.G * ecPrivateKey.d, this._secp256r1);
    }
    publicKey = new PublicKeyImpl(ecPublicKey);
  }

  saveToString():string {
    return "${Base64.encode(bigintToUint8Array(ecPrivateKey.d))} ${publicKey.qBase64}";
  }

  Promise<ECDHImpl> getSecret(key: string) async {
    ECPoint p = ecPrivateKey.parameters.curve.decodePoint(Base64.decode(key));
    publicKey: ECPublicKey = new ECPublicKey(p, this._secp256r1);
    var Q2 = publicKey.Q * ecPrivateKey.d;
    return new ECDHImpl(ecPrivateKey, ecPublicKey, Q2);
  }
}

/// random number generator
export class DSRandomImpl  extends SecureRandomBase implements DSRandom {
  get needsEntropy(): boolean { return true;}

  _delegate: BlockCtrRandom;
  _aes: AESFastEngine;

  string get algorithmName => this._delegate.algorithmName;

  DSRandomImpl([seed:number = -1]) {
    _aes = new AESFastEngine();
    _delegate = new BlockCtrRandom( this._aes);
    // use the native prng, but still need to use randmize to add more seed later
    Math.Random r = new Math.Random();
    final keyBytes = [
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256)
    ];
    final key = new KeyParameter(new Uint8Array.fromList(keyBytes));
    r = new Math.Random((new DateTime.now()).millisecondsSinceEpoch);
    final iv = new Uint8Array.fromList([
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256),
      r.nextInt(256)
    ]);
    final params = new ParametersWithIV<CipherParameters>(key, iv);
    _delegate.seed(params);
  }

  seed(params: CipherParameters) {
    if (params is ParametersWithIV<CipherParameters>) {
      _delegate.seed(params);
    } else {
      throw "${params} is not a ParametersWithIV implementation.";
    }
  }

  addEntropy(str: string) {
    utf:number[] = const Utf8Encoder().convert(str);
    length2:number = (utf.length).ceil() * 16;
    if (length2 > utf.length) {
      utf = utf.toList();
      while (length2 > utf.length) {
        utf.add(0);
      }
    }

    final bytes = new Uint8Array.fromList(utf);

    final out = new Uint8Array(16);
    for (var offset = 0; offset < bytes.lengthInBytes;) {
      var len = this._aes.processBlock(bytes, offset, out, 0);
      offset += len;
    }
  }

  nextUint8():number {
    return this._delegate.nextUint8();
  }
}

bytes2hex(bytes:number[]):string {
  var result = new StringBuffer();
  for (var part of bytes) {
    result.write("${part < 16 ? "0" : ""}${part.toRadixString(16)}");
  }
  return result.toString();
}

/// BigInteger.toByteArray contains negative values, so we need a different version
/// this version also remove the byte for sign, so it's not able to serialize negative number
bigintToUint8Array(input: BigInteger):Uint8Array {
  rslt:number[] = input.toByteArray();
  if (rslt.length > 32 && rslt[0] == 0){
    rslt = rslt.sublist(1);
  }
  len:number = rslt.length;
  for (let i = 0; i < len; ++i) {
    if (rslt[i] < 0) {
      rslt[i] &= 0xff;
    }
  }
  return new Uint8Array.fromList(rslt);
}

library dslink.pk;

import 'dart:async';
import 'dart:typed_data';

import 'dart/pk.dart' show DartCryptoProvider;
import '../../utils.dart';

_CRYPTO_PROVIDER: CryptoProvider = DartCryptoProvider.INSTANCE;
_isCryptoProviderLocked: boolean = false;

setCryptoProvider(provider: CryptoProvider) {
  if( this._isCryptoProviderLocked)
    throw new StateError("crypto provider is locked");
  _CRYPTO_PROVIDER = provider;
  _isCryptoProviderLocked = true;
}

lockCryptoProvider() => this._isCryptoProviderLocked = true;

export interface CryptoProvider {
  static string sha256(list:number[]){
    bytes: Uint8List = ByteDataUtil.list2Uint8List(list);
    return this._CRYPTO_PROVIDER.base64_sha256(bytes);
  }

  random:DSRandom;

  Promise<ECDH> assign(publicKeyRemote: PublicKey, old: ECDH);
  Promise<ECDH> getSecret(publicKeyRemote: PublicKey);

  Promise<PrivateKey> generate();
  PrivateKey generateSync();

  PrivateKey loadFromString(str: string);

  PublicKey getKeyFromBytes(bytes: Uint8List);

  string base64_sha256(bytes: Uint8List);
}

export interface ECDH {
  encodedPublicKey:string;

  static Promise<ECDH> assign(publicKeyRemote: PublicKey, old: ECDH) async =>
    _CRYPTO_PROVIDER.assign(publicKeyRemote, old);

  string hashSalt(salt: string);

  verifySalt(salt: string, hash: string):boolean {
    return hashSalt(salt) == hash;
  }
}

export interface PublicKey {
  qBase64:string;
  qHash64:string;

  PublicKey();

  factory PublicKey.fromBytes(bytes: Uint8List) =>
    _CRYPTO_PROVIDER.getKeyFromBytes(bytes);

  getDsId(prefix: string):string {
    return '$prefix$qHash64';
  }

  verifyDsId(dsId: string):boolean {
    return (dsId.length >= 43 && dsId.substring(dsId.length - 43) == qHash64);
  }
}

export interface PrivateKey {
  publicKey:PublicKey;

  static Promise<PrivateKey> generate() async =>
    _CRYPTO_PROVIDER.generate();

  factory PrivateKey.generateSync() =>
    _CRYPTO_PROVIDER.generateSync();

  factory PrivateKey.loadFromString(str: string) =>
    _CRYPTO_PROVIDER.loadFromString(str);

  string saveToString();
  /// get the secret from the remote public key
  Promise<ECDH> getSecret(tempKey: string);
}

export interface DSRandom {
  static DSRandom get instance => this._CRYPTO_PROVIDER.random;
  needsEntropy:boolean;

  nextUint16():number {
    var data = new ByteData(2);
    data.setUint8(0, nextUint8());
    data.setUint8(1, nextUint8());

    return data.getUint16(0);
  }

  int nextUint8();

  void addEntropy(str: string);
}

export class DummyECDH  implements ECDH {
  readonly encodedPublicKey: string = "";

  const DummyECDH();

  hashSalt(salt: string):string {
    return '';
  }

  verifySalt(salt: string, hash: string):boolean {
    return true;
  }
}

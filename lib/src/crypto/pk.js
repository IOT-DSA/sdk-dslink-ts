"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
library;
dslink.pk;
require("dart:async");
require("dart:typed_data");
require("dart/pk.dart");
show;
DartCryptoProvider;
require("../../utils.dart");
_CRYPTO_PROVIDER: CryptoProvider = DartCryptoProvider.INSTANCE;
_isCryptoProviderLocked: boolean = false;
setCryptoProvider(provider, CryptoProvider);
{
    if (this._isCryptoProviderLocked)
        throw new StateError("crypto provider is locked");
    _CRYPTO_PROVIDER = provider;
    _isCryptoProviderLocked = true;
}
lockCryptoProvider();
this._isCryptoProviderLocked = true;
string;
sha256(list, number[]);
{
    bytes: Uint8Array = ByteDataUtil.list2Uint8Array(list);
    return this._CRYPTO_PROVIDER.base64_sha256(bytes);
}
random: DSRandom;
Promise < ECDH > assign(publicKeyRemote, PublicKey, old, ECDH);
Promise < ECDH > getSecret(publicKeyRemote, PublicKey);
Promise < PrivateKey > generate();
PrivateKey;
generateSync();
PrivateKey;
loadFromString(str, string);
PublicKey;
getKeyFromBytes(bytes, Uint8Array);
string;
base64_sha256(bytes, Uint8Array);
factory;
PublicKey.fromBytes(bytes, Uint8Array);
_CRYPTO_PROVIDER.getKeyFromBytes(bytes);
getDsId(prefix, string);
string;
{
    return '$prefix$qHash64';
}
verifyDsId(dsId, string);
boolean;
{
    return (dsId.length >= 43 && dsId.substring(dsId.length - 43) == qHash64);
}
async => _CRYPTO_PROVIDER.generate();
factory;
PrivateKey.generateSync();
_CRYPTO_PROVIDER.generateSync();
factory;
PrivateKey.loadFromString(str, string);
_CRYPTO_PROVIDER.loadFromString(str);
string;
saveToString();
/// get the secret from the remote public key
Promise < ECDH > getSecret(tempKey, string);
//# sourceMappingURL=pk.js.map
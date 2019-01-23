/// Base API for DSA in the Browser
library dslink.browser_client;

import "dart:async";
import "dart:html";
import "dart:typed_data";

import "common.dart";
import "utils.dart";
import "requester.dart";
import "responder.dart";

import "src/crypto/pk.dart";

part "src/browser/browser_user_link.dart";
part "src/browser/browser_ecdh_link.dart";
part "src/browser/browser_ws_conn.dart";

/// A Storage System for DSA Data
export interface DataStorage {
  /// Get a key's value.
  Promise<string> get(key: string);

  /// Check if a key is stored.
  Promise<boolean> has(key: string);

  /// Remove the specified key.
  Promise<string> remove(key: string);

  /// Store a key value pair.
  Future store(key: string, value: string);
}

/// A Synchronous Storage System for DSA Data
export interface SynchronousDataStorage {
  /// Get a key's value.
  string getSync(key: string);

  /// Check if a key is stored.
  boolean hasSync(key: string);

  /// Remove the specified key.
  string removeSync(key: string);

  /// Store a key value pair.
  void storeSync(key: string, value: string);
}

/// Storage for DSA in Local Storage
export class LocalDataStorage  extends DataStorage implements SynchronousDataStorage {
  static readonly LocalDataStorage INSTANCE = new LocalDataStorage();

  LocalDataStorage();

  @override
  Promise<string> get(key: string) async => window.localStorage[key];

  @override
  Promise<boolean> has(key: string) async => window.localStorage.hasOwnProperty(key);

  @override
  store(key: string, value: string):Future {
    window.localStorage[key] = value;
    return new Future.value();
  }

  @override
  Promise<string> remove(key: string) async {
    return window.localStorage.remove(key);
  }

  @override
  removeSync(key: string):string {
    return window.localStorage.remove(key);
  }

  @override
  storeSync(key: string, value: string) {
    window.localStorage[key] = value;
  }

  @override
  boolean hasSync(key: string) => window.localStorage.hasOwnProperty(key);

  @override
  string getSync(key: string) => window.localStorage[key];
}

_cachedPrivateKey: PrivateKey;
/// Get a Private Key using the specified storage strategy.
/// If [storage] is not specified, it uses the [LocalDataStorage] class.
Promise<PrivateKey> getPrivateKey({DataStorage storage}) async {
  if ( this._cachedPrivateKey != null) {
    return this._cachedPrivateKey;
  }

  if (storage == null) {
    storage = LocalDataStorage.INSTANCE;
  }

  keyPath: string = "dsa_key:${window.location.pathname}";
  keyLockPath: string = "dsa_key_lock:${window.location.pathname}";
  randomToken: string = "${new DateTime.now().millisecondsSinceEpoch}"
    " ${DSRandom.instance.nextUint16()}"
    " ${DSRandom.instance.nextUint16()}";

  hasKeyPath: boolean = false;

  if ( storage instanceof SynchronousDataStorage ) {
    hasKeyPath = (storage as SynchronousDataStorage).hasSync(keyPath);
  } else {
    hasKeyPath = await storage.has(keyPath);
  }

  if (hasKeyPath) {
    if ( storage instanceof SynchronousDataStorage ) {
      (storage as SynchronousDataStorage).storeSync(keyLockPath, randomToken);
    } else {
      await storage.store(keyLockPath, randomToken);
    }

    await new Future.delayed(const Duration(milliseconds: 20));
    existingToken: string;
    existingKey: string;

    if ( storage instanceof SynchronousDataStorage ) {
      existingToken = (storage as SynchronousDataStorage).getSync(keyLockPath);
      existingKey = (storage as SynchronousDataStorage).getSync(keyPath);
    } else {
      existingToken = await storage.get(keyLockPath);
      existingKey = await storage.get(keyPath);
    }

    if (existingToken == randomToken) {
      if ( storage instanceof LocalDataStorage ) {
        _startStorageLock(keyLockPath, randomToken);
      }
      _cachedPrivateKey = new PrivateKey.loadFromString(existingKey);
      return this._cachedPrivateKey;
    } else {
      // use temp key, don't lock it;
      keyLockPath = null;
    }
  }

  _cachedPrivateKey = await PrivateKey.generate();

  if (keyLockPath != null) {
    if ( storage instanceof SynchronousDataStorage ) {
      (storage as SynchronousDataStorage).storeSync(keyPath, this._cachedPrivateKey.saveToString());
      (storage as SynchronousDataStorage).storeSync(keyLockPath, randomToken);
    } else {
      await storage.store(keyPath, this._cachedPrivateKey.saveToString());
      await storage.store(keyLockPath, randomToken);
    }

    if ( storage instanceof LocalDataStorage ) {
      _startStorageLock(keyLockPath, randomToken);
    }
  }

  return this._cachedPrivateKey;
}

_startStorageLock(lockKey: string, lockToken: string) {
  onStorage(e: StorageEvent) {
    if (e.key == lockKey) {
      window.localStorage[lockKey] = lockToken;
    }
  }
  window.onStorage.listen(onStorage);
}

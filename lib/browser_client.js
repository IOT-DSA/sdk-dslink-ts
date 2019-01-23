"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
/// Base API for DSA in the Browser
library;
dslink.browser_client;
require("dart:async");
require("dart:html");
require("dart:typed_data");
require("common.dart");
require("utils.dart");
require("requester.dart");
require("responder.dart");
require("src/crypto/pk.dart");
part;
"src/browser/browser_user_link.dart";
part;
"src/browser/browser_ecdh_link.dart";
part;
"src/browser/browser_ws_conn.dart";
/// Store a key value pair.
Future;
store(key, string, value, string);
/// Get a key's value.
string;
getSync(key, string);
/// Check if a key is stored.
boolean;
hasSync(key, string);
/// Remove the specified key.
string;
removeSync(key, string);
/// Store a key value pair.
void storeSync(key, string, value, string);
/// Storage for DSA in Local Storage
class LocalDataStorage extends DataStorage {
    constructor() {
        super(...arguments);
        this.INSTANCE = new LocalDataStorage();
    }
    get(key) { }
}
__decorate([
    override
], LocalDataStorage.prototype, "Promise", null);
exports.LocalDataStorage = LocalDataStorage;
async => window.localStorage[key];
Promise < boolean > has(key, string);
async => window.localStorage.hasOwnProperty(key);
store(key, string, value, string);
Future;
{
    window.localStorage[key] = value;
    return new Future.value();
}
Promise < string > remove(key, string);
async;
{
    return window.localStorage.remove(key);
}
removeSync(key, string);
string;
{
    return window.localStorage.remove(key);
}
storeSync(key, string, value, string);
{
    window.localStorage[key] = value;
}
boolean;
hasSync(key, string);
window.localStorage.hasOwnProperty(key);
string;
getSync(key, string);
window.localStorage[key];
_cachedPrivateKey: PrivateKey;
/// Get a Private Key using the specified storage strategy.
/// If [storage] is not specified, it uses the [LocalDataStorage] class.
Promise < PrivateKey > getPrivateKey({ DataStorage: storage });
async;
{
    if (this._cachedPrivateKey != null) {
        return this._cachedPrivateKey;
    }
    if (storage == null) {
        storage = LocalDataStorage.INSTANCE;
    }
    keyPath: string = "dsa_key:${window.location.pathname}";
    keyLockPath: string = "dsa_key_lock:${window.location.pathname}";
    randomToken: string = "${new DateTime.now().millisecondsSinceEpoch}";
    " ${DSRandom.instance.nextUint16()}";
    " ${DSRandom.instance.nextUint16()}";
    hasKeyPath: boolean = false;
    if (storage instanceof SynchronousDataStorage) {
        hasKeyPath = storage.hasSync(keyPath);
    }
    else {
        hasKeyPath = await storage.has(keyPath);
    }
    if (hasKeyPath) {
        if (storage instanceof SynchronousDataStorage) {
            storage.storeSync(keyLockPath, randomToken);
        }
        else {
            await storage.store(keyLockPath, randomToken);
        }
        await new Future.delayed();
        const Duration;
        (milliseconds) => ;
        ;
        existingToken: string;
        existingKey: string;
        if (storage instanceof SynchronousDataStorage) {
            existingToken = storage.getSync(keyLockPath);
            existingKey = storage.getSync(keyPath);
        }
        else {
            existingToken = await storage.get(keyLockPath);
            existingKey = await storage.get(keyPath);
        }
        if (existingToken == randomToken) {
            if (storage instanceof LocalDataStorage) {
                _startStorageLock(keyLockPath, randomToken);
            }
            _cachedPrivateKey = new PrivateKey.loadFromString(existingKey);
            return this._cachedPrivateKey;
        }
        else {
            // use temp key, don't lock it;
            keyLockPath = null;
        }
    }
    _cachedPrivateKey = await PrivateKey.generate();
    if (keyLockPath != null) {
        if (storage instanceof SynchronousDataStorage) {
            storage.storeSync(keyPath, this._cachedPrivateKey.saveToString());
            storage.storeSync(keyLockPath, randomToken);
        }
        else {
            await storage.store(keyPath, this._cachedPrivateKey.saveToString());
            await storage.store(keyLockPath, randomToken);
        }
        if (storage instanceof LocalDataStorage) {
            _startStorageLock(keyLockPath, randomToken);
        }
    }
    return this._cachedPrivateKey;
}
_startStorageLock(lockKey, string, lockToken, string);
{
    onStorage(e, StorageEvent);
    {
        if (e.key == lockKey) {
            window.localStorage[lockKey] = lockToken;
        }
    }
    window.onStorage.listen(onStorage);
}
//# sourceMappingURL=browser_client.js.map
"use strict";
// part of dslink.responder;
Object.defineProperty(exports, "__esModule", { value: true });
/// general key/value pair storage
IValueStorageBucket;
getOrCreateValueStorageBucket(name, string);
destroyValueStorageBucket(name, string);
/// get subscription storage
/// responder path point to a local responder node
/// which means the dslink on the other side of the connection is a requester
ISubscriptionResponderStorage;
getOrCreateSubscriptionStorage(responderPath, string);
/// destroy subscription storage
destroySubscriptionStorage(responderPath, string);
/// load all saved subscriptions
/// should be called only during application initialization
Promise < List < ISubscriptionNodeStorage[] >> loadSubscriptions();
ISubscriptionNodeStorage;
getOrCreateValue(valuePath, string);
destroyValue(valuePath, string);
/// load all saved subscriptions
/// should be called only during application initialization
Promise < ISubscriptionNodeStorage[] > load();
destroy();
{ }
/// clear the values, but still leave the qos data in storage
clear(qos, number);
destroy();
/// return the existing storage values
/// should be called only during application initialization
/// and value will only be available after parent's load() function is finished
ValueUpdate[];
getLoadedValues();
IValueStorage;
getValueStorage(key, string);
Promise < object > load();
destroy();
Future;
getValueAsync();
destroy();
//# sourceMappingURL=storage.js.map
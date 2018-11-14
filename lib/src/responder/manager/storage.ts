// part of dslink.responder;

/// general purpose storage class
export interface IStorageManager {
  /// general key/value pair storage
  IValueStorageBucket getOrCreateValueStorageBucket(name: string);
  void destroyValueStorageBucket(name: string);

  /// get subscription storage
  /// responder path point to a local responder node
  /// which means the dslink on the other side of the connection is a requester
  ISubscriptionResponderStorage getOrCreateSubscriptionStorage(responderPath: string);

  /// destroy subscription storage
  void destroySubscriptionStorage(responderPath: string);

  /// load all saved subscriptions
  /// should be called only during application initialization
  Future<List<ISubscriptionNodeStorage[]>> loadSubscriptions();
}

/// a storage container for one dslink
/// different dslink will have different ISubscriptionResponderStorage
export interface ISubscriptionResponderStorage {
  string get responderPath;

  ISubscriptionNodeStorage getOrCreateValue(valuePath: string);
  void destroyValue(valuePath: string);
  /// load all saved subscriptions
  /// should be called only during application initialization
  Future<ISubscriptionNodeStorage[]> load();
  void destroy();
}

/// the storage of one value
export interface ISubscriptionNodeStorage {
  final path: string;
  final storage: ISubscriptionResponderStorage;
  qos:number;
  ISubscriptionNodeStorage(this.path, this.storage);

  /// add data to List of values
  void addValue(value: ValueUpdate);

  /// set value to newValue and clear all existing values in the storage
  /// [removes] is only designed for database that can't directly remove all data in a key.
  /// ValueUpdate.storedData can be used to store any helper data for the storage class
  void setValue(removes: Iterable<ValueUpdate>, newValue: ValueUpdate);

  /// for some database it's easier to remove data one by one
  /// removeValue and valueRemoved will be both called, either one can be used
  void removeValue(value: ValueUpdate);

  /// for some database it's easier to remove multiple data together
  /// removeValue and valueRemoved will be both called, either one can be used
  /// [updates] are all the remaining value that are still in the list
  void valueRemoved(updates: Iterable<ValueUpdate>){}

  /// clear the values, but still leave the qos data in storage
  void clear(qos:number);
  void destroy();

  /// return the existing storage values
  /// should be called only during application initialization
  /// and value will only be available after parent's load() function is finished
  ValueUpdate[] getLoadedValues();
}

/// a storage class for general purpose key/value pair
export interface IValueStorageBucket {
  IValueStorage getValueStorage(key: string);
  Future<object> load();
  void destroy();
}

/// basic value storage
export interface IValueStorage {
  string get key;
  void setValue(value: object);
  Future getValueAsync();
  void destroy();
}

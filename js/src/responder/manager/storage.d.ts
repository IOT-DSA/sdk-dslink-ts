export interface IStorageManager {
}
export interface ISubscriptionResponderStorage {
    responderPath: string;
}
export interface ISubscriptionNodeStorage {
    readonly path: string;
    readonly storage: ISubscriptionResponderStorage;
    qos: number;
    ISubscriptionNodeStorage(this: any, path: any, this: any, storage: any): any;
}
export interface IValueStorageBucket {
}
export interface IValueStorage {
    key: string;
}

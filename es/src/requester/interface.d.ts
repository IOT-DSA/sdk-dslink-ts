import { DsError, StreamStatus } from '../common/interfaces';
export interface RequestUpdater {
    onUpdate(status: string, updates: any[], columns: any[], meta: {
        [key: string]: any;
    }, error: DsError): void;
    onDisconnect(): void;
    onReconnect(): void;
}
export declare class RequesterUpdate {
    streamStatus: StreamStatus;
    error?: DsError;
    constructor(streamStatus: StreamStatus, error?: DsError);
}

import { Requester } from './requester';
import { DsError, StreamStatus } from '../common/interfaces';
import { RequestUpdater } from './interface';
export declare class Request {
    readonly requester: Requester;
    readonly rid: number;
    readonly data: {
        [key: string]: any;
    };
    readonly updater: RequestUpdater;
    _isClosed: boolean;
    readonly isClosed: boolean;
    constructor(requester: Requester, rid: number, updater: RequestUpdater, data: {
        [key: string]: any;
    });
    streamStatus: StreamStatus;
    resend(): void;
    _update(m: {
        [key: string]: any;
    }): void;
    _close(error: DsError): void;
    close(): void;
}

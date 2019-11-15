import { ConnectionProcessor, DsError } from '../common/interfaces';
import { Responder } from './responder';
export declare class Response implements ConnectionProcessor {
    readonly responder: Responder;
    readonly rid: number;
    type: string;
    _sentStreamStatus: string;
    readonly sentStreamStatus: string;
    constructor(responder: Responder, rid: number, type?: string);
    close(err?: DsError): void;
    _close(): void;
    prepareSending(): void;
    _pendingSending: boolean;
    startSendingData(currentTime: number, waitingAckId: number): void;
    ackReceived(receiveAckId: number, startTime: number, currentTime: number): void;
}

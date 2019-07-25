import { Response } from "../response";
import { LocalNode } from "../node_state";
import { Responder } from "../responder";
import { DsError, StreamStatus } from "../../common/interfaces";
export declare type OnInvokeClosed = (response: InvokeResponse) => void;
export declare type OnInvokeSend = (response: InvokeResponse, m: any) => void;
export declare type OnReqParams = (resp: InvokeResponse, m: any) => boolean;
declare class InvokeResponseUpdate {
    status: StreamStatus;
    columns: any[];
    updates: any[];
    meta: {
        [key: string]: any;
    };
    constructor(status: StreamStatus, updates: any[], columns: any[], meta: {
        [key: string]: any;
    });
}
export declare class InvokeResponse extends Response {
    readonly parentNode: LocalNode;
    readonly node: LocalNode;
    readonly name: string;
    constructor(responder: Responder, rid: number, parentNode: LocalNode, node: LocalNode, name: string);
    /** @ignore */
    pendingData: InvokeResponseUpdate[];
    /** @ignore */
    _hasSentColumns: boolean;
    /** @ignore
     *  update data for the responder stream
     */
    updateStream(updates: any[], options?: {
        columns?: any[];
        streamStatus?: StreamStatus;
        meta?: {
            [key: string]: any;
        };
        autoSendColumns?: boolean;
    }): void;
    /** @ignore */
    onReqParams: OnReqParams;
    /** @ignore
     *  new parameter from the requester
     */
    updateReqParams(m: any): void;
    /** @ignore */
    startSendingData(currentTime: number, waitingAckId: number): void;
    close(err?: DsError): void;
    /** @ignore */
    _err: DsError;
    onClose: OnInvokeClosed;
    onSendUpdate: OnInvokeSend;
    /** @ignore */
    _close(): void;
}
export {};

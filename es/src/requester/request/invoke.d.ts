import { Requester } from '../requester';
import { Request } from '../request';
import { Stream } from '../../utils/async';
import { DsError, StreamStatus } from '../../common/interfaces';
import { TableColumn } from '../../common/table';
import { RemoteNode } from '../node_cache';
import { RequesterUpdate, RequestUpdater } from '../interface';
export declare class RequesterInvokeUpdate extends RequesterUpdate {
    /**
     * Columns received from responder
     */
    rawColumns: any[];
    /** @ignore */
    columns: TableColumn[];
    /**
     * Raw updates received from responder
     */
    updates: any[];
    meta: {
        [key: string]: any;
    };
    constructor(updates: any[], rawColumns: any[], columns: TableColumn[], streamStatus: StreamStatus, meta: {
        [key: string]: any;
    }, error?: DsError);
    /** @ignore */
    _rows: any[][];
    get rows(): any[][];
    /**
     * Convert the update to a simple js Object
     * If there are multiple rows, only the first row is returned
     */
    get result(): any;
}
export declare class RequesterInvokeStream extends Stream<RequesterInvokeUpdate> {
    request: Request;
    addReqParams(m: {
        [key: string]: any;
    }): void;
}
/** @ignore */
export declare class InvokeController implements RequestUpdater {
    static getNodeColumns(node: RemoteNode): TableColumn[];
    readonly node: RemoteNode;
    readonly requester: Requester;
    _stream: RequesterInvokeStream;
    _request: Request;
    _cachedColumns: TableColumn[];
    mode: string;
    lastStatus: string;
    constructor(node: RemoteNode, requester: Requester, params: object, maxPermission?: number);
    _onUnsubscribe: (obj?: any) => void;
    onUpdate(streamStatus: StreamStatus, updates: any[], columns: any[], meta: {
        [key: string]: any;
    }, error: DsError): void;
    onDisconnect(): void;
    onReconnect(): void;
}

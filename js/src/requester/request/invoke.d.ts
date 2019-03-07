import { Requester } from "../requester";
import { Request } from "../Request";
import { Stream } from "../../utils/async";
import { DSError } from "../../common/interfaces";
import { TableColumn } from "../../common/table";
import { RemoteNode } from "../node_cache";
import { RequesterUpdate, RequestUpdater } from "../interface";
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
    error: DSError;
    meta: {
        [key: string]: any;
    };
    constructor(updates: any[], rawColumns: any[], columns: TableColumn[], streamStatus: string, meta: {
        [key: string]: any;
    }, error?: DSError);
    /** @ignore */
    _rows: any[][];
    readonly rows: any[][];
    /**
     * Convert the update to a simple js Object
     * If there are multiple rows, only the first row is returned
     */
    readonly result: any;
}
export declare class RequesterInvokeStream extends Stream<RequesterInvokeUpdate> {
    request: Request;
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
    onUpdate(streamStatus: string, updates: any[], columns: any[], meta: {
        [key: string]: any;
    }, error: DSError): void;
    onDisconnect(): void;
    onReconnect(): void;
}

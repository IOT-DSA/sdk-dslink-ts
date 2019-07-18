import { Requester } from "../requester";
import { Request } from "../request";
import { Completer } from "../../utils/async";
import { DsError, StreamStatus } from "../../common/interfaces";
import { RequesterUpdate, RequestUpdater } from "../interface";
/** @ignore */
export declare class RemoveController implements RequestUpdater {
    readonly completer: Completer<RequesterUpdate>;
    readonly future: Promise<RequesterUpdate>;
    readonly requester: Requester;
    readonly path: string;
    _request: Request;
    constructor(requester: Requester, path: string);
    onUpdate(status: StreamStatus, updates: any[], columns: any[], meta: object, error: DsError): void;
    onDisconnect(): void;
    onReconnect(): void;
}

import { Requester } from "../requester";
import { Request } from "../request";
import { Completer } from "../../utils/async";
import { DSError } from "../../common/interfaces";
import { RequesterUpdate, RequestUpdater } from "../interface";
/** @ignore */
export declare class RemoveController implements RequestUpdater {
    readonly completer: Completer<RequesterUpdate>;
    readonly future: Promise<RequesterUpdate>;
    readonly requester: Requester;
    readonly path: string;
    _request: Request;
    constructor(requester: Requester, path: string);
    onUpdate(status: string, updates: any[], columns: any[], meta: object, error: DSError): void;
    onDisconnect(): void;
    onReconnect(): void;
}

import { ConnectionHandler } from "../common/connection-handler";
import { SubscribeResponse } from "./response/subscribe";
import { NodeProvider } from "./node_state";
import { Response } from "./response";
import { DsError, StreamStatus } from "../common/interfaces";
export declare class Responder extends ConnectionHandler {
    /** @ignore
     * reqId can be a dsId or a user name
     */
    reqId: string;
    /** @ignore
     *  max permisison of the remote requester, this requester won't be able to do anything with higher
     *  permission even when other permission setting allows it to.
     *  This feature allows reverse proxy to override the permission for each connection with url parameter
     */
    maxPermission: number;
    /** @ignore */
    readonly _responses: Map<number, Response>;
    readonly openResponseCount: number;
    readonly subscriptionCount: number;
    /** @ignore */
    _subscription: SubscribeResponse;
    readonly nodeProvider: NodeProvider;
    constructor(nodeProvider: NodeProvider);
    /** @ignore */
    addResponse<T extends Response>(response: T): T;
    /** @ignore */
    disabled: boolean;
    /** @ignore */
    onData: (list: any[]) => void;
    /** @ignore */
    _onReceiveRequest(m: any): void;
    /** @ignore
     * close the response from responder side and notify requester
     */
    closeResponse(rid: number, response?: Response, error?: DsError): void;
    /** @ignore */
    updateResponse(response: Response, updates: any[], options?: {
        streamStatus?: StreamStatus;
        columns?: any[];
        meta?: object;
    }): void;
    /** @ignore */
    list(m: any): void;
    /** @ignore */
    subscribe(m: any): void;
    /** @ignore */
    unsubscribe(m: any): void;
    /** @ignore */
    invoke(m: any): void;
    /** @ignore */
    updateInvoke(m: any): void;
    /** @ignore */
    set(m: any): void;
    /** @ignore */
    remove(m: any): void;
    /** @ignore */
    close(m: any): void;
    /** @ignore */
    onDisconnected(): void;
    /** @ignore */
    onReconnected(): void;
}

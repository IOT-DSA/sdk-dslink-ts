import { ConnectionHandler } from "../common/connection-handler";
import { SubscribeResponse } from "./response/subscribe";
import { NodeProvider } from "./node_state";
import { Response } from "./response";
import { DSError } from "../common/interfaces";
export declare class Responder extends ConnectionHandler {
    reqId: string;
    maxPermission: number;
    readonly _responses: Map<number, Response>;
    readonly openResponseCount: number;
    readonly subscriptionCount: number;
    _subscription: SubscribeResponse;
    readonly nodeProvider: NodeProvider;
    constructor(nodeProvider: NodeProvider);
    addResponse<T extends Response>(response: T): T;
    disabled: boolean;
    onData: (list: any[]) => void;
    _onReceiveRequest(m: any): void;
    closeResponse(rid: number, response?: Response, error?: DSError): void;
    updateResponse(response: Response, updates: any[], options?: {
        streamStatus?: string;
        columns?: any[];
        meta?: object;
    }): void;
    list(m: any): void;
    subscribe(m: any): void;
    unsubscribe(m: any): void;
    invoke(m: any): void;
    updateInvoke(m: any): void;
    set(m: any): void;
    remove(m: any): void;
    close(m: any): void;
    onDisconnected(): void;
    onReconnected(): void;
}

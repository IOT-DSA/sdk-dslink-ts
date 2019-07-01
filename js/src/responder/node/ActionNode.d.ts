import { LocalNode, NodeProvider } from "../node_state";
import { Responder } from "../responder";
import { InvokeResponse } from "../response/invoke";
export declare class ActionNode extends LocalNode {
    constructor(path: string, provider: NodeProvider, profileName?: string, invokable?: number);
    onInvoke(params: {
        [key: string]: any;
    }): any;
    invoke(params: {
        [key: string]: any;
    }, responder: Responder, response: InvokeResponse, parentNode: LocalNode, maxPermission?: number): InvokeResponse;
}

import { LocalNode, NodeProvider } from "../node_state";
import { InvokeResponse } from "../response/invoke";
export declare class ActionNode extends LocalNode {
    constructor(path: string, provider: NodeProvider, invokable?: number);
    /**
     *  Override this to have simple customized invoke callback
     */
    onInvoke(params: {
        [key: string]: any;
    }, parentNode: LocalNode, maxPermission?: number): any;
    /**
     *  Called by the link internals to invoke this node.
     *  Override this to have a full customized invoke callback
     */
    invoke(params: {
        [key: string]: any;
    }, response: InvokeResponse, parentNode: LocalNode, maxPermission?: number): InvokeResponse;
}

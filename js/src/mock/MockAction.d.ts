import { BaseLocalNode } from "../responder/base-local-node";
import { InvokeResponse } from "../responder/response/invoke";
import { LocalNode } from "../responder/node_state";
export declare class MockActionNode extends BaseLocalNode {
    onInvoke: (params: {
        [key: string]: any;
    }) => any;
    invoke(params: {
        [key: string]: any;
    }, response: InvokeResponse, parentNode: LocalNode, maxPermission?: number): void;
    shouldSaveConfig(key: string): boolean;
    load(data: {
        [p: string]: any;
    }): void;
}

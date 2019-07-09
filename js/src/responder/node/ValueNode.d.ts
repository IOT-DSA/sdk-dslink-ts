import { BaseLocalNode } from "../base_local_node";
import { NodeProvider } from "../node_state";
export declare class ValueNode extends BaseLocalNode {
    _valueReady: boolean;
    constructor(path: string, provider: NodeProvider, profileName?: string, type?: string, writtable?: number);
    save(): {
        [p: string]: any;
    };
    load(data: {
        [p: string]: any;
    }): void;
}

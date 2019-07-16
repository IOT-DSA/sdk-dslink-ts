import { BaseLocalNode } from "../base_local_node";
import { NodeProvider } from "../node_state";
/**
 * base class for a serializable value node
 */
export declare class ValueNode extends BaseLocalNode {
    _saveValue: boolean;
    constructor(path: string, provider: NodeProvider, profileName?: string, type?: string, writable?: number, saveValue?: boolean);
    save(): {
        [p: string]: any;
    };
    load(data: {
        [p: string]: any;
    }): void;
    changeValue(newValue: any): boolean;
}

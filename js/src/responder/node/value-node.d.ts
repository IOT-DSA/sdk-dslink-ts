import { BaseLocalNode } from "../base-local-node";
import { NodeProvider } from "../node_state";
/**
 * base class for a serializable value node
 */
export declare class ValueNode extends BaseLocalNode {
    _saveValue: boolean;
    constructor(path: string, provider: NodeProvider, type?: string, writable?: number, saveValue?: boolean);
    save(): {
        [p: string]: any;
    };
    load(data: {
        [p: string]: any;
    }): void;
    onValueChange(newValue: any): boolean;
}

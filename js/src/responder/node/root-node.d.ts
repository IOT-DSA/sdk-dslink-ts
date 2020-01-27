import { BaseLocalNode } from '../base-local-node';
import { NodeProvider } from '../node_state';
export declare class RootNode extends BaseLocalNode {
    constructor(data?: {
        [key: string]: any;
    }, provider?: NodeProvider);
}

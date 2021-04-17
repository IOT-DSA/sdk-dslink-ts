import { Node } from '../../common/node';
import { Listener, StreamSubscription } from '../../utils/async';
import type { Query } from './query';
import { RequesterInvokeUpdate } from '../request/invoke';
export declare class NodeQueryResult extends Node<NodeQueryResult> {
    path: string;
    nodeQuery: Query;
    value: any;
    constructor(path: string, nodeQuery: Query, value: any, configs: Map<string, any>, attributes: Map<string, any>, children: Map<string, NodeQueryResult>);
    listen(listener: Listener<NodeQueryResult>, useCache?: boolean): StreamSubscription<NodeQueryResult>;
    updateNode(node: {
        value: any;
        configs: Map<string, any>;
        attributes: Map<string, any>;
        children: Map<string, NodeQueryResult>;
    }): void;
    clone(): NodeQueryResult;
    isSame(node: {
        value: any;
        configs: Map<string, any>;
        attributes: Map<string, any>;
        children: Map<string, NodeQueryResult>;
    }): boolean;
    actionCallback: (params: {
        [key: string]: any;
    }) => Promise<RequesterInvokeUpdate>;
    getActionCallback(): (params: {
        [key: string]: any;
    }) => Promise<RequesterInvokeUpdate>;
    toObject(): any;
}

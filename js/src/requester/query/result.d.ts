import { Node } from '../../common/node';
import { Listener, Stream, StreamSubscription } from '../../utils/async';
export declare class NodeQueryResult extends Node<NodeQueryResult> {
    stream: Stream<NodeQueryResult>;
    value: any;
    constructor(stream: Stream<NodeQueryResult>, value: any, configs: Map<string, any>, attributes: Map<string, any>, children: Map<string, NodeQueryResult>);
    listen(listener: Listener<NodeQueryResult>): StreamSubscription<NodeQueryResult>;
    updateNode(node: {
        value: any;
        configs: Map<string, any>;
        attributes: Map<string, any>;
        children: Map<string, NodeQueryResult>;
    }): void;
    isSame(node: {
        value: any;
        configs: Map<string, any>;
        attributes: Map<string, any>;
        children: Map<string, NodeQueryResult>;
    }): boolean;
    toObject(): any;
}

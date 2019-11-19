import { Node } from '../../common/node';
import { Listener, Stream, StreamSubscription } from '../../utils/async';
export declare class NodeResult extends Node<NodeResult> {
    stream: Stream<NodeResult>;
    value: any;
    constructor(stream: Stream<NodeResult>, value: any, configs: Map<string, any>, attributes: Map<string, any>, children: Map<string, NodeResult>);
    listen(listener: Listener<NodeResult>): StreamSubscription<NodeResult>;
    updateNode(node: {
        value: any;
        configs: Map<string, any>;
        attributes: Map<string, any>;
        children: Map<string, NodeResult>;
    }): void;
    isSame(node: {
        value: any;
        configs: Map<string, any>;
        attributes: Map<string, any>;
        children: Map<string, NodeResult>;
    }): boolean;
}

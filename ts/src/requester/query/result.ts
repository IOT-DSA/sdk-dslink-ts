import {Node} from '../../common/node';
import {Listener, Stream, StreamSubscription} from '../../utils/async';

export class NodeResult extends Node<NodeResult> {
  stream: Stream<NodeResult>;
  value: any;

  constructor(
    stream: Stream<NodeResult>,
    value: any,
    configs: Map<string, any>,
    attributes: Map<string, any>,
    children: Map<string, NodeResult>
  ) {
    super();
    this.stream = stream;
    this.updateNode({value, configs, attributes, children});
  }

  listen(listener: Listener<NodeResult>): StreamSubscription<NodeResult> {
    return this.stream.listen(listener);
  }

  updateNode(node: {
    value: any;
    configs: Map<string, any>;
    attributes: Map<string, any>;
    children: Map<string, NodeResult>;
  }) {
    this.value = node.value;
    this.configs = node.configs;
    this.attributes = node.attributes;
    this.children = node.children;
  }

  isSame(node: {
    value: any;
    configs: Map<string, any>;
    attributes: Map<string, any>;
    children: Map<string, NodeResult>;
  }) {
    const {value, configs, attributes, children} = node;
    if (
      value !== this.value ||
      configs.size !== this.configs.size ||
      attributes.size !== this.attributes.size ||
      children.size !== this.children.size
    ) {
      return false;
    }
    for (let [key, value] of this.configs) {
      if (configs.get(key) !== value) {
        return false;
      }
    }
    for (let [key, value] of this.attributes) {
      if (attributes.get(key) !== value) {
        return false;
      }
    }
    for (let [key, value] of this.children) {
      if (children.get(key) !== value) {
        return false;
      }
    }
    return true;
  }
}

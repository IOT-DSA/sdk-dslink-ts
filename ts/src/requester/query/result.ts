import {Node} from '../../common/node';
import {Listener, Stream, StreamSubscription} from '../../utils/async';

export class NodeQueryResult extends Node<NodeQueryResult> {
  stream: Stream<NodeQueryResult>;
  value: any;

  constructor(
    stream: Stream<NodeQueryResult>,
    value: any,
    configs: Map<string, any>,
    attributes: Map<string, any>,
    children: Map<string, NodeQueryResult>
  ) {
    super();
    this.stream = stream;
    this.updateNode({value, configs, attributes, children});
  }

  listen(listener: Listener<NodeQueryResult>): StreamSubscription<NodeQueryResult> {
    return this.stream.listen(listener);
  }

  updateNode(node: {
    value: any;
    configs: Map<string, any>;
    attributes: Map<string, any>;
    children: Map<string, NodeQueryResult>;
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
    children: Map<string, NodeQueryResult>;
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

  toObject() {
    let result: any = {};
    for (let [key, value] of this.configs) {
      result[key] = value;
    }
    for (let [key, value] of this.attributes) {
      result[key] = value;
    }
    for (let [key, value] of this.children) {
      result[key] = value.toObject();
    }
    if (this.value !== undefined) {
      result['?value'] = this.value;
    }
    return result;
  }
}

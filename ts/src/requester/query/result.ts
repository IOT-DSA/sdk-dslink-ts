import {Node} from '../../common/node';
import {Listener, StreamSubscription} from '../../utils/async';
import type {Query} from './query';
import {RequesterInvokeUpdate} from '../request/invoke';

export class NodeQueryResult extends Node<NodeQueryResult> {
  value: any;

  constructor(
    public path: string,
    public nodeQuery: Query,
    value: any,
    configs: Map<string, any>,
    attributes: Map<string, any>,
    children: Map<string, NodeQueryResult>
  ) {
    super();
    this.updateNode({value, configs, attributes, children});
  }

  listen(listener: Listener<NodeQueryResult>, useCache = true): StreamSubscription<NodeQueryResult> {
    return this.nodeQuery.listen(listener, useCache);
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

  clone() {
    return new NodeQueryResult(this.path, this.nodeQuery, this.value, this.configs, this.attributes, this.children);
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

  actionCallbacks: Map<string, (params: {[key: string]: any}) => Promise<RequesterInvokeUpdate>> = new Map();
  getActionCallback(key: string) {
    if (this.actionCallbacks.has(key)) {
      return this.actionCallbacks.get(key);
    }
    const actionPath = `${this.path}/${key}`;
    let callback = (params: {[key: string]: any}) => this.nodeQuery.requester.invokeOnce(actionPath, params);
    this.actionCallbacks.set(key, callback);
    return callback;
  }

  toObject() {
    let {query} = this.nodeQuery;
    let returnSimpleValue = true;
    for (let key of Object.keys(query)) {
      if (key !== '?value' && key !== '?filter') {
        returnSimpleValue = false;
        break;
      }
    }
    if (returnSimpleValue) {
      return this.value;
    }
    let result: any = {};
    for (let [key, value] of this.configs) {
      result[key] = value;
    }
    for (let [key, value] of this.attributes) {
      result[key] = value;
    }
    for (let [key, value] of this.children) {
      if (value.getConfig('$invokable')) {
        result[key] = this.getActionCallback(key);
      } else {
        result[key] = value.toObject();
      }
    }
    if (this.value !== undefined) {
      result['?value'] = this.value;
    }
    return result;
  }
}

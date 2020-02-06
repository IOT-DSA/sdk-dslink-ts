import {Listener, Stream} from '../utils/async';
import {Node} from '../common/node';
import {Permission} from '../common/permission';
import {InvokeResponse} from './response/invoke';
import {Responder} from './responder';
import {Response} from './response';
import {ValueUpdate, ValueUpdateCallback} from '../common/value';
import {DsError, NodeStore} from '../common/interfaces';

export class LocalNode extends Node<LocalNode> {
  provider: NodeProvider;

  readonly path: string;

  /** @ignore */
  _state: NodeState;

  constructor(path: string, provider: NodeProvider) {
    super(null);
    this.path = path;
    this.provider = provider;
    this.initialize();
  }

  initialize() {}

  addChild(name: string, node: LocalNode) {
    if (node.provider !== this.provider) {
      // TODO log warning
      return;
    }
    if (this.children.has(name)) {
      this.children.get(name).destroy();
    }
    this.children.set(name, node);
    if (this._state) {
      node._connectState();
      this._state.listStream.add(name);
    }
    if (this._state && (node.constructor as any).saveNodeOnChange) {
      this.provider.save();
    }
  }

  removeChild(nameOrNode: string | LocalNode) {
    let name: string;
    let node: LocalNode;
    if (nameOrNode instanceof LocalNode) {
      node = nameOrNode;
      for (let [key, n] of this.children) {
        if (n === node) {
          name = key;
          break;
        }
      }
    } else if (typeof nameOrNode === 'string') {
      name = nameOrNode;
      node = this.children.get(name);
    }
    if (name && node) {
      node.destroy();
      this.children.delete(name);
      if (this._state) {
        this._state.listStream.add(name);
      }
      if (this._state && (node.constructor as any).saveNodeOnChange) {
        this.provider.save();
      }
    }
  }

  /** @ignore */
  _connectState() {
    this.provider.createState(this.path).setNode(this);
    for (let [name, child] of this.children) {
      (child as LocalNode)._connectState();
    }
  }

  getInvokePermission(): number {
    return Permission.parse(this.configs.get('$invokable'));
  }

  getSetPermission() {
    return Permission.parse(this.configs.get('$writable'));
  }

  /// Called by the link internals to invoke this node.
  invoke(
    params: {[key: string]: any},
    response: InvokeResponse,
    parentNode: LocalNode,
    maxPermission: number = Permission.CONFIG
  ) {
    response.close(DsError.NOT_IMPLEMENTED);
  }

  setConfig(name: string, value: any) {
    if (!name.startsWith('$')) {
      name = `\$${name}`;
    }

    this.configs.set(name, value);
    if (this._state && (this.constructor as any).saveNodeOnChange) {
      this.provider.save();
    }
    if (this._state) {
      this._state.listStream.add(name);
    }
  }

  /// Called by the link internals to set an attribute on this node.
  setAttribute(name: string, value: any, responder?: Responder, response?: Response) {
    if (!name.startsWith('@')) {
      name = `@${name}`;
    }

    this.attributes.set(name, value);
    if (this._state && (this.constructor as any).saveNodeOnChange) {
      this.provider.save();
    }
    if (this._state) {
      this._state.listStream.add(name);
    }
    if (response) {
      response.close();
    }
  }

  /// Called by the link internals to remove an attribute from this node.
  removeAttribute(name: string, responder?: Responder, response?: Response) {
    if (!name.startsWith('@')) {
      name = `@${name}`;
    }

    this.attributes.delete(name);
    if (this._state && (this.constructor as any).saveNodeOnChange) {
      this.provider.save();
    }
    if (this._state) {
      this._state.listStream.add(name);
    }
    if (response) {
      response.close();
    }
  }

  /** @ignore
   *  initial value must be undefined
   */
  _value: any;

  onSubscribe(subscriber: Subscriber) {}

  /// Called by the link internals to set a value of a node.
  setValue(value: any, responder?: Responder, response?: Response, maxPermission: number = Permission.CONFIG) {
    try {
      if (this.onValueChange(value)) {
        if (this._state) {
          this._state.updateValue(value);
        }
      }
      if (response) {
        response.close();
      }
    } catch (e) {
      if (e instanceof Error) {
        response.close(new DsError('failed', {msg: e.message}));
      } else {
        response.close(new DsError('failed'));
      }
    }
  }

  /**
   * @return true when the change is valid
   */
  onValueChange(newVal: any): boolean {
    if (this._value === newVal) {
      return false;
    }
    this._value = newVal;
    return true;
  }

  useVirtualList: boolean;

  virtualList(updates: any[]) {}

  save(): {[key: string]: any} {
    return null;
  }

  load(data: {[key: string]: any}) {}

  destroy() {
    if (this._state) {
      this._state.setNode(null);
      for (let [name, child] of this.children) {
        child.destroy();
      }
      this._state = null;
    }
  }
}

interface ProviderOptions {
  saveFunction?: (data: any) => void;
  saveIntervalMs?: number;
}

export class NodeProvider implements NodeStore {
  /** @ignore */
  _states: Map<string, NodeState> = new Map<string, NodeState>();

  getVirtualNode(path: string): LocalNode {
    return null;
  }

  getNode(path: string): LocalNode {
    if (this._states.has(path)) {
      return this._states.get(path)._node;
    }
    return null;
  }

  createState(path: string): NodeState {
    if (this._states.has(path)) {
      return this._states.get(path);
    }
    let state = new NodeState(path, this);
    this._states.set(path, state);
    if (!state._node) {
      let virtualNode = this.getVirtualNode(path);
      if (virtualNode) {
        state.setNode(virtualNode);
      }
    }
    return state;
  }

  removeNode(path: string) {
    let pos = path.lastIndexOf('/');
    if (pos > 0) {
      let parentNode = this.getNode(path.substring(0, pos));
      if (parentNode) {
        parentNode.removeChild(path.substring(pos + 1));
      }
    } else if (pos === 0) {
      this._root.removeChild(path.substring(1));
    }
  }

  /** @ignore */
  _root: LocalNode;
  /** @ignore */
  _saveFunction: (data: any) => void;

  constructor(options?: ProviderOptions) {
    if (options) {
      let {saveFunction, saveIntervalMs} = options;
      this._saveFunction = saveFunction;
      if (saveIntervalMs) {
        this._saveIntervalMs = saveIntervalMs;
      }
    }
  }

  /** @ignore */
  setRoot(node: LocalNode) {
    if (!this._root) {
      this._root = node;
      node._connectState();
    }
  }

  /** @ignore */
  _saveTimer: any = null;
  /** @ignore */
  _saveIntervalMs = 5000;

  save() {
    // save root node with a timer
    if (this._saveFunction) {
      if (this._saveIntervalMs === 0) {
        this.onSaveTimer();
      } else if (!this._saveTimer) {
        this._saveTimer = setTimeout(this.onSaveTimer, this._saveIntervalMs);
      }
    }
  }

  /** @ignore */
  onSaveTimer = () => {
    this._saveTimer = null;
    if (this._saveFunction) {
      let data = this._root.save();
      if (data) {
        this._saveFunction(data);
      }
    }
  };

  finishSaveTimer() {
    if (this._saveTimer) {
      clearTimeout(this._saveTimer);
      this.onSaveTimer();
    }
  }

  addDef(node: LocalNode) {
    let state = this.createState(node.path);
    state.setNode(node);
  }
}

export interface Subscriber {
  addValue: ValueUpdateCallback;
}

export class NodeState {
  /** @ignore */
  _node: LocalNode;
  /** @ignore */
  _subscriber: Subscriber;
  readonly provider: NodeProvider;
  readonly path: string;
  /** @ignore */
  _disconnectedTs: string = ValueUpdate.getTs();

  constructor(path: string, provider: NodeProvider) {
    this.path = path;
    this.provider = provider;
  }

  /** @ignore */
  onList = (listener: Listener<string>) => {
    if (this._node) {
      listener(null);
    } else {
      listener('$disconnectedTs');
    }
  };
  /** @ignore */
  listStream = new Stream<string>(
    null,
    () => this.checkDestroy(), // onAllCancel
    this.onList // onListen
  );

  /** @ignore */
  initListUpdate() {
    for (let listener of this.listStream._listeners) {
      listener(null); // use null to update all
    }
  }

  /** @ignore */
  _lastValueUpdate: ValueUpdate;

  /** @ignore */
  updateValue(value: any) {
    if (value === undefined) {
      // value not ready
      this._lastValueUpdate = null;
      return;
    }
    if (this._node._value instanceof ValueUpdate) {
      this._lastValueUpdate = this._node._value;
    } else {
      this._lastValueUpdate = new ValueUpdate(this._node._value);
    }
    if (this._subscriber) {
      this._subscriber.addValue(this._lastValueUpdate);
    }
  }

  /** @ignore */
  setNode(node: LocalNode) {
    this._node = node;
    if (node) {
      node._state = this;
      node.onSubscribe(this._subscriber);
      this.updateValue(node._value);
      for (let listener of this.listStream._listeners) {
        listener(null); // use null to update all
      }
    } else {
      this._lastValueUpdate = null;
      if (this._subscriber) {
        // TODO: to be defined
      }
      this._disconnectedTs = ValueUpdate.getTs();
      for (let listener of this.listStream._listeners) {
        listener('$disconnectedTs');
      }
      this.checkDestroy();
    }
  }

  /** @ignore */
  setSubscriber(s: Subscriber) {
    if (s === this._subscriber) {
      return;
    }
    this._subscriber = s;
    if (!s) {
      this.checkDestroy();
    } else if (this._lastValueUpdate) {
      s.addValue(this._lastValueUpdate);
    } else if (!this._node || !this._node.getConfig('$type')) {
      // value not supported
      s.addValue(new ValueUpdate(null, null, {status: 'unknown'}));
    } else {
      // no value will be sent, responder will just wait until a value is ready
    }
    if (this._node) {
      this._node.onSubscribe(s);
    }
  }

  /** @ignore */
  checkDestroy() {
    if (!(this._node || this.listStream.hasListener() || this._subscriber)) {
      this.destroy();
    }
  }

  /** @ignore */
  destroy() {
    this.provider._states.delete(this.path);
  }
}

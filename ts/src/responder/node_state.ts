import {Listener, Stream} from "../utils/async";
import {Node} from "../common/node";
import {Permission} from "../common/permission";
import {InvokeResponse} from "./response/invoke";
import {Responder} from "./responder";
import {Response} from "./response";

export class LocalNode extends Node {
  /// Node Provider
  provider: NodeProvider;

  /// Node Path
  readonly path: string;

  _state: NodeState;

  constructor(path: string, provider: NodeProvider, profileName: string = 'node') {
    super(profileName);
    this.path = path;
    this.provider = provider;
  }

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
    }
  }

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
    responder: Responder,
    response: InvokeResponse,
    parentNode: LocalNode, maxPermission: number = Permission.CONFIG) {
    response.close();
  }

  /// Called by the link internals to set an attribute on this node.
  setAttribute(
    name: string, value: any, responder: Responder, response: Response) {
    if (response != null) {
      response.close();
    }
    if (!name.startsWith("@")) {
      name = `@${name}`;
    }

    this.attributes.set(name, value);
    this.provider.save();
  }

/// Called by the link internals to remove an attribute from this node.
  removeAttribute(
    name: string, responder: Responder, response: Response) {
    if (response != null) {
      response.close();
    }
    if (!name.startsWith("@")) {
      name = `@${name}`;
    }

    this.attributes.delete(name);
    this.provider.save();
  }

  /// Called by the link internals to set a value of a node.
  setValue(value: object, responder: Responder, response: Response,
           maxPermission: number = Permission.CONFIG) {
    response.close();
  }

  save(): {[key: string]: any} {
    let data = {};
    this.saveProperties(data);
    this.saveChildren(data);
    return data;
  }

  saveChildren(data: {[key: string]: any}) {
    for (let [name, value] of this.children) {
      if (value instanceof LocalNode) {
        let saved = value.save();
        if (saved) {
          data[name] = saved;
        }
      }
    }
  }

  saveProperties(data: {[key: string]: any}) {
    for (let [name, value] of this.attributes) {
      data[name] = value;
    }
  }

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

export class NodeProvider {
  _states: Map<string, NodeState> = new Map<string, NodeState>();

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
    return state;
  }

  _root: LocalNode;
  _saveFunction: (data: any) => void;

  constructor(root: LocalNode, options?: ProviderOptions) {
    this._root = root;
    if (options) {
      let {saveFunction, saveIntervalMs} = options;
      this._saveFunction = saveFunction;
      if (saveIntervalMs) {
        this._saveIntervalMs = saveIntervalMs;
      }
    }

    this.createState('/').setNode(root);
  }

  _saveTimer: any = null;
  _saveIntervalMs = 5000;

  save() {
    // save root node with a timer
    if (this._saveFunction && !this._saveTimer) {
      this._saveTimer = setTimeout(this.onSaveTimer, this._saveIntervalMs);
    }
  }

  onSaveTimer = () => {
    this._saveTimer = null;
    if (this._saveFunction) {
      let data = this._root.save();
      if (data) {
        this._saveFunction(data);
      }
    }
  }
}

export class NodeState {

  _node: LocalNode;
  readonly provider: NodeProvider;
  readonly path: string;

  constructor(path: string, provider: NodeProvider) {
    this.path = path;
    this.provider = provider;
  }

  checkDestroy() {
    if (!(this._node || this.listStream.hasListener())) {
      this.destroy();
    }
  }


  onList = (listener: Listener<string>) => {
    if (this._node) {
      // TODO
    }
  };

  listStream = new Stream<string>(
    null,
    () => this.checkDestroy(), // onAllCancel
    this.onList // onListen
  );

  initListUpdate() {
    for (let listener of this.listStream._listeners) {
      listener(null); // use null to update all
    }
  }

  setNode(node: LocalNode) {
    this._node = node;
    if (node) {
      node._state = this;
    } else {
      this.checkDestroy();
    }
  }

  destroy() {
    this.provider._states.delete(this.path);
  }
}
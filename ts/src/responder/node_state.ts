import {Listener, Stream} from "../utils/async";
import {Node} from "../common/node";
import {Permission} from "../common/permission";

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

  getInvokePermission(): number {
    return Permission.parse(this.configs.get('$invokable'));
  }
  getSetPermission() {
    return Permission.parse(this.configs.get('$writable'));
  }
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

  constructor(root: LocalNode) {
    this._root = root;
    this.createState('/').setNode(root);
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
import {Requester} from '../requester';
import {Request} from '../request';
import {Closable, Completer, Listener, Stream, StreamSubscription} from '../../utils/async';
import {ConnectionProcessor, DsError, StreamStatus} from '../../common/interfaces';
import {RemoteNode} from '../node_cache';
import {RequesterUpdate, RequestUpdater} from '../interface';
import {ValueUpdate} from '../../common/value';
import {logError} from '../../utils/error-callback';

// delay 3s for web appilcation and 50ms for nodejs
const UNLIST_DELAY_MS = typeof window === 'undefined' ? 50 : 3000;

export class ReqListListener implements Closable {
  timeout: any;
  listener: StreamSubscription<RequesterListUpdate>;

  /** @ignore */
  constructor(
    public requester: Requester,
    public path: string,
    public callback: Listener<RequesterListUpdate>,
    timeout: number
  ) {
    if (timeout) {
      this.timeout = setTimeout(this.onTimeOut, timeout);
    }
    let node: RemoteNode = requester.nodeCache.getRemoteNode(path);
    this.listener = node._list(requester).listen(this.callbackWrapper);
  }

  callbackWrapper = (value: RequesterListUpdate) => {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    try {
      this.callback?.(value);
    } catch (e) {
      logError(e);
    }
  };

  onTimeOut = () => {
    this.timeout = null;
    let remoteNode = new RemoteNode(this.path);
    remoteNode.configs.set('$disconnectedTs', ValueUpdate.getTs());
    this.callbackWrapper(new RequesterListUpdate(remoteNode, ['$disconnectedTs'], 'open'));
  };

  close() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.callback = null;
    setTimeout(() => {
      this.listener.close();
    }, UNLIST_DELAY_MS);
  }
}

export class RequesterListUpdate extends RequesterUpdate {
  /**
   * This is only a list of changed fields.
   * When changes is null, it means everything could have changed.
   */
  changes: string[];
  node: RemoteNode;

  /** @ignore */
  constructor(node: RemoteNode, changes: string[], streamStatus: StreamStatus) {
    super(streamStatus);
    this.node = node;
    this.changes = changes;
  }
}

/** @ignore */
export class ListDefListener {
  readonly node: RemoteNode;
  readonly requester: Requester;

  listener: ReqListListener;

  ready: boolean = false;

  constructor(node: RemoteNode, requester: Requester, callback: (update: RequesterListUpdate) => void) {
    this.node = node;
    this.requester = requester;
    this.listener = requester.list(node.remotePath, (update: RequesterListUpdate) => {
      this.ready = update.streamStatus !== 'initialize';
      if (update.node.configs.has('$disconnectedTs')) {
        update.node.configs.delete('$disconnectedTs');
      }
      callback(update);
    });
  }

  close() {
    this.listener.close();
  }
}

/** @ignore */
export class ListController implements RequestUpdater, ConnectionProcessor {
  readonly node: RemoteNode;
  readonly requester: Requester;
  stream: Stream<RequesterListUpdate>;
  request: Request;

  constructor(node: RemoteNode, requester: Requester) {
    this.node = node;
    this.requester = requester;
    this.stream = new Stream<RequesterListUpdate>(this.onStartListen, this._onAllCancel, this._onListen);
  }

  get initialized(): boolean {
    return this.request != null && this.request.streamStatus !== 'initialize';
  }

  disconnectTs: string;

  onDisconnect() {
    this.disconnectTs = ValueUpdate.getTs();
    this.node.configs.set('$disconnectedTs', this.disconnectTs);
    this.stream.add(new RequesterListUpdate(this.node, ['$disconnectedTs'], this.request.streamStatus));
  }

  onReconnect() {
    if (this.disconnectTs != null) {
      this.node.configs.delete('$disconnectedTs');
      this.disconnectTs = null;
      this.changes.add('$disconnectedTs');
    }
  }

  changes: Set<string> = new Set<string>();

  onUpdate(streamStatus: StreamStatus, updates: any[], columns: any[], meta: object, error: DsError) {
    let reseted = false;
    if (!updates) {
      if (error) {
        updates = [['$disconnectedTs', ValueUpdate.getTs()]];
      } else {
        updates = [];
      }
    }

    for (let update of updates) {
      let name: string;
      let value: any;
      let removed = false;
      if (Array.isArray(update)) {
        if (update.length > 0 && typeof update[0] === 'string') {
          name = update[0];
          if (update.length > 1) {
            value = update[1];
          }
        } else {
          continue; // invalid response
        }
      } else if (update != null && update instanceof Object) {
        if (typeof update['name'] === 'string') {
          name = update['name'];
        } else {
          continue; // invalid response
        }
        if (update['change'] === 'remove') {
          removed = true;
        } else {
          value = update['value'];
        }
      } else {
        continue; // invalid response
      }
      if (name.startsWith('$')) {
        if (
          !reseted &&
          (name === '$is' || name === '$base' || (name === '$disconnectedTs' && typeof value === 'string'))
        ) {
          reseted = true;
          this.node.resetNodeCache();
        }
        if (name === '$is') {
          this.loadProfile(value);
        }
        this.changes.add(name);
        if (removed) {
          this.node.configs.delete(name);
        } else {
          this.node.configs.set(name, value);
        }
      } else if (name.startsWith('@')) {
        this.changes.add(name);
        if (removed) {
          this.node.attributes.delete(name);
        } else {
          this.node.attributes.set(name, value);
        }
      } else {
        this.changes.add(name);
        if (removed) {
          this.node.children.delete(name);
        } else if (value != null && value instanceof Object) {
          // TODO, also wait for children $is
          this.node.children.set(name, this.requester.nodeCache.updateRemoteChildNode(this.node, name, value));
        }
      }
    }
    if (this.request.streamStatus !== 'initialize') {
      this.node._listed = true;
    }
    if (this._pendingRemoveDef) {
      this._checkRemoveDef();
    }
    this.onProfileUpdated();
  }

  _profileLoader: ListDefListener;

  loadProfile(defName: string) {
    this._ready = true;
    let defPath = defName;
    if (!defPath.startsWith('/')) {
      let base: any = this.node.configs.get('$base');
      if (typeof base === 'string') {
        defPath = `${base}/defs/profile/${defPath}`;
      } else {
        defPath = `/defs/profile/${defPath}`;
      }
    }
    if (this.node.profile instanceof RemoteNode && (this.node.profile as RemoteNode).remotePath === defPath) {
      return;
    }
    this.node.profile = this.requester.nodeCache.getDefNode(defPath, defName);
    if (defName === 'node') {
      return;
    }
    if (this.node.profile instanceof RemoteNode && !(this.node.profile as RemoteNode)._listed) {
      this._ready = false;
      this._profileLoader = new ListDefListener(this.node.profile, this.requester, this._onProfileUpdate);
    }
  }

  static readonly _ignoreProfileProps: string[] = [
    '$is',
    // '$permission',
    // '$settings',
    '$disconnectedTs',
  ];

  _onProfileUpdate = (update: RequesterListUpdate) => {
    if (this._profileLoader == null) {
      //      logger.finest('warning, unexpected state of profile loading');
      return;
    }
    this._profileLoader.close();
    this._profileLoader = null;
    for (let change of update.changes) {
      if (!ListController._ignoreProfileProps.includes(change)) {
        this.changes.add(change);
        if (change.startsWith('$')) {
          if (!this.node.configs.has(change)) {
            this.node.configs.set(change, this.node.profile.configs.get(change));
          }
        } else if (change.startsWith('@')) {
          if (!this.node.attributes.has(change)) {
            this.node.attributes.set(change, this.node.profile.attributes.get(change));
          }
        } else {
          if (!this.node.children.has(change)) {
            this.node.children.set(change, this.node.profile.children.get(change));
          }
        }
      }
    }

    this._ready = true;
    this.onProfileUpdated();
  };

  _ready: boolean = true;

  onProfileUpdated() {
    if (this._ready) {
      if (this.request.streamStatus !== 'initialize') {
        this.stream.add(new RequesterListUpdate(this.node, Array.from(this.changes), this.request.streamStatus));
        this.changes.clear();
      }
      if (this.request && this.request.streamStatus === 'closed') {
        this.stream.close();
      }
    }
  }

  _pendingRemoveDef: boolean = false;

  _checkRemoveDef() {
    this._pendingRemoveDef = false;
  }

  onStartListen = () => {
    if (this.request == null && !this.waitToSend) {
      this.waitToSend = true;
      this.requester.addProcessor(this);
    }
  };
  waitToSend: boolean = false;

  startSendingData(currentTime: number, waitingAckId: number) {
    if (!this.waitToSend) {
      return;
    }
    this.request = this.requester._sendRequest({method: 'list', path: this.node.remotePath}, this);
    this.waitToSend = false;
  }

  ackReceived(receiveAckId: number, startTime: number, currentTime: number) {}

  _onListen = (callback: (update: RequesterListUpdate) => void) => {
    if (this._ready && this.node._listed && this.request != null) {
      setTimeout(() => {
        if (this.request == null) {
          return;
        }

        let changes: string[] = [];
        for (let [key, v] of this.node.configs) {
          changes.push(key);
        }
        for (let [key, v] of this.node.attributes) {
          changes.push(key);
        }
        for (let [key, v] of this.node.children) {
          changes.push(key);
        }
        let update: RequesterListUpdate = new RequesterListUpdate(this.node, changes, this.request.streamStatus);
        callback(update);
      }, 0);
    }
  };

  _onAllCancel = () => {
    this._destroy();
  };

  _destroy() {
    this.waitToSend = false;
    if (this._profileLoader != null) {
      this._profileLoader.close();
      this._profileLoader = null;
    }
    if (this.request != null) {
      this.requester.closeRequest(this.request);
      this.request = null;
    }

    this.stream.close();
    this.node._listController = null;
  }
}

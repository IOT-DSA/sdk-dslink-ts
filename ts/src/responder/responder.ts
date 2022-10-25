/// a responder for one connection
import {ConnectionHandler} from '../common/connection-handler';
import {Permission} from '../common/permission';
import {SubscribeResponse} from './response/subscribe';
import {LocalNode, NodeProvider} from './node_state';
import {Response} from './response';
import {DsError, StreamStatus} from '../common/interfaces';
import {Path} from '../common/node';
import {ListResponse} from './response/list';
import {InvokeResponse} from './response/invoke';
import {logError} from '../utils/error-callback';

export class Responder extends ConnectionHandler {
  /** @ignore
   * reqId can be a dsId or a user name
   */
  reqId: string;

  // maxCacheLength:number = ConnectionProcessor.defaultCacheSize;

  // storage: ISubscriptionResponderStorage;

  /** @ignore
   *  max permisison of the remote requester, this requester won't be able to do anything with higher
   *  permission even when other permission setting allows it to.
   *  This feature allows reverse proxy to override the permission for each connection with url parameter
   */
  maxPermission: number = Permission.CONFIG;

  /** @ignore */
  readonly _responses: Map<number, Response> = new Map<number, Response>();

  get openResponseCount(): number {
    return this._responses.size;
  }

  get subscriptionCount(): number {
    return this._subscription.subscriptions.size;
  }

  /** @ignore */
  _subscription: SubscribeResponse;

  readonly nodeProvider: NodeProvider;

  constructor(nodeProvider: NodeProvider) {
    super();
    this.nodeProvider = nodeProvider;
    this._subscription = new SubscribeResponse(this, 0);
    this._responses.set(0, this._subscription);
  }

  /** @ignore */
  addResponse<T extends Response>(response: T): T {
    if (response._sentStreamStatus !== 'closed') {
      this._responses.set(response.rid, response);
    }
    return response;
  }

  /** @ignore */
  disabled: boolean = false;
  /** @ignore */
  onData = (list: any[]) => {
    if (this.disabled) {
      return;
    }
    for (let resp of list) {
      if (resp && resp instanceof Object) {
        this._onReceiveRequest(resp);
      }
    }
  };

  /** @ignore */
  _onReceiveRequest(m: any) {
    let method = m['method'];
    if (typeof m['rid'] === 'number') {
      try {
        if (method == null) {
          this.updateInvoke(m);
          return;
        } else {
          if (this._responses.has(m['rid'])) {
            if (method === 'close') {
              this.close(m);
            }
            // when rid is invalid, nothing needs to be sent back
            return;
          }

          switch (method) {
            case 'list':
              this.list(m);
              return;
            case 'subscribe':
              this.subscribe(m);
              return;
            case 'unsubscribe':
              this.unsubscribe(m);
              return;
            case 'invoke':
              this.invoke(m);
              return;
            case 'set':
              this.set(m);
              return;
            case 'remove':
              this.remove(m);
              return;
          }
        }
      } catch (err) {
        logError(err);
      }
    }
    this.closeResponse(m['rid'], null, DsError.INVALID_METHOD);
  }

  /** @ignore
   * close the response from responder side and notify requester
   */
  closeResponse(rid: number, response?: Response, error?: DsError) {
    if (response != null) {
      if (this._responses.get(response.rid) !== response) {
        // this response is no longer valid
        return;
      }
      response._sentStreamStatus = 'closed';
      rid = response.rid;
    }
    let m: any = {rid, stream: 'closed'};
    if (error != null) {
      m['error'] = error.serialize();
    }
    this._responses.delete(rid);
    this.addToSendList(m);
  }

  /** @ignore */
  updateResponse(
    response: Response,
    updates: any[],
    options: {
      streamStatus?: StreamStatus;
      columns?: any[];
      meta?: object;
      // handleMap?: (object m)=>void
    } = {}
  ) {
    let {streamStatus, columns, meta} = options;
    if (this._responses.get(response.rid) === response) {
      let m: any = {rid: response.rid};
      if (streamStatus != null && streamStatus !== response._sentStreamStatus) {
        response._sentStreamStatus = streamStatus;
        m['stream'] = streamStatus;
      }

      if (columns != null) {
        m['columns'] = columns;
      }

      if (updates != null) {
        m['updates'] = updates;
      }

      if (meta != null) {
        m['meta'] = meta;
      }

      // if (handleMap != null) {
      //   handleMap(m);
      // }

      this.addToSendList(m);
      if (response._sentStreamStatus === 'closed') {
        this._responses.delete(response.rid);
      }
    }
  }

  /** @ignore */
  list(m: any) {
    let path: Path = Path.getValidNodePath(m['path']);
    if (path != null && path.isAbsolute) {
      let rid: number = m['rid'];
      let state = this.nodeProvider.createState(path.path);

      this.addResponse(new ListResponse(this, rid, state));
    } else {
      this.closeResponse(m['rid'], null, DsError.INVALID_PATH);
    }
  }

  /** @ignore */
  subscribe(m: any) {
    if (Array.isArray(m['paths'])) {
      for (let p of m['paths']) {
        let pathstr: string;
        let qos = 0;
        let sid = -1;
        if (p instanceof Object) {
          if (typeof p['path'] === 'string') {
            pathstr = p['path'];
          } else {
            continue;
          }
          if (typeof p['sid'] === 'number') {
            sid = p['sid'];
          } else {
            continue;
          }
          if (typeof p['qos'] === 'number') {
            qos = p['qos'];
          }
        }
        let path: Path = Path.getValidNodePath(pathstr);

        if (path != null && path.isAbsolute) {
          let state = this.nodeProvider.createState(path.path);
          this._subscription.add(path.path, state, sid, qos);
          this.closeResponse(m['rid']);
        } else {
          this.closeResponse(m['rid']);
        }
      }
    } else {
      this.closeResponse(m['rid'], null, DsError.INVALID_PATHS);
    }
  }

  /** @ignore */
  unsubscribe(m: any) {
    if (Array.isArray(m['sids'])) {
      for (let sid of m['sids']) {
        if (typeof sid === 'number') {
          this._subscription.remove(sid);
        }
      }
      this.closeResponse(m['rid']);
    } else {
      this.closeResponse(m['rid'], null, DsError.INVALID_PATHS);
    }
  }

  /** @ignore */
  invoke(m: any) {
    let path: Path = Path.getValidNodePath(m['path']);
    if (path != null && path.isAbsolute) {
      let rid: number = m['rid'];
      let parentNode = this.nodeProvider.getNode(path.parentPath);

      let actionNode: LocalNode = parentNode?.getChild(path.name) || this.nodeProvider.getNode(path.path);

      if (actionNode == null) {
        this.closeResponse(m['rid'], null, DsError.NOT_IMPLEMENTED);
        return;
      }

      let permission = Permission.parse(m['permit']);

      let params: {[key: string]: any};
      if (m['params'] instanceof Object) {
        params = m['params'];
      } else {
        params = {};
      }

      if (actionNode.getInvokePermission() <= permission) {
        actionNode.invoke(
          params,
          this.addResponse(new InvokeResponse(this, rid, parentNode, actionNode, path.name)),
          parentNode,
          permission
        );
      } else {
        this.closeResponse(m['rid'], null, DsError.PERMISSION_DENIED);
      }
    } else {
      this.closeResponse(m['rid'], null, DsError.INVALID_PATH);
    }
  }

  /** @ignore */
  updateInvoke(m: any) {
    let rid: number = m['rid'];
    let response = this._responses.get(rid);
    if (response instanceof InvokeResponse) {
      if (m['params'] instanceof Object) {
        response.updateReqParams(m['params']);
      }
    } else {
      this.closeResponse(m['rid'], null, DsError.INVALID_METHOD);
    }
  }

  /** @ignore */
  set(m: any) {
    let path: Path = Path.getValidPath(m['path']);
    if (path == null || !path.isAbsolute) {
      this.closeResponse(m['rid'], null, DsError.INVALID_PATH);
      return;
    }

    if (!m.hasOwnProperty('value')) {
      this.closeResponse(m['rid'], null, DsError.INVALID_VALUE);
      return;
    }

    let value = m['value'];
    let rid: number = m['rid'];
    if (path.isNode) {
      let node: LocalNode = this.nodeProvider.getNode(path.path);
      if (node == null) {
        this.closeResponse(m['rid'], null, DsError.INVALID_PATH);
        return;
      }
      let permission: number = Permission.parse(m['permit']);

      if (node.getSetPermission() <= permission) {
        node.setValue(value, this, this.addResponse(new Response(this, rid, 'set')));
      } else {
        this.closeResponse(m['rid'], null, DsError.PERMISSION_DENIED);
      }
    } else if (path.isAttribute) {
      let node: LocalNode = this.nodeProvider.getNode(path.parentPath);
      if (node == null) {
        this.closeResponse(m['rid'], null, DsError.INVALID_PATH);
        return;
      }
      let permission: number = Permission.parse(m['permit']);
      if (permission < Permission.WRITE) {
        this.closeResponse(m['rid'], null, DsError.PERMISSION_DENIED);
      } else {
        node.setAttribute(path.name, value, this, this.addResponse(new Response(this, rid, 'set')));
      }
    } else {
      // shouldn't be possible to reach here
      throw new Error('unexpected case');
    }
  }

  /** @ignore */
  remove(m: any) {
    let path: Path = Path.getValidPath(m['path']);
    if (path == null || !path.isAbsolute) {
      this.closeResponse(m['rid'], null, DsError.INVALID_PATH);
      return;
    }
    let rid: number = m['rid'];
    if (path.isNode) {
      this.closeResponse(m['rid'], null, DsError.INVALID_METHOD);
    } else if (path.isAttribute) {
      let node: LocalNode = this.nodeProvider.getNode(path.parentPath);
      if (node == null) {
        this.closeResponse(m['rid'], null, DsError.INVALID_PATH);
        return;
      }
      let permission: number = Permission.parse(m['permit']);
      if (permission < Permission.WRITE) {
        this.closeResponse(m['rid'], null, DsError.PERMISSION_DENIED);
      } else {
        node.removeAttribute(path.name, this, this.addResponse(new Response(this, rid, 'set')));
      }
    } else {
      // shouldn't be possible to reach here
      throw new Error('unexpected case');
    }
  }

  /** @ignore */
  close(m: any) {
    if (typeof m['rid'] === 'number') {
      let rid: number = m['rid'];
      if (this._responses.has(rid)) {
        this._responses.get(rid)._close();
      }
    }
  }

  /** @ignore */
  onDisconnected() {
    this.clearProcessors();
    for (let [id, resp] of this._responses) {
      resp._close();
    }
    this._responses.clear();
    this._responses.set(0, this._subscription);
  }

  /** @ignore */
  onReconnected() {
    super.onReconnected();
  }
}

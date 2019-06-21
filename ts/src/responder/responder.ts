/// a responder for one connection
import {ConnectionHandler} from "../common/connection_handler";
import {Permission} from "../common/permission";
import {SubscribeResponse} from "./response/subscribe";
import {LocalNode, NodeProvider} from "./node_state";
import {Response} from "./response";
import {DSError, StreamStatus} from "../common/interfaces";
import {Path} from "../common/node";
import {ListResponse} from "./response/list";
import {InvokeResponse} from "./response/invoke";

export class Responder extends ConnectionHandler {
  /// reqId can be a dsId or a user name
  reqId: string;

  // maxCacheLength:number = ConnectionProcessor.defaultCacheSize;

  // storage: ISubscriptionResponderStorage;

  /// max permisison of the remote requester, this requester won't be able to do anything with higher
  /// permission even when other permission setting allows it to.
  /// This feature allows reverse proxy to override the permission for each connection with url parameter 
  maxPermission: number = Permission.CONFIG;


  readonly _responses: Map<number, Response> = new Map<number, Response>();

  get openResponseCount(): number {
    return this._responses.size;
  }

  get subscriptionCount(): number {
    return this._subscription.subscriptions.length;
  }

  _subscription: SubscribeResponse;

  /// caching of nodes
  readonly nodeProvider: NodeProvider;

  constructor(nodeProvider: NodeProvider) {
    super();
    this.nodeProvider = nodeProvider;
    this._subscription = new SubscribeResponse(this, 0);
    this._responses.set(0, this._subscription);

  }

  addResponse(response: Response): Response {
    if (response._sentStreamStatus !== StreamStatus.closed) {
      this._responses.set(response.rid, response);
    }
    return response;
  }


  disabled: boolean = false;

  onData(list: any[]) {
    if (this.disabled) {
      return;
    }
    for (let resp of list) {
      if (resp && resp instanceof Object) {
        this._onReceiveRequest(resp);
      }
    }
  }

  _onReceiveRequest(m: any) {
    let method = m['method'];
    if (typeof m['rid'] === 'number') {
      if (method == null) {
        this.updateInvoke(m);
        return;
      } else {
        if (this._responses.hasOwnProperty(m['rid'])) {
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
    }
    this.closeResponse(m['rid'], null, DSError.INVALID_METHOD);
  }

  /// close the response from responder side and notify requester
  closeResponse(rid: number, response?: Response, error?: DSError) {
    if (response != null) {
      if (this._responses.get(response.rid) !== response) {
        // this response is no longer valid
        return;
      }
      response._sentStreamStatus = StreamStatus.closed;
      rid = response.rid;
    }
    let m: any = {'rid': rid, 'stream': StreamStatus.closed};
    if (error != null) {
      m['error'] = error.serialize();
    }
    this._responses.delete(rid);
    this.addToSendList(m);
  }

  updateResponse(response: Response, updates: any[],
                 options?: {
                   streamStatus?: string,
                   columns?: any[],
                   meta?: object,
                   // handleMap?: (object m)=>void
                 } = {}) {
    let {streamStatus, columns, meta} = options;
    if (this._responses.get(response.rid) === response) {
      let m: any = {'rid': response.rid};
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
      if (response._sentStreamStatus === StreamStatus.closed) {
        this._responses.delete(response.rid);
      }
    }
  }

  list(m: any) {
    let path: Path = Path.getValidNodePath(m['path']);
    if (path != null && path.isAbsolute) {
      let rid: number = m['rid'];
      let state = this.nodeProvider.createState(path.path);

      this.addResponse(new ListResponse(this, rid, state));

    } else {
      this.closeResponse(m['rid'], null, DSError.INVALID_PATH);
    }
  }

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
      this.closeResponse(m['rid'], null, DSError.INVALID_PATHS);
    }
  }


  unsubscribe(m: any) {
    if (Array.isArray(m['sids'])) {
      for (let sid of m['sids']) {
        if (typeof sid === 'number') {
          this._subscription.remove(sid);
        }
      }
      this.closeResponse(m['rid']);
    } else {
      this.closeResponse(m['rid'], null, DSError.INVALID_PATHS);
    }
  }

  invoke(m: any) {
    let path: Path = Path.getValidNodePath(m['path']);
    if (path != null && path.isAbsolute) {
      let rid: number = m['rid'];
      let parentNode = this.nodeProvider.getNode(path.parentPath);


      let node: LocalNode = this.nodeProvider.getNode(path.path);
      if (node == null) {
        this.closeResponse(m['rid'], null, DSError.NOT_IMPLEMENTED);
        return;
      }
      let permission = Permission.parse(m['permit']);

      let params: {[key: string]: any};
      if (m["params"] instanceof Object) {
        params = m["params"];
      } else {
        params = {};
      }

      if (node.getInvokePermission() <= permission) {
        node.invoke(
          params,
          this,
          this.addResponse(
            new InvokeResponse(this, rid, parentNode, node, path.name)
          ),
          parentNode,
          permission
        );
      } else {
        this.closeResponse(m['rid'], null, DSError.PERMISSION_DENIED);
      }

    } else {
      this.closeResponse(m['rid'], null, DSError.INVALID_PATH);
    }
  }

  updateInvoke(m: any) {
    let rid: number = m['rid'];
    let response = this._responses.get(rid);
    if (response instanceof InvokeResponse) {
      if (m['params'] instanceof Object) {
        response.updateReqParams(m['params']);
      }
    } else {
      this.closeResponse(m['rid'], null, DSError.INVALID_METHOD);
    }
  }

  set(m: any) {
    let path: Path = Path.getValidPath(m['path']);
    if (path == null || !path.isAbsolute) {
      this.closeResponse(m['rid'], null, DSError.INVALID_PATH);
      return;
    }

    if (!m.hasOwnProperty('value')) {
      this.closeResponse(m['rid'], null, DSError.INVALID_VALUE);
      return;
    }

    let value = m['value'];
    let rid: number = m['rid'];
    if (path.isNode) {
      let node: LocalNode = this.nodeProvider.getNode(path.path);
      if (node == null) {
        this.closeResponse(m['rid'], null, DSError.INVALID_PATH);
        return;
      }
      let permission: number = Permission.parse(m['permit']);

      if (node.getSetPermission() <= permission) {
        node.setValue(value, this, this.addResponse(new Response(this, rid, 'set')));
        this.closeResponse(m['rid']);
      } else {
        this.closeResponse(m['rid'], null, DSError.PERMISSION_DENIED);
      }
    } else if (path.isAttribute) {
      let node: LocalNode = this.nodeProvider.getNode(path.parentPath);
      if (node == null) {
        this.closeResponse(m['rid'], null, DSError.INVALID_PATH);
        return;
      }
      let permission: number = Permission.parse(m['permit']);
      if (permission < Permission.WRITE) {
        this.closeResponse(m['rid'], null, DSError.PERMISSION_DENIED);
      } else {
        node.setAttribute(
          path.name, value, this, this.addResponse(new Response(this, rid, 'set')));
      }
    } else {
      // shouldn't be possible to reach here
      throw new Error('unexpected case');
    }
  }

  remove(m: any) {
    let path: Path = Path.getValidPath(m['path']);
    if (path == null || !path.isAbsolute) {
      this.closeResponse(m['rid'], null, DSError.INVALID_PATH);
      return;
    }
    let rid: number = m['rid'];
    if (path.isNode) {
      this.closeResponse(m['rid'], null, DSError.INVALID_METHOD);
    } else if (path.isAttribute) {
      let node: LocalNode = this.nodeProvider.getNode(path.parentPath);
      if (node == null) {
        this.closeResponse(m['rid'], null, DSError.INVALID_PATH);
        return;
      }
      let permission: number = Permission.parse(m['permit']);
      if (permission < Permission.WRITE) {
        this.closeResponse(m['rid'], null, DSError.PERMISSION_DENIED);
      } else {
        node.removeAttribute(
          path.name, this, this.addResponse(new Response(this, rid, 'set')));
      }


    } else {
      // shouldn't be possible to reach here
      throw new Error('unexpected case');
    }
  }

  close(m: any) {
    if (typeof m['rid'] === 'number') {
      let rid: number = m['rid'];
      if (this._responses.has(rid)) {
        this._responses.get(rid)._close();
      }
    }
  }

  onDisconnected() {
    this.clearProcessors();
    for (let [id, resp] of this._responses) {
      resp._close();
    }
    this._responses.clear();
    this._responses.set(0, this._subscription);
  }

  onReconnected() {
    super.onReconnected();
  }
}

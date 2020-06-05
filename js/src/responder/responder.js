"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Responder = void 0;
/// a responder for one connection
const connection_handler_1 = require("../common/connection-handler");
const permission_1 = require("../common/permission");
const subscribe_1 = require("./response/subscribe");
const response_1 = require("./response");
const interfaces_1 = require("../common/interfaces");
const node_1 = require("../common/node");
const list_1 = require("./response/list");
const invoke_1 = require("./response/invoke");
class Responder extends connection_handler_1.ConnectionHandler {
    constructor(nodeProvider) {
        super();
        // maxCacheLength:number = ConnectionProcessor.defaultCacheSize;
        // storage: ISubscriptionResponderStorage;
        /** @ignore
         *  max permisison of the remote requester, this requester won't be able to do anything with higher
         *  permission even when other permission setting allows it to.
         *  This feature allows reverse proxy to override the permission for each connection with url parameter
         */
        this.maxPermission = permission_1.Permission.CONFIG;
        /** @ignore */
        this._responses = new Map();
        /** @ignore */
        this.disabled = false;
        /** @ignore */
        this.onData = (list) => {
            if (this.disabled) {
                return;
            }
            for (let resp of list) {
                if (resp && resp instanceof Object) {
                    this._onReceiveRequest(resp);
                }
            }
        };
        this.nodeProvider = nodeProvider;
        this._subscription = new subscribe_1.SubscribeResponse(this, 0);
        this._responses.set(0, this._subscription);
    }
    get openResponseCount() {
        return this._responses.size;
    }
    get subscriptionCount() {
        return this._subscription.subscriptions.size;
    }
    /** @ignore */
    addResponse(response) {
        if (response._sentStreamStatus !== 'closed') {
            this._responses.set(response.rid, response);
        }
        return response;
    }
    /** @ignore */
    _onReceiveRequest(m) {
        let method = m['method'];
        if (typeof m['rid'] === 'number') {
            if (method == null) {
                this.updateInvoke(m);
                return;
            }
            else {
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
        this.closeResponse(m['rid'], null, interfaces_1.DsError.INVALID_METHOD);
    }
    /** @ignore
     * close the response from responder side and notify requester
     */
    closeResponse(rid, response, error) {
        if (response != null) {
            if (this._responses.get(response.rid) !== response) {
                // this response is no longer valid
                return;
            }
            response._sentStreamStatus = 'closed';
            rid = response.rid;
        }
        let m = { rid, stream: 'closed' };
        if (error != null) {
            m['error'] = error.serialize();
        }
        this._responses.delete(rid);
        this.addToSendList(m);
    }
    /** @ignore */
    updateResponse(response, updates, options = {}) {
        let { streamStatus, columns, meta } = options;
        if (this._responses.get(response.rid) === response) {
            let m = { rid: response.rid };
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
    list(m) {
        let path = node_1.Path.getValidNodePath(m['path']);
        if (path != null && path.isAbsolute) {
            let rid = m['rid'];
            let state = this.nodeProvider.createState(path.path);
            this.addResponse(new list_1.ListResponse(this, rid, state));
        }
        else {
            this.closeResponse(m['rid'], null, interfaces_1.DsError.INVALID_PATH);
        }
    }
    /** @ignore */
    subscribe(m) {
        if (Array.isArray(m['paths'])) {
            for (let p of m['paths']) {
                let pathstr;
                let qos = 0;
                let sid = -1;
                if (p instanceof Object) {
                    if (typeof p['path'] === 'string') {
                        pathstr = p['path'];
                    }
                    else {
                        continue;
                    }
                    if (typeof p['sid'] === 'number') {
                        sid = p['sid'];
                    }
                    else {
                        continue;
                    }
                    if (typeof p['qos'] === 'number') {
                        qos = p['qos'];
                    }
                }
                let path = node_1.Path.getValidNodePath(pathstr);
                if (path != null && path.isAbsolute) {
                    let state = this.nodeProvider.createState(path.path);
                    this._subscription.add(path.path, state, sid, qos);
                    this.closeResponse(m['rid']);
                }
                else {
                    this.closeResponse(m['rid']);
                }
            }
        }
        else {
            this.closeResponse(m['rid'], null, interfaces_1.DsError.INVALID_PATHS);
        }
    }
    /** @ignore */
    unsubscribe(m) {
        if (Array.isArray(m['sids'])) {
            for (let sid of m['sids']) {
                if (typeof sid === 'number') {
                    this._subscription.remove(sid);
                }
            }
            this.closeResponse(m['rid']);
        }
        else {
            this.closeResponse(m['rid'], null, interfaces_1.DsError.INVALID_PATHS);
        }
    }
    /** @ignore */
    invoke(m) {
        let path = node_1.Path.getValidNodePath(m['path']);
        if (path != null && path.isAbsolute) {
            let rid = m['rid'];
            let parentNode = this.nodeProvider.getNode(path.parentPath);
            let actionNode = (parentNode === null || parentNode === void 0 ? void 0 : parentNode.getChild(path.name)) || this.nodeProvider.getNode(path.path);
            if (actionNode == null) {
                this.closeResponse(m['rid'], null, interfaces_1.DsError.NOT_IMPLEMENTED);
                return;
            }
            let permission = permission_1.Permission.parse(m['permit']);
            let params;
            if (m['params'] instanceof Object) {
                params = m['params'];
            }
            else {
                params = {};
            }
            if (actionNode.getInvokePermission() <= permission) {
                actionNode.invoke(params, this.addResponse(new invoke_1.InvokeResponse(this, rid, parentNode, actionNode, path.name)), parentNode, permission);
            }
            else {
                this.closeResponse(m['rid'], null, interfaces_1.DsError.PERMISSION_DENIED);
            }
        }
        else {
            this.closeResponse(m['rid'], null, interfaces_1.DsError.INVALID_PATH);
        }
    }
    /** @ignore */
    updateInvoke(m) {
        let rid = m['rid'];
        let response = this._responses.get(rid);
        if (response instanceof invoke_1.InvokeResponse) {
            if (m['params'] instanceof Object) {
                response.updateReqParams(m['params']);
            }
        }
        else {
            this.closeResponse(m['rid'], null, interfaces_1.DsError.INVALID_METHOD);
        }
    }
    /** @ignore */
    set(m) {
        let path = node_1.Path.getValidPath(m['path']);
        if (path == null || !path.isAbsolute) {
            this.closeResponse(m['rid'], null, interfaces_1.DsError.INVALID_PATH);
            return;
        }
        if (!m.hasOwnProperty('value')) {
            this.closeResponse(m['rid'], null, interfaces_1.DsError.INVALID_VALUE);
            return;
        }
        let value = m['value'];
        let rid = m['rid'];
        if (path.isNode) {
            let node = this.nodeProvider.getNode(path.path);
            if (node == null) {
                this.closeResponse(m['rid'], null, interfaces_1.DsError.INVALID_PATH);
                return;
            }
            let permission = permission_1.Permission.parse(m['permit']);
            if (node.getSetPermission() <= permission) {
                node.setValue(value, this, this.addResponse(new response_1.Response(this, rid, 'set')));
            }
            else {
                this.closeResponse(m['rid'], null, interfaces_1.DsError.PERMISSION_DENIED);
            }
        }
        else if (path.isAttribute) {
            let node = this.nodeProvider.getNode(path.parentPath);
            if (node == null) {
                this.closeResponse(m['rid'], null, interfaces_1.DsError.INVALID_PATH);
                return;
            }
            let permission = permission_1.Permission.parse(m['permit']);
            if (permission < permission_1.Permission.WRITE) {
                this.closeResponse(m['rid'], null, interfaces_1.DsError.PERMISSION_DENIED);
            }
            else {
                node.setAttribute(path.name, value, this, this.addResponse(new response_1.Response(this, rid, 'set')));
            }
        }
        else {
            // shouldn't be possible to reach here
            throw new Error('unexpected case');
        }
    }
    /** @ignore */
    remove(m) {
        let path = node_1.Path.getValidPath(m['path']);
        if (path == null || !path.isAbsolute) {
            this.closeResponse(m['rid'], null, interfaces_1.DsError.INVALID_PATH);
            return;
        }
        let rid = m['rid'];
        if (path.isNode) {
            this.closeResponse(m['rid'], null, interfaces_1.DsError.INVALID_METHOD);
        }
        else if (path.isAttribute) {
            let node = this.nodeProvider.getNode(path.parentPath);
            if (node == null) {
                this.closeResponse(m['rid'], null, interfaces_1.DsError.INVALID_PATH);
                return;
            }
            let permission = permission_1.Permission.parse(m['permit']);
            if (permission < permission_1.Permission.WRITE) {
                this.closeResponse(m['rid'], null, interfaces_1.DsError.PERMISSION_DENIED);
            }
            else {
                node.removeAttribute(path.name, this, this.addResponse(new response_1.Response(this, rid, 'set')));
            }
        }
        else {
            // shouldn't be possible to reach here
            throw new Error('unexpected case');
        }
    }
    /** @ignore */
    close(m) {
        if (typeof m['rid'] === 'number') {
            let rid = m['rid'];
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
exports.Responder = Responder;
//# sourceMappingURL=responder.js.map
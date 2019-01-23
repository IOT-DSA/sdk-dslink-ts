"use strict";
// part of dslink.responder;
Object.defineProperty(exports, "__esModule", { value: true });
/// a responder for one connection
const connection_handler_1 = require("../common/connection_handler");
class Responder extends connection_handler_1.ConnectionHandler {
    constructor() {
        super(...arguments);
        this.maxCacheLength = ConnectionProcessor.defaultCacheSize;
        /// max permisison of the remote requester, this requester won't be able to do anything with higher
        /// permission even when other permission setting allows it to.
        /// This feature allows reverse proxy to override the permission for each connection with url parameter 
        this.maxPermission = Permission.CONFIG;
        /// list of permission group
        this.groups = [];
    }
    initStorage(ISubscriptionResponderStorage, s, nodes) {
        if (storage != null) {
            storage.destroy();
        }
        storage = s;
        if (storage != null && nodes != null) {
            for (ISubscriptionNodeStorage; node; of)
                nodes;
            {
                var values = node.getLoadedValues();
                let localnode = nodeProvider.getOrCreateNode(node.path, false);
                let controller = this._subscription.add(node.path, localnode, -1, node.qos);
                if (values.isNotEmpty) {
                    controller.resetCache(values);
                }
            }
        }
    }
    updateGroups(vals, ignoreId = false) {
        if (ignoreId) {
            groups = vals.where((str) => str != '').toList();
        }
        else {
            groups = [reqId]..addAll(vals.where((str) => str != ''));
        }
    }
}
exports.Responder = Responder;
, Response > ;
new object();
get;
openResponseCount();
number;
{
    return this._responses.length;
}
get;
subscriptionCount();
number;
{
    return this._subscription.subscriptions.length;
}
_subscription: SubscribeResponse;
nodeProvider: NodeProvider;
Responder(this.nodeProvider, [this.reqId]);
{
    _subscription = new SubscribeResponse(this, 0);
    _responses[0] = this._subscription;
    // TODO: load reqId
    if (reqId != null) {
        groups = [reqId];
    }
}
addResponse(response, Response, path, Path = null, parameters, object = null);
Response;
{
    if (response._sentStreamStatus != StreamStatus.closed) {
        _responses[response.rid] = response;
        if (this._traceCallbacks != null) {
            let update = response.getTraceData();
            for (ResponseTraceCallback; callback; of)
                _traceCallbacks;
            {
                callback(update);
            }
        }
    }
    else {
        if (this._traceCallbacks != null) {
            let update = response.getTraceData(''); // no logged change is needed
            for (ResponseTraceCallback; callback; of)
                _traceCallbacks;
            {
                callback(update);
            }
        }
    }
    return response;
}
void traceResponseRemoved(response, Response);
{
    update: ResponseTrace = response.getTraceData('-');
    for (ResponseTraceCallback; callback; of)
        _traceCallbacks;
    {
        callback(update);
    }
}
disabled: boolean = false;
onData(list, List);
{
    if (disabled) {
        return;
    }
    for (object; resp; of)
        list;
    {
        if ((resp != null && resp instanceof Object)) {
            _onReceiveRequest(resp);
        }
    }
}
_onReceiveRequest(object, m);
{
    method: object = m['method'];
    if (m['rid'])
        is;
    int;
    {
        if (method == null) {
            updateInvoke(m);
            return;
        }
        else {
            if (this._responses.hasOwnProperty(m['rid'])) {
                if (method == 'close') {
                    close(m);
                }
                // when rid is invalid, nothing needs to be sent back
                return;
            }
            switch (method) {
                case 'list':
                    list(m);
                    return;
                case 'subscribe':
                    subscribe(m);
                    return;
                case 'unsubscribe':
                    unsubscribe(m);
                    return;
                case 'invoke':
                    invoke(m);
                    return;
                case 'set':
                    set(m);
                    return;
                case 'remove':
                    remove(m);
                    return;
            }
        }
    }
    closeResponse(m['rid'], error, DSError.INVALID_METHOD);
}
/// close the response from responder side and notify requester
closeResponse(rid, number, { response: Response, DSError, error });
{
    if (response != null) {
        if (_responses[response.rid] != response) {
            // this response is no longer valid
            return;
        }
        response._sentStreamStatus = StreamStatus.closed;
        rid = response.rid;
    }
    object;
    m = { 'rid': rid, 'stream': StreamStatus.closed };
    if (error != null) {
        m['error'] = error.serialize();
    }
    _responses.remove(rid);
    addToSendList(m);
}
void updateResponse(response, Response, updates, List, {
    let, streamStatus: string,
    let, columns: dynamic[],
    let, meta: object,
    void: handleMap(object, m)
});
{
    if (_responses[response.rid] == response) {
        object;
        m = { 'rid': response.rid };
        if (streamStatus != null && streamStatus != response._sentStreamStatus) {
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
        if (handleMap != null) {
            handleMap(m);
        }
        addToSendList(m);
        if (response._sentStreamStatus == StreamStatus.closed) {
            _responses.remove(response.rid);
            if (this._traceCallbacks != null) {
                traceResponseRemoved(response);
            }
        }
    }
}
list(object, m);
{
    path: Path = Path.getValidNodePath(m['path']);
    if (path != null && path.isAbsolute) {
        let rid = m['rid'];
        _getNode(path, (node) => {
            addResponse(new ListResponse(this, rid, node), path);
        }, (e, stack) => {
            var error = new DSError("nodeError", msg, e.toString(), detail, stack.toString());
            closeResponse(m['rid'], error, error);
        });
    }
    else {
        closeResponse(m['rid'], error, DSError.INVALID_PATH);
    }
}
subscribe(object, m);
{
    if (Array.isArray(m['paths'])) {
        for (object; p; of)
            m['paths'];
        {
            let pathstr;
            let qos = 0;
            let sid = -1;
            if ((p != null && p instanceof Object)) {
                if (typeof p['path'] === 'string') {
                    pathstr = p['path'];
                }
                else {
                    continue;
                }
                if (p['sid'])
                    is;
                int;
                {
                    sid = p['sid'];
                }
                {
                    continue;
                }
                if (p['qos'])
                    is;
                int;
                {
                    qos = p['qos'];
                }
            }
            let path = Path.getValidNodePath(pathstr);
            if (path != null && path.isAbsolute) {
                _getNode(path, (node) => {
                    _subscription.add(path.path, node, sid, qos);
                    closeResponse(m['rid']);
                }, (e, stack) => {
                    var error = new DSError("nodeError", msg, e.toString(), detail, stack.toString());
                    closeResponse(m['rid'], error, error);
                });
            }
            else {
                closeResponse(m['rid']);
            }
        }
    }
    else {
        closeResponse(m['rid'], error, DSError.INVALID_PATHS);
    }
}
_getNode(Path, p, func, Taker < LocalNode > , onError, TwoTaker(), {
    try: {
        let, node: LocalNode = nodeProvider.getOrCreateNode(p.path, false),
        if(node) { }, instanceof: WaitForMe
    }
});
{
    node.onLoaded.then((n) => {
        if (n instanceof LocalNode) {
            node = n;
        }
        func(node);
    }).catchError((e, stack) => {
        if (onError != null) {
            onError(e, stack);
        }
    });
}
{
    func(node);
}
try { }
catch (e) { }
stack;
{
    if (onError != null) {
        onError(e, stack);
    }
    else {
        rethrow;
    }
}
unsubscribe(object, m);
{
    if (Array.isArray(m['sids'])) {
        for (object; sid; of)
            m['sids'];
        {
            if (typeof sid === 'number') {
                _subscription.remove(sid);
            }
        }
        closeResponse(m['rid']);
    }
    else {
        closeResponse(m['rid'], error, DSError.INVALID_PATHS);
    }
}
invoke(object, m);
{
    path: Path = Path.getValidNodePath(m['path']);
    if (path != null && path.isAbsolute) {
        let rid = m['rid'];
        let parentNode;
        parentNode = nodeProvider.getOrCreateNode(path.parentPath, false);
        doInvoke([LocalNode, overriden]);
        {
            let node = overriden == null ?
                nodeProvider.getNode(path.path) :
                overriden;
            if (node == null) {
                if (overriden == null) {
                    node = parentNode.getChild(path.name);
                    if (node == null) {
                        closeResponse(m['rid'], error, DSError.PERMISSION_DENIED);
                        return;
                    }
                    if (node instanceof WaitForMe) {
                        node.onLoaded.then((_) => doInvoke(node));
                        return;
                    }
                    else {
                        doInvoke(node);
                        return;
                    }
                }
                else {
                    closeResponse(m['rid'], error, DSError.PERMISSION_DENIED);
                    return;
                }
            }
            let permission = nodeProvider.permissions.getPermission(path.path, this);
            let maxPermit = Permission.parse(m['permit']);
            if (maxPermit < permission) {
                permission = maxPermit;
            }
            let params;
            if (m["params"])
                is;
            {
                [key, string];
                dynamic;
            }
            {
                params = m["params"];
            }
            if (params == null) {
                params = {};
            }
            if (node.getInvokePermission() <= permission) {
                node.invoke(params, this, addResponse(new InvokeResponse(this, rid, parentNode, node, path.name), path, params), parentNode, permission);
            }
            else {
                closeResponse(m['rid'], error, DSError.PERMISSION_DENIED);
            }
        }
        if (parentNode instanceof WaitForMe) {
            parentNode.onLoaded.then((_) => {
                doInvoke();
            }).catchError((e, stack) => {
                var err = new DSError("nodeError", msg, e.toString(), detail, stack.toString());
                closeResponse(m['rid'], error, err);
            });
        }
        else {
            doInvoke();
        }
    }
    else {
        closeResponse(m['rid'], error, DSError.INVALID_PATH);
    }
}
updateInvoke(object, m);
{
    rid: number = m['rid'];
    if (_responses[rid])
        is;
    InvokeResponse;
    {
        if (m['params'])
            is;
        object;
        {
            _responses[rid].updateReqParams(m['params']);
        }
    }
    {
        closeResponse(m['rid'], error, DSError.INVALID_METHOD);
    }
}
set(object, m);
{
    path: Path = Path.getValidPath(m['path']);
    if (path == null || !path.isAbsolute) {
        closeResponse(m['rid'], error, DSError.INVALID_PATH);
        return;
    }
    if (!m.hasOwnProperty('value')) {
        closeResponse(m['rid'], error, DSError.INVALID_VALUE);
        return;
    }
    value: object = m['value'];
    rid: number = m['rid'];
    if (path.isNode) {
        _getNode(path, (node) => {
            let permission = nodeProvider.permissions.getPermission(node.path, this);
            let maxPermit = Permission.parse(m['permit']);
            if (maxPermit < permission) {
                permission = maxPermit;
            }
            if (node.getSetPermission() <= permission) {
                node.setValue(value, this, addResponse(new Response(this, rid, 'set'), path, value));
            }
            else {
                closeResponse(m['rid'], error, DSError.PERMISSION_DENIED);
            }
            closeResponse(m['rid']);
        }, (e, stack) => {
            var error = new DSError("nodeError", msg, e.toString(), detail, stack.toString());
            closeResponse(m['rid'], error, error);
        });
    }
    else if (path.isConfig) {
        let node;
        node = nodeProvider.getOrCreateNode(path.parentPath, false);
        let permission = nodeProvider.permissions.getPermission(node.path, this);
        if (permission < Permission.CONFIG) {
            closeResponse(m['rid'], error, DSError.PERMISSION_DENIED);
        }
        else {
            node.setConfig(path.name, value, this, addResponse(new Response(this, rid, 'set'), path, value));
        }
    }
    else if (path.isAttribute) {
        let node;
        node = nodeProvider.getOrCreateNode(path.parentPath, false);
        let permission = nodeProvider.permissions.getPermission(node.path, this);
        if (permission < Permission.WRITE) {
            closeResponse(m['rid'], error, DSError.PERMISSION_DENIED);
        }
        else {
            node.setAttribute(path.name, value, this, addResponse(new Response(this, rid, 'set'), path, value));
        }
    }
    else {
        // shouldn't be possible to reach here
        throw 'unexpected case';
    }
}
remove(object, m);
{
    path: Path = Path.getValidPath(m['path']);
    if (path == null || !path.isAbsolute) {
        closeResponse(m['rid'], error, DSError.INVALID_PATH);
        return;
    }
    rid: number = m['rid'];
    if (path.isNode) {
        closeResponse(m['rid'], error, DSError.INVALID_METHOD);
    }
    else if (path.isConfig) {
        let node;
        node = nodeProvider.getOrCreateNode(path.parentPath, false);
        let permission = nodeProvider.permissions.getPermission(node.path, this);
        if (permission < Permission.CONFIG) {
            closeResponse(m['rid'], error, DSError.PERMISSION_DENIED);
        }
        else {
            node.removeConfig(path.name, this, addResponse(new Response(this, rid, 'set'), path));
        }
    }
    else if (path.isAttribute) {
        let node;
        node = nodeProvider.getOrCreateNode(path.parentPath, false);
        let permission = nodeProvider.permissions.getPermission(node.path, this);
        if (permission < Permission.WRITE) {
            closeResponse(m['rid'], error, DSError.PERMISSION_DENIED);
        }
        else {
            node.removeAttribute(path.name, this, addResponse(new Response(this, rid, 'set'), path));
        }
    }
    else {
        // shouldn't be possible to reach here
        throw 'unexpected case';
    }
}
close(object, m);
{
    if (m['rid'])
        is;
    int;
    {
        let rid = m['rid'];
        if (this._responses.hasOwnProperty(rid)) {
            _responses[rid]._close();
            let resp = this._responses.remove(rid);
            if (this._traceCallbacks != null) {
                traceResponseRemoved(resp);
            }
        }
    }
}
onDisconnected();
{
    clearProcessors();
    _responses.forEach((id, resp) => {
        resp._close();
    });
    _responses.clear();
    _responses[0] = this._subscription;
}
onReconnected();
{
    super.onReconnected();
}
_traceCallbacks: ResponseTraceCallback[];
addTraceCallback(_traceCallback, ResponseTraceCallback);
{
    _subscription.addTraceCallback(this._traceCallback);
    _responses.forEach((rid, response) => {
        _traceCallback(response.getTraceData());
    });
    if (this._traceCallbacks == null)
        _traceCallbacks = new ResponseTraceCallback[]();
    _traceCallbacks.add(this._traceCallback);
}
removeTraceCallback(_traceCallback, ResponseTraceCallback);
{
    _traceCallbacks.remove(this._traceCallback);
    if (this._traceCallbacks.isEmpty) {
        _traceCallbacks = null;
    }
}
//# sourceMappingURL=responder.js.map
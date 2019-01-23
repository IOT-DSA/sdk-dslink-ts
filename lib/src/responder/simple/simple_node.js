"use strict";
// part of dslink.responder;
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
typedef;
Promise < ByteData > IconResolver(name, string);
/// A simple table result.
/// This is used to return simple tables from an action.
class SimpleTableResult {
    SimpleTableResult([], rows, columns) { }
    ;
}
exports.SimpleTableResult = SimpleTableResult;
/// An Asynchronous Table Result
/// This can be used to return asynchronous tables from actions.
class AsyncTableResult {
    constructor() {
        /// Stream Status
        this.status = StreamStatus.open;
    }
    AsyncTableResult([], columns) { }
    ;
    /// Updates table rows to [rows].
    /// [stat] is the stream status.
    /// [meta] is the action result metadata.
    update(rows, stat, meta) {
        if (this.rows == null) {
            this.rows = rows;
        }
        else {
            this.rows.addAll(rows);
        }
        this.meta = meta;
        if (stat != null) {
            status = stat;
        }
        if (response == null) {
            new Future(write);
        }
        else {
            write();
        }
    }
    /// Write this result to the result given by [resp].
    write(resp) {
        if (resp != null) {
            if (response == null) {
                response = resp;
            }
            else {
                //        logger.warning("can not use same AsyncTableResult twice");
            }
        }
        if (response != null && (rows != null || meta != null || status == StreamStatus.closed)) {
            response.updateStream(rows, columns, columns, streamStatus, status, meta, meta);
            rows = null;
            columns = null;
        }
    }
    /// Closes this response.
    close() {
        if (response != null) {
            response.close();
        }
        else {
            status = StreamStatus.closed;
        }
    }
}
exports.AsyncTableResult = AsyncTableResult;
/// A Live-Updating Table
class LiveTable {
    constructor() {
        this._onClose = [];
        this.autoStartSend = true;
    }
    LiveTable([TableColumn, [], columns]) {
        return new LiveTable.create(columns == null ? [] : columns, []);
    }
    onRowUpdate(row) {
        if (this._resp != null) {
            _resp.updateStream([row.values], meta, {
                "modify": "replace ${row.index}-${row.index}"
            });
        }
    }
    doOnClose(f) {
        _onClose.add(f);
    }
    createRow(values, { boolean, ready: , true:  }) {
        if (values == null)
            values = [];
        var row = new LiveTableRow(this, values);
        row.index = rows.length;
        rows.add(row);
        if (ready && this._resp != null) {
            _resp.updateStream([row.values], meta, {
                "mode": "append"
            });
        }
        return row;
    }
    clear() {
        rows.length = 0;
        if (this._resp != null) {
            _resp.updateStream([], meta, {
                "mode": "refresh"
            }, columns, []);
        }
    }
    refresh(idx = -1) {
        if (this._resp != null) {
            _resp.updateStream(getCurrentState(), columns, columns.map((x) => {
                return x.getData();
            }).toList(), streamStatus, StreamStatus.open, meta, {
                "mode": "refresh"
            });
        }
    }
    reindex() {
        var i = 0;
        for (LiveTableRow; row; of)
            rows;
        {
            row.index = i;
            i++;
        }
    }
    override() {
        refresh();
    }
    resend() {
        sendTo(this._resp);
    }
    sendTo(resp) {
        _resp = resp;
        _resp.onClose = (r) => {
            close(true);
        };
        if (autoStartSend) {
            resp.updateStream(getCurrentState(), columns, columns.map((x) => {
                return x.getData();
            }).toList(), streamStatus, StreamStatus.open, meta, {
                "mode": "refresh"
            });
        }
    }
    close(isFromRequester = false) {
        while (this._onClose.isNotEmpty) {
            _onClose.removeAt(0)();
        }
        if (!isFromRequester) {
            _resp.close();
        }
    }
    getCurrentState(from = -1) {
        rw: LiveTableRow[] = rows;
        if (from != -1) {
            rw = rw.sublist(from);
        }
        return rw.map((x) => x.values).toList();
    }
    get response() { return this._resp; }
}
exports.LiveTable = LiveTable;
class LiveTableRow {
    constructor() {
        this.index = -1;
    }
    setValue(idx, value) {
        if (idx > values.length - 1) {
            values.length += 1;
        }
        values[idx] = value;
        table.onRowUpdate(this);
    }
    delete() {
        table.rows.remove(this);
        var idx = index;
        table.refresh(idx);
        table.reindex();
    }
}
exports.LiveTableRow = LiveTableRow;
/// Initialize the node provider.
void init([{ [key]: string }], dynamic, m, { [key]: string, NodeFactory }, profiles);
/// Save the node provider to a map.
object;
save();
/// Persist the node provider.
void persist([now, boolean = false]);
/// Updates the value of the node at [path] to the given [value].
void updateValue(path, string, value, object);
/// Adds a node at the given [path] that is initialized with the given data in [m].
LocalNode;
addNode(path, string, object, m);
/// Removes the node specified at [path].
void removeNode(path, string);
// Add a profile to the node provider.
void addProfile(name, string, factory, NodeFactory);
class SysGetIconNode extends SimpleNode {
}
exports.SysGetIconNode = SysGetIconNode;
(path, provider) => {
    configs.addAll({
        r: "$invokable", "read": ,
        r: "$params", [{
            "name": "Icon",
            "type": "string"
        }]: ,
        r: "$columns", [{
            "name": "Data",
            "type": "binary"
        }]: ,
        r: "$result", "table": 
    });
};
onInvoke(params, { [key]: string, dynamic });
async;
{
    name: string = params["Icon"];
    resolver: IconResolver = provider._iconResolver;
    data: ByteData = await resolver(name);
    return [[
            data
        ]];
}
class SimpleNodeProvider extends NodeProviderImpl {
    constructor() {
        super(...arguments);
        /// All the nodes in this node provider.
        this.nodes = new { [key]: string, LocalNode }();
        this._resolverFactories = [];
    }
    getNode(path) {
        return this._getNode(path);
    }
    setIconResolver(resolver) {
        _iconResolver = resolver;
        nodes["/sys/getIcon"] = new SysGetIconNode("/sys/getIcon", this);
    }
    _getNode(path, { boolean, allowStubs: , false:  }) {
        if (nodes.hasOwnProperty(path)) {
            let node = nodes[path];
            if (allowStubs || node._stub == false) {
                return node;
            }
        }
        if (this._resolverFactories.isNotEmpty) {
            for (var f of _resolverFactories) {
                var node = f(path);
                if (node != null) {
                    return node;
                }
            }
        }
        return null;
    }
    /// Gets a node at the given [path] if it exists.
    /// If it does not exist, create a new node and return it.
    ///
    /// When [addToTree] is false, the node will not be inserted into the node provider.
    /// When [init] is false, onCreated() is not called.
    getOrCreateNode(path, addToTree = true, init = true) {
        node: LocalNode = this._getNode(path, allowStubs, true);
        if (node != null) {
            if (addToTree) {
                let po = new Path(path);
                if (!po.isRoot) {
                    let parent = getNode(po.parentPath);
                    if (parent != null && !parent.children.hasOwnProperty(po.name)) {
                        parent.addChild(po.name, node);
                        parent.listChangeController.add(po.name);
                        node.listChangeController.add(r, "$is");
                    }
                }
                if (node instanceof SimpleNode) {
                    node._stub = false;
                }
            }
            return node;
        }
        if (addToTree) {
            return createNode(path, init);
        }
        else {
            node = new SimpleNode(path, this)
                .._stub = true;
            nodes[path] = node;
            return node;
        }
    }
    /// Checks if this provider has the node at [path].
    hasNode(path) {
        node: exports.SimpleNode = SimpleNode = nodes[path];
        if (node == null) {
            return false;
        }
        if (node.isStubNode == true) {
            return false;
        }
        return true;
    }
    registerResolver(factory) {
        if (!_resolverFactories.contains(factory)) {
            _resolverFactories.add(factory);
        }
    }
    unregisterResolver(factory) {
        _resolverFactories.remove(factory);
    }
    addProfile(name, factory) {
        _profiles[name] = factory;
    }
    /// Sets the function that persists the nodes.
    setPersistFunction(doPersist) {
        _persist = doPersist;
    }
    /// Persist the nodes in this provider.
    /// If you are not using a LinkProvider, then call [setPersistFunction] to set
    /// the function that is called to persist.
    persist(now = false) {
        if (now) {
            if (this._persist == null) {
                return;
            }
            _persist();
        }
        else {
            new Future.delayed();
            const Duration;
            (seconds) => , () => {
                if (this._persist == null) {
                    return;
                }
                _persist();
            };
            ;
        }
    }
    /// Creates a node at [path].
    /// If a node already exists at this path, an exception is thrown.
    /// If [init] is false, onCreated() is not called.
    createNode(path, init = true) {
        Path;
        p = new Path(path);
        existing: LocalNode = nodes[path];
        if (existing != null) {
            if (existing instanceof SimpleNode) {
                if (existing._stub != true) {
                    throw new Exception("Node at ${path} already exists.");
                }
                else {
                    existing._stub = false;
                }
            }
            else {
                throw new Exception("Node at ${path} already exists.");
            }
        }
        node: exports.SimpleNode = SimpleNode = existing == null ? new SimpleNode(path, this) : existing;
        nodes[path] = node;
        if (init) {
            node.onCreated();
        }
        pnode: SimpleNode;
        if (p.parentPath != "") {
            pnode = getNode(p.parentPath);
        }
        if (pnode != null) {
            pnode.children[p.name] = node;
            pnode.onChildAdded(p.name, node);
            pnode.updateList(p.name);
        }
        return node;
    }
}
__decorate([
    override
], SimpleNodeProvider.prototype, "getNode", null);
__decorate([
    override
], SimpleNodeProvider.prototype, "addProfile", null);
exports.SimpleNodeProvider = SimpleNodeProvider;
m, { [key]: string, NodeFactory };
profiles;
{
    // by default, the first SimpleNodeProvider is the static instance
    if (instance == null) {
        instance = this;
    }
    root = new SimpleNode("/", this);
    nodes["/"] = root;
    defs = new SimpleHiddenNode('/defs', this);
    nodes[defs.path] = defs;
    sys = new SimpleHiddenNode('/sys', this);
    nodes[sys.path] = sys;
    init(m, profiles);
}
/// Root node
root: SimpleNode;
/// defs node
defs: SimpleHiddenNode;
/// sys node
sys: SimpleHiddenNode;
init({ [key]: string, dynamic }, m, profiles, { [key]: string, NodeFactory });
{
    if (profiles != null) {
        if (profiles.isNotEmpty) {
            _profiles.addAll(profiles);
        }
        else {
            _profiles = profiles;
        }
    }
    if (m != null) {
        root.load(m);
    }
}
get;
profileMap();
{
    [key, string];
    NodeFactory;
}
{
    return this._profiles;
}
save();
object;
{
    return root.save();
}
updateValue(path, string, value, object);
{
    node: exports.SimpleNode = SimpleNode = getNode(path);
    node.updateValue(value);
}
/// Sets the given [node] to the given [path].
setNode(path, string, node, SimpleNode, { boolean: registerChildren, false:  });
{
    if (path == '/' || !path.startsWith('/'))
        return null;
    Path;
    p = new Path(path);
    pnode: exports.SimpleNode = SimpleNode = getNode(p.parentPath);
    nodes[path] = node;
    node.onCreated();
    if (pnode != null) {
        pnode.children[p.name] = node;
        pnode.onChildAdded(p.name, node);
        pnode.updateList(p.name);
    }
    if (registerChildren) {
        for (SimpleNode; c; of)
            node.children.values;
        {
            setNode(c.path, c);
        }
    }
}
addNode(path, string, object, m);
SimpleNode;
{
    if (path == '/' || !path.startsWith('/'))
        return null;
    Path;
    p = new Path(path);
    oldNode: exports.SimpleNode = SimpleNode = this._getNode(path, allowStubs, true);
    pnode: exports.SimpleNode = SimpleNode = getNode(p.parentPath);
    node: SimpleNode;
    if (pnode != null) {
        node = pnode.onLoadChild(p.name, m, this);
    }
    if (node == null) {
        let profile = m[r];
        '$is';
        ;
        if (this._profiles.hasOwnProperty(profile)) {
            node = _profiles[profile](path);
        }
        else {
            node = getOrCreateNode(path, true, false);
        }
    }
    if (oldNode != null) {
        //      logger.fine("Found old node for ${path}: Copying subscriptions.");
        for (ValueUpdateCallback; func in oldNode.callbacks;) {
            node.subscribe(func, oldNode.callbacks[func]);
        }
        if (node instanceof SimpleNode) {
            try {
                node._listChangeController = oldNode._listChangeController;
                node._listChangeController.onStartListen = () => {
                    node.onStartListListen();
                };
                node._listChangeController.onAllCancel = () => {
                    node.onAllListCancel();
                };
            }
            catch (e) { }
            if (node._hasListListener) {
                node.onStartListListen();
            }
        }
    }
    nodes[path] = node;
    node.load(m);
    node.onCreated();
    if (pnode != null) {
        pnode.addChild(p.name, node);
        pnode.onChildAdded(p.name, node);
        pnode.updateList(p.name);
    }
    node.updateList(r, "$is");
    if (oldNode != null) {
        oldNode.updateList(r, "$is");
    }
    return node;
}
removeNode(path, string, { boolean: recurse, true:  });
{
    if (path == '/' || !path.startsWith('/'))
        return;
    node: exports.SimpleNode = SimpleNode = getNode(path);
    if (node == null) {
        return;
    }
    if (recurse) {
        let base = path;
        if (!base.endsWith("/")) {
            base += "/";
        }
        let baseSlashFreq = countCharacterFrequency(base, "/");
        let targets = nodes.keys.where((string), x), { return: x, startsWith };
        (base) &&
            baseSlashFreq == countCharacterFrequency(x, "/");
    }
    toList();
    for (string; target; of)
        targets;
    {
        removeNode(target);
    }
}
Path;
p = new Path(path);
pnode: exports.SimpleNode = SimpleNode = getNode(p.parentPath);
node.onRemoving();
node.removed = true;
if (pnode != null) {
    pnode.children.remove(p.name);
    pnode.onChildRemoved(p.name, node);
    pnode.updateList(p.name);
}
if (node.callbacks.isEmpty && !node._hasListListener) {
    nodes.remove(path);
}
else {
    node._stub = true;
}
_profiles: {
    [key, string];
    NodeFactory;
}
new { [key]: string, NodeFactory }();
/// Permissions
permissions: IPermissionManager = new DummyPermissionManager();
/// Creates a responder with the given [dsId].
createResponder(dsId, string, sessionId, string);
Responder;
{
    return new Responder(this, dsId);
}
toString({ boolean: showInstances, false:  });
string;
{
    var buff = new StringBuffer();
    doNode(node, LocalNode, depth, number = 0);
    {
        Path;
        p = new Path(node.path);
        buff.write("${'  ' * depth}- ${p.name}");
        if (showInstances) {
            buff.write(": ${node}");
        }
        buff.writeln();
        for (var child of node.children.values) {
            doNode(child, depth + 1);
        }
    }
    doNode(root);
    return buff.toString().trim();
}
/// A Simple Node Implementation
/// A flexible node implementation that should fit most use cases.
class SimpleNode extends LocalNodeImpl {
    constructor() {
        super(...arguments);
        this._stub = false;
    }
    static initEncryption(key) {
        _encryptEngine = new AESFastEngine();
        _encryptParams = new KeyParameter(UTF8.encode(key).sublist(48, 80));
    }
    /// encrypt the string and prefix the value with '\u001Bpw:'
    /// so it's compatible with old plain text password
    static encryptString(str) {
        if (str == '') {
            return '';
        }
        _encryptEngine.reset();
        _encryptEngine.init(true, this._encryptParams);
        utf8bytes: Uint8Array = UTF8.encode(str);
        block: Uint8Array = new Uint8Array((utf8bytes.length + 31), ~/32 * 32);, block.setRange(0, utf8bytes.length, utf8bytes));
        return '\u001Bpw:${Base64.encode( this._encryptEngine.process(block))}';
    }
    static decryptString(str) {
        if (str.startsWith('\u001Bpw:')) {
            _encryptEngine.reset();
            _encryptEngine.init(false, this._encryptParams);
            let rslt = UTF8.decode(this._encryptEngine.process(Base64.decode(str.substring(4))));
            let pos = rslt.indexOf('\u0000');
            if (pos >= 0)
                rslt = rslt.substring(0, pos);
            return rslt;
        }
        else if (str.length == 22) {
            // a workaround for the broken password database, need to be removed later
            // 22 is the length of a AES block after base64 encoding
            // encoded password should always be 24 or more bytes, and a plain 22 bytes password is rare
            try {
                _encryptEngine.reset();
                _encryptEngine.init(false, this._encryptParams);
                let rslt = UTF8.decode(this._encryptEngine.process(Base64.decode(str)));
                let pos = rslt.indexOf('\u0000');
                if (pos >= 0)
                    rslt = rslt.substring(0, pos);
                return rslt;
            }
            catch (err) {
                return str;
            }
        }
        else {
            return str;
        }
    }
    /// Is this node a stub node?
    /// Stub nodes are nodes which are stored in the tree, but are not actually
    /// part of their parent.
    get isStubNode() { return this._stub; }
}
exports.SimpleNode = SimpleNode;
 == null ? SimpleNodeProvider.instance : nodeprovider,
    super(path);
/// Marks a node as being removed.
removed: boolean = false;
/// Marks this node as being serializable.
/// true: If, this node can be serialized into a JSON file and then loaded back.
/// false: If, this node can't be serialized into a JSON file.
serializable: boolean = true;
/// Load this node from the provided map as [m].
load(object, m);
{
    if (this._loaded) {
        configs.clear();
        attributes.clear();
        children.clear();
    }
    childPathPre: string;
    if (path == '/') {
        childPathPre = '/';
    }
    else {
        childPathPre = '$path/';
    }
    m.forEach((key, value) => {
        if (key.startsWith('?')) {
            if (key == '?value') {
                updateValue(value);
            }
        }
        else if (key.startsWith(r, '$')) {
            if (this._encryptEngine != null && key.startsWith(r, '$$') && typeof value === 'string') {
                configs[key] = decryptString(value);
            }
            else {
                configs[key] = value;
            }
        }
        else if (key.startsWith('@')) {
            attributes[key] = value;
        }
        else if ((value != null && value instanceof Object)) {
            let childPath = '$childPathPre$key';
            provider.addNode(childPath, value);
        }
    });
    _loaded = true;
}
/// Save this node into a map.
save();
object;
{
    rslt: object = {};
    configs.forEach((str, val) => {
        if (this._encryptEngine != null && typeof val === 'string' && str.startsWith(r, '$$') && str.endsWith('password')) {
            rslt[str] = encryptString(val);
        }
        else {
            rslt[str] = val;
        }
    });
    attributes.forEach((str, val) => {
        rslt[str] = val;
    });
    if (this._lastValueUpdate != null && this._lastValueUpdate.value != null) {
        rslt['?value'] = this._lastValueUpdate.value;
    }
    children.forEach((str, node) => {
        if (node instanceof SimpleNode && node.serializable == true) {
            rslt[str] = node.save();
        }
    });
    return rslt;
}
/// Handles the invoke method from the internals of the responder.
/// Use [onInvoke] to handle when a node is invoked.
invoke(params, { [key]: string, dynamic }, responder, Responder, response, InvokeResponse, parentNode, Node, let, maxPermission, number = Permission.CONFIG);
InvokeResponse;
{
    rslt: object;
    try {
        rslt = onInvoke(params);
    }
    catch (e) { }
    stack;
    {
        var error = new DSError("invokeException", msg, e.toString());
        try {
            error.detail = stack.toString();
        }
        catch (e) { }
        response.close(error);
        return response;
    }
    var rtype = "values";
    if (configs.hasOwnProperty(r, "$result")) {
        rtype = configs[r];
        "$result";
        ;
    }
    if (rslt == null) {
        // Create a default result based on the result type
        if (rtype == "values") {
            rslt = {};
        }
        else if (rtype == "table") {
            rslt = [];
        }
        else if (rtype == "stream") {
            rslt = [];
        }
    }
    if (rslt instanceof Iterable) {
        response.updateStream(rslt.toList(), streamStatus, StreamStatus.closed);
    }
    else if ((rslt != null && rslt instanceof Object)) {
        var columns = [];
        var out = [];
        for (var x in rslt) {
            columns.add({
                "name": x,
                "type": "dynamic"
            });
            out.add(rslt[x]);
        }
        response.updateStream([out], columns, columns, streamStatus, StreamStatus.closed);
    }
    else if (rslt instanceof SimpleTableResult) {
        response.updateStream(rslt.rows, columns, rslt.columns, streamStatus, StreamStatus.closed);
    }
    else if (rslt instanceof AsyncTableResult) {
        rslt.write(response);
        response.onClose = ();
        var response, { if:  };
        (rslt.onClose != null);
        {
            rslt.onClose(response);
        }
    }
    ;
    return response;
}
if (rslt instanceof Table) {
    response.updateStream(rslt.rows, columns, rslt.columns, streamStatus, StreamStatus.closed);
}
else if (rslt instanceof Stream) {
    var r = new AsyncTableResult();
    response.onClose = ();
    var response, { if:  };
    (r.onClose != null);
    {
        r.onClose(response);
    }
}
;
let stream = rslt;
if (rtype == "stream") {
    let sub;
    r.onClose = (_) => {
        if (sub != null) {
            sub.close();
        }
    };
    sub = stream.listen((v) => {
        if (v instanceof TableMetadata) {
            r.meta = v.meta;
            return;
        }
        else if (v instanceof TableColumns) {
            r.columns = v.columns.map((x) => x.getData()).toList();
            return;
        }
        if (v instanceof Iterable) {
            r.update(v.toList(), StreamStatus.open);
        }
        else if ((v != null && v instanceof Object)) {
            var meta;
            if (v.hasOwnProperty("__META__")) {
                meta = v["__META__"];
            }
            r.update([v], StreamStatus.open, meta);
        }
        else {
            throw new Exception("Unknown Value from Stream");
        }
    }, onDone, () => {
        r.close();
    }, onError, (e, stack) => {
        var error = new DSError("invokeException", msg, e.toString());
        try {
            error.detail = stack.toString();
        }
        catch (e) { }
        response.close(error);
    }, cancelOnError, true);
    r.write(response);
    return response;
}
else {
    var list = [];
    let sub;
    r.onClose = (_) => {
        if (sub != null) {
            sub.close();
        }
    };
    sub = stream.listen((v) => {
        if (v instanceof TableMetadata) {
            r.meta = v.meta;
            return;
        }
        else if (v instanceof TableColumns) {
            r.columns = v.columns.map((x) => x.getData()).toList();
            return;
        }
        if (v instanceof Iterable) {
            list.addAll(v);
        }
        else if ((v != null && v instanceof Object)) {
            list.add(v);
        }
        else {
            throw new Exception("Unknown Value from Stream");
        }
    }, onDone, () => {
        r.update(list);
        r.close();
    }, onError, (e, stack) => {
        var error = new DSError("invokeException", msg, e.toString());
        try {
            error.detail = stack.toString();
        }
        catch (e) { }
        response.close(error);
    }, cancelOnError, true);
}
r.write(response);
return response;
if (rslt instanceof Future) {
    var r = new AsyncTableResult();
    response.onClose = ();
    var response, { if:  };
    (r.onClose != null);
    {
        r.onClose(response);
    }
}
;
rslt.then((value) => {
    if (value instanceof LiveTable) {
        r = null;
        value.sendTo(response);
    }
    else if (value instanceof Stream) {
        let stream = value;
        let sub;
        r.onClose = (_) => {
            if (sub != null) {
                sub.close();
            }
        };
        sub = stream.listen((v) => {
            if (v instanceof TableMetadata) {
                r.meta = v.meta;
                return;
            }
            else if (v instanceof TableColumns) {
                r.columns = v.columns.map((x) => x.getData()).toList();
                return;
            }
            if (v instanceof Iterable) {
                r.update(v.toList());
            }
            else if ((v != null && v instanceof Object)) {
                var meta;
                if (v.hasOwnProperty("__META__")) {
                    meta = v["__META__"];
                }
                r.update([v], StreamStatus.open, meta);
            }
            else {
                throw new Exception("Unknown Value from Stream");
            }
        }, onDone, () => {
            r.close();
        }, onError, (e, stack) => {
            var error = new DSError("invokeException", msg, e.toString());
            try {
                error.detail = stack.toString();
            }
            catch (e) { }
            response.close(error);
        }, cancelOnError, true);
    }
    else if (value instanceof Table) {
        let table = value;
        r.columns = table.columns.map((x) => x.getData()).toList();
        r.update(table.rows, StreamStatus.closed, table.meta);
        r.close();
    }
    else {
        r.update(value, is, Iterable ? value.toList() : [value]);
        r.close();
    }
}).catchError((e, stack) => {
    var error = new DSError("invokeException", msg, e.toString());
    try {
        error.detail = stack.toString();
    }
    catch (e) { }
    response.close(error);
});
r.write(response);
return response;
if (rslt instanceof LiveTable) {
    rslt.sendTo(response);
}
else {
    response.close();
}
return response;
/// This is called when this node is invoked.
/// You can return the following types from this method:
/// - [Iterable]
/// - [object]
/// - [Table]
/// - [Stream]
/// - [SimpleTableResult]
/// - [AsyncTableResult]
///
/// You can also return a future that resolves to one (like if the method is async) of the following types:
/// - [Stream]
/// - [Iterable]
/// - [object]
/// - [Table]
dynamic;
onInvoke(params, { [key]: string, dynamic });
{
    return null;
}
/// Gets the parent node of this node.
SimpleNode;
get;
parent => provider.getNode(new Path(path).parentPath);
/// Callback used to accept or reject a value when it is set.
/// Return true to reject the value, and false to accept it.
boolean;
onSetValue(val, object);
false;
/// Callback used to accept or reject a value of a config when it is set.
/// Return true to reject the value, and false to accept it.
boolean;
onSetConfig(name, string, value, object);
false;
/// Callback used to accept or reject a value of an attribute when it is set.
/// Return true to reject the value, and false to accept it.
boolean;
onSetAttribute(name, string, value, object);
false;
// Callback used to notify a node that it is being subscribed to.
void onSubscribe();
{ }
// Callback used to notify a node that a subscribe has unsubscribed.
void onUnsubscribe();
{ }
/// Callback used to notify a node that it was created.
/// This is called after a node is deserialized as well.
void onCreated();
{ }
/// Callback used to notify a node that it is about to be removed.
void onRemoving();
{ }
/// Callback used to notify a node that one of it's children has been removed.
void onChildRemoved(name, string, node, Node);
{ }
/// Callback used to notify a node that a child has been added to it.
void onChildAdded(name, string, node, Node);
{ }
subscribe(callback, ValueUpdateCallback, qos, number = 0);
RespSubscribeListener;
{
    onSubscribe();
    return super.subscribe(callback, qos);
}
unsubscribe(callback, ValueUpdateCallback);
{
    onUnsubscribe();
    super.unsubscribe(callback);
}
/// Callback to override how a child of this node is loaded.
/// If this method returns null, the default strategy is used.
onLoadChild(name, string, data, object, provider, SimpleNodeProvider);
SimpleNode;
{
    return null;
}
/// Creates a child with the given [name].
/// If [m] is specified, the node is loaded with that map.
createChild(name, string, object, m);
SimpleNode;
{
    var tp = new Path(path).child(name).path;
    return provider.addNode(tp, m == null ? {} : m);
}
/// Gets the name of this node.
/// This is the last component of this node's path.
string;
get;
name => new Path(path).name;
/// Gets the current display name of this node.
/// This is the $name config. If it does not exist, then null is returned.
string;
get;
displayName => configs[r];
"$name";
;
/// Sets the display name of this node.
/// This is the $name config. If this is set to null, then the display name is removed.
set;
displayName(value, string);
{
    if (value == null) {
        configs.remove(r, "$name");
    }
    else {
        configs[r];
        "$name";
        value;
    }
    updateList(r, "$name");
}
/// Gets the current value type of this node.
/// This is the $type config. If it does not exist, then null is returned.
string;
get;
type => configs[r];
"$type";
;
/// Sets the value type of this node.
/// This is the $type config. If this is set to null, then the value type is removed.
set;
type(value, string);
{
    if (value == null) {
        configs.remove(r, "$type");
    }
    else {
        configs[r];
        "$type";
        value;
    }
    updateList(r, "$type");
}
/// Gets the current value of the $writable config.
/// If it does not exist, then null is returned.
string;
get;
writable => configs[r];
"$writable";
;
/// Sets the value of the writable config.
/// If this is set to null, then the writable config is removed.
set;
writable(value);
{
    if (value == null) {
        configs.remove(r, "$writable");
    }
    else if (value instanceof boolean) {
        if (value) {
            configs[r];
            "$writable";
            "write";
        }
        else {
            configs.remove(r, "$writable");
        }
    }
    else {
        configs[r];
        "$writable";
        value.toString();
    }
    updateList(r, "$writable");
}
/// Checks if this node has the specified config.
boolean;
hasConfig(name, string);
configs.hasOwnProperty(name.startsWith(r, "$") ? name : '\$' + name);
/// Checks if this node has the specified attribute.
boolean;
hasAttribute(name, string);
attributes.hasOwnProperty(name.startsWith("@") ? name : '@' + name);
/// Remove this node from it's parent.
remove();
{
    provider.removeNode(path);
}
/// Add this node to the given node.
/// If [input] is a string, it is interpreted as a node path and resolved to a node.
/// If [input] is a [SimpleNode], it will be attached to that.
attach(input, { string: name });
{
    if (name == null) {
        name = this.name;
    }
    if (typeof input === 'string') {
        provider.getNode(input).addChild(name, this);
    }
    else if (input instanceof SimpleNode) {
        input.addChild(name, this);
    }
    else {
        throw "Invalid Input";
    }
}
/// Adds the given [node] as a child of this node with the given [name].
addChild(name, string, node, Node);
{
    super.addChild(name, node);
    updateList(name);
}
/// Removes a child from this node.
/// If [input] is a string, a child named with the specified [input] is removed.
/// If [input] is a Node, the child that owns that node is removed.
/// The name of the removed node is returned.
removeChild(dynamic, input);
string;
{
    name: string = super.removeChild(input);
    if (name != null) {
        updateList(name);
    }
    return name;
}
setAttribute(let, name, string, value, object, responder, Responder, response, Response);
Response;
{
    if (onSetAttribute(name, value) != true) {
        // when callback returns true, value is rejected
        super.setAttribute(name, value, responder, response);
    }
    return response;
}
setConfig(let, name, string, value, object, responder, Responder, response, Response);
Response;
{
    if (onSetConfig(name, value) != true) {
        // when callback returns true, value is rejected
        super.setConfig(name, value, responder, response);
    }
    return response;
}
setValue(value, object, responder, Responder, response, Response, let, maxPermission, number = Permission.CONFIG);
Response;
{
    if (onSetValue(value) != true)
        // when callback returns true, value is rejected
        super.setValue(value, responder, response, maxPermission);
    return response;
}
operator[](name, string);
get(name);
operator[] = (name, value) => {
    if (name.startsWith(r, "$") || name.startsWith(r, "@")) {
        if (name.startsWith(r, "$")) {
            configs[name] = value;
        }
        else {
            attributes[name] = value;
        }
    }
    else {
        if (value == null) {
            return removeChild(name);
        }
        else if ((value != null && value instanceof Object)) {
            return createChild(name, value);
        }
        else {
            addChild(name, value);
            return value;
        }
    }
};
/// A hidden node.
class SimpleHiddenNode extends SimpleNode {
}
exports.SimpleHiddenNode = SimpleHiddenNode;
(path, provider) => {
    configs[r];
    '$hidden';
    true;
};
getSimpleMap();
{
    [key, string];
    dynamic;
}
{
    var rslt = , dynamic;
     > {
        r: '$hidden', true: 
    };
    if (configs.hasOwnProperty(r, '$is')) {
        rslt[r];
        '$is';
        configs[r];
        '$is';
        ;
    }
    if (configs.hasOwnProperty(r, '$type')) {
        rslt[r];
        '$type';
        configs[r];
        '$type';
        ;
    }
    if (configs.hasOwnProperty(r, '$name')) {
        rslt[r];
        '$name';
        configs[r];
        '$name';
        ;
    }
    if (configs.hasOwnProperty(r, '$invokable')) {
        rslt[r];
        '$invokable';
        configs[r];
        '$invokable';
        ;
    }
    if (configs.hasOwnProperty(r, '$writable')) {
        rslt[r];
        '$writable';
        configs[r];
        '$writable';
        ;
    }
    return rslt;
}
//# sourceMappingURL=simple_node.js.map
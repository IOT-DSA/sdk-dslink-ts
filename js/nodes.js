var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/// Helper Nodes for Responders
library;
dslink.nodes;
import "dart:async";
import "dart:convert";
import "package:dslink/common.dart";
import "package:dslink/responder.dart";
import "package:json_diff/json_diff.dart";
as;
JsonDiff;
import "package:dslink/utils.dart";
show;
Producer;
part;
"src/nodes/json.dart";
/// An Action for Deleting a Given Node
export class DeleteActionNode extends SimpleNode {
}
(path, provider);
/// When this action is invoked, [provider.removeNode] will be called with the parent of this action.
DeleteActionNode.forParent(path, string, provider, MutableNodeProvider, {
    Function, onDelete
});
this(path, provider, new Path(path).parentPath, onDelete, onDelete);
/// Handles an action invocation and deletes the target path.
onInvoke(params, { [key]: string, dynamic });
object;
{
    provider.removeNode(targetPath);
    if (onDelete != null) {
        onDelete();
    }
    return {};
}
/// A function that is called when an action is invoked.
typedef;
ActionFunction(params, { [key]: string, dynamic });
/// A Simple Action Node
export class SimpleActionNode extends SimpleNode {
    /// When this action is invoked, the given [function] will be called with the parameters
    /// and then the result of the function will be returned.
    SimpleActionNode(path) { }
}
function () { }
[SimpleNodeProvider, provider];
super(path, provider);
object;
onInvoke(params, { [key]: string, dynamic });
/// A Node Provider for a Single Node
export class SingleNodeProvider extends NodeProvider {
    constructor() {
        super(...arguments);
        this.permissions = new DummyPermissionManager();
    }
    getNode(path) { }
    createResponder(dsId, sessionId) {
        return new Responder(this, dsId);
    }
    getOrCreateNode(path, addToTree = true) {
        return node;
    }
}
__decorate([
    override
], SingleNodeProvider.prototype, "LocalNode", void 0);
export class UpgradableNode extends SimpleNode {
}
(path, provider);
onCreated();
{
    if (configs.hasOwnProperty(r, "$version")) {
        var version = configs[r];
        "$version";
        ;
        if (version != latestVersion) {
            upgrader(version);
            configs[r];
            "$version";
            latestVersion;
        }
    }
    else {
        configs[r];
        "$version";
        latestVersion;
    }
}
/// A Lazy Value Node
export class LazyValueNode extends SimpleNode {
}
(path, provider);
onSubscribe();
{
    subscriptionCount++;
    checkSubscriptionNeeded();
}
onUnsubscribe();
{
    subscriptionCount--;
    checkSubscriptionNeeded();
}
checkSubscriptionNeeded();
{
    if (subscriptionCount <= 0) {
        subscriptionCount = 0;
        onValueUnsubscribe();
    }
    else {
        onValueSubscribe();
    }
}
subscriptionCount: number = 0;
/// Represents a Simple Callback Function
typedef;
void SimpleCallback();
export class ResolvingNodeProvider extends SimpleNodeProvider {
}
{
    [key, string];
    NodeFactory;
}
profiles;
super(defaultNodes, profiles);
getNode(path, string, { onLoaded: Completer < CallbackNode > , boolean, forceHandle: false });
LocalNode;
{
    node: LocalNode = super.getNode(path);
    if (path != "/" && node != null && !forceHandle) {
        if (onLoaded != null && !onLoaded.isCompleted) {
            onLoaded.complete(node);
        }
        return node;
    }
    if (handler == null) {
        if (onLoaded != null && !onLoaded.isCompleted) {
            onLoaded.complete(null);
        }
        return null;
    }
    Completer;
    c = new Completer();
    CallbackNode;
    n = new CallbackNode(path, provider, this);
    n.onLoadedCompleter = c;
    isListReady: boolean = false;
    n.isListReady = () => isListReady;
    handler(n).then((m) => {
        if (!m) {
            isListReady = true;
            let ts = ValueUpdate.getTs();
            n.getDisconnectedStatus = () => ts;
            n.listChangeController.add(r, "$is");
            if (onLoaded != null && !onLoaded.isCompleted) {
                onLoaded.complete(n);
            }
            if (c != null && !c.isCompleted) {
                c.complete();
            }
            return;
        }
        isListReady = true;
        n.listChangeController.add(r, "$is");
        if (onLoaded != null && !onLoaded.isCompleted) {
            onLoaded.complete(n);
        }
        if (c != null && !c.isCompleted) {
            c.complete();
        }
    }).catchError((e, stack) => {
        isListReady = true;
        let ts = ValueUpdate.getTs();
        n.getDisconnectedStatus = () => ts;
        n.listChangeController.add(r, "$is");
        if (c != null && !c.isCompleted) {
            c.completeError(e, stack);
        }
    });
    return n;
}
addNode(path, string, object, m);
SimpleNode;
{
    if (path == '/' || !path.startsWith('/'))
        return null;
    Path;
    p = new Path(path);
    pnode: SimpleNode = getNode(p.parentPath);
    node: SimpleNode;
    if (pnode != null) {
        node = pnode.onLoadChild(p.name, m, this);
    }
    if (node == null) {
        let profile = m[r];
        '$is';
        ;
        if (profileMap.hasOwnProperty(profile)) {
            node = profileMap[profile](path);
        }
        else {
            node = new CallbackNode(path);
        }
    }
    nodes[path] = node;
    node.load(m);
    node.onCreated();
    if (pnode != null) {
        pnode.children[p.name] = node;
        pnode.onChildAdded(p.name, node);
        pnode.updateList(p.name);
    }
    return node;
}
LocalNode;
getOrCreateNode(path, string, [addToTree, boolean = true, init, boolean = true]);
getNode(path);
/// A Simple Node which delegates all basic methods to given functions.
export class CallbackNode extends SimpleNode {
    CallbackNode(path, { provider: SimpleNodeProvider, this: , onActionInvoke, let, onChildAdded: ChildChangedCallback, let, onChildRemoved: ChildChangedCallback, let, onCreated: SimpleCallback, let, onRemoving: SimpleCallback, let, onLoadChild: LoadChildCallback, let, onSubscribe: SimpleCallback, let, onValueSet: ValueCallback }, , boolean) { }
}
 > ,
    SimpleCallback;
onUnsubscribe;
onChildAddedCallback = onChildAdded,
    onChildRemovedCallback = onChildRemoved,
    onCreatedCallback = onCreated,
    onRemovingCallback = onRemoving,
    onLoadChildCallback = onLoadChild,
    onSubscribeCallback = onSubscribe,
    onUnsubscribeCallback = onUnsubscribe,
    onValueSetCallback = onValueSet,
    super(path, provider);
onInvoke(params, { [key]: string, dynamic });
{
    if (onActionInvoke != null) {
        return onActionInvoke(params);
    }
    else {
        return super.onInvoke(params);
    }
}
onCreated();
{
    if (onCreatedCallback != null) {
        onCreatedCallback();
    }
}
onRemoving();
{
    if (onRemovingCallback != null) {
        onRemovingCallback();
    }
}
onChildAdded(name, string, node, Node);
{
    if (onChildAddedCallback != null) {
        onChildAddedCallback(name, node);
    }
}
onChildRemoved(name, string, node, Node);
{
    if (onChildRemovedCallback != null) {
        onChildRemovedCallback(name, node);
    }
}
onLoadChild(name, string, data, object, provider, SimpleNodeProvider);
SimpleNode;
{
    if (onLoadChildCallback != null) {
        return onLoadChildCallback(name, data, provider);
    }
    else {
        return super.onLoadChild(name, data, provider);
    }
}
onSubscribe();
{
    if (onSubscribeCallback != null) {
        return onSubscribeCallback();
    }
}
get;
onLoaded();
Future;
{
    if (onLoadedCompleter != null) {
        return onLoadedCompleter.future;
    }
    else {
        return new Future.sync(() => null);
    }
}
onUnsubscribe();
{
    if (onUnsubscribeCallback != null) {
        return onUnsubscribeCallback();
    }
}
get;
listReady();
boolean;
{
    if (isListReady != null) {
        return isListReady();
    }
    else {
        return true;
    }
}
get;
disconnected();
string;
{
    if (getDisconnectedStatus != null) {
        return getDisconnectedStatus();
    }
    else {
        return null;
    }
}
onStartListListen();
{
    if (onListStartListen != null) {
        onListStartListen();
    }
    super.onStartListListen();
}
onAllListCancel();
{
    if (onAllListCancelCallback != null) {
        onAllListCancelCallback();
    }
    super.onAllListCancel();
}
onSetValue(value);
{
    if (onValueSetCallback != null) {
        return onValueSetCallback(value);
    }
    return super.onSetValue(value);
}
export class NodeNamer {
    constructor() {
        this.BANNED_CHARS = [
            r, "%",
            r, ".",
            r, "/",
            r, "\",,
            r, "?",
            r, "*",
            r, ":",
            r, "|",
            r, "<",
            r, ">",
            r, "$",
            r, "@",
            r, '"',
            r, "'"
        ];
    }
    static createName(input) {
        var out = new StringBuffer();
        cu(string, n);
        const Utf8Encoder;
        ().convert(n)[0];
        mainLoop: for (var i = 0; i < input.length; i++) {
            let char = input[i];
            if (char == "%" && (i + 1 < input.length)) {
                let hexA = input[i + 1].toUpperCase();
                if ((cu(hexA) >= cu("0") && cu(hexA) <= cu("9")) ||
                    (cu(hexA) >= cu("A") && cu(hexA) <= cu("F"))) {
                    if (i + 2 < input.length) {
                        let hexB = input[i + 2].toUpperCase();
                        if ((cu(hexB) > cu("0") && cu(hexB) <= cu("9")) ||
                            (cu(hexB) >= cu("A") && cu(hexB) <= cu("F"))) {
                            i += 2;
                            out.write("%");
                            out.write(hexA);
                            out.write(hexB);
                            continue;
                        }
                        else {
                            ++i;
                            out.write("%${hexA}");
                            continue;
                        }
                    }
                }
            }
            for (string; bannedChar; of)
                BANNED_CHARS;
            {
                if (char == bannedChar) {
                    var e = char.codeUnitAt(0).toRadixString(16);
                    out.write("%${e}".toUpperCase());
                    continue mainLoop;
                }
            }
            out.write(char);
        }
        return out.toString();
    }
    static decodeName(input) {
        var out = new StringBuffer();
        cu(string, n);
        const Utf8Encoder;
        ().convert(n)[0];
        mainLoop: for (var i = 0; i < input.length; i++) {
            let char = input[i];
            if (char == "%") {
                let hexA = input[i + 1];
                if ((cu(hexA) >= cu("0") && cu(hexA) <= cu("9")) ||
                    (cu(hexA) >= cu("A") && cu(hexA) <= cu("F"))) {
                    string;
                    s = hexA;
                    if (i + 2 < input.length) {
                        let hexB = input[i + 2];
                        if ((cu(hexB) > cu("0") && cu(hexB) <= cu("9")) ||
                            (cu(hexB) >= cu("A") && cu(hexB) <= cu("F"))) {
                            ++i;
                            s += hexB;
                        }
                    }
                    int;
                    c = int.parse(s, radix, 16);
                    out.writeCharCode(c);
                    i++;
                    continue;
                }
            }
            out.write(char);
        }
        return out.toString();
    }
    static joinWithGoodName(string, p, name) {
        return new Path(p).child(NodeNamer.createName(name)).path;
    }
}
//# sourceMappingURL=nodes.js.map
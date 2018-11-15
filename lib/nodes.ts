/// Helper Nodes for Responders
library dslink.nodes;

import "dart:async";
import "dart:convert";

import "package:dslink/common.dart";
import "package:dslink/responder.dart";

import "package:json_diff/json_diff.dart" as JsonDiff;

import "package:dslink/utils.dart" show Producer;

part "src/nodes/json.dart";

/// An Action for Deleting a Given Node
export class DeleteActionNode  extends SimpleNode {
  final targetPath: string;
  final onDelete: Function;

  /// When this action is invoked, [provider.removeNode] will be called with [targetPath].
  DeleteActionNode(path: string, provider: MutableNodeProvider, this.targetPath, {
    this.onDelete
  }) : super(path, provider);

  /// When this action is invoked, [provider.removeNode] will be called with the parent of this action.
  DeleteActionNode.forParent(path: string, provider: MutableNodeProvider, {
    Function onDelete
  }) : this(path, provider, new Path(path).parentPath, onDelete: onDelete);

  /// Handles an action invocation and deletes the target path.
  @override
  onInvoke(params: {[key: string]: dynamic}):object {
    provider.removeNode(targetPath);
    if (onDelete != null) {
      onDelete();
    }
    return {};
  }
}

/// A function that is called when an action is invoked.
typedef ActionFunction(params: {[key: string]: dynamic});

/// A Simple Action Node
export class SimpleActionNode  extends SimpleNode {
  final function: ActionFunction;

  /// When this action is invoked, the given [function] will be called with the parameters
  /// and then the result of the function will be returned.
  SimpleActionNode(path: string, this.function, [SimpleNodeProvider provider]) : super(path, provider);

  @override
  object onInvoke(params: {[key: string]: dynamic}) => function(params);
}

/// A Node Provider for a Single Node
export class SingleNodeProvider  extends NodeProvider {
  final node: LocalNode;

  SingleNodeProvider(this.node);

  @override
  LocalNode getNode(path: string) => node;
  permissions: IPermissionManager = new DummyPermissionManager();

  createResponder(dsId: string, sessionId: string):Responder {
    return new Responder(this, dsId);
  }

  getOrCreateNode(path: string, addToTree: boolean = true):LocalNode {
    return node;
  }
}

export type NodeUpgradeFunction = (from:number) => void;

export class UpgradableNode  extends SimpleNode {
  final latestVersion:number;
  final upgrader: NodeUpgradeFunction;

  UpgradableNode(path: string, this.latestVersion, this.upgrader, [SimpleNodeProvider provider]) : super(path, provider);

  @override
  onCreated() {
    if (configs.containsKey(r"$version")) {
      var version = configs[r"$version"];
      if (version != latestVersion) {
        upgrader(version);
        configs[r"$version"] = latestVersion;
      }
    } else {
      configs[r"$version"] = latestVersion;
    }
  }
}

/// A Lazy Value Node
export class LazyValueNode  extends SimpleNode {
  onValueSubscribe: SimpleCallback;
  onValueUnsubscribe: SimpleCallback;

  LazyValueNode(path: string, {
    provider: SimpleNodeProvider,
    this.onValueSubscribe,
    this.onValueUnsubscribe
  }) : super(path, provider);

  @override
  onSubscribe() {
    subscriptionCount++;
    checkSubscriptionNeeded();
  }

  @override
  onUnsubscribe() {
    subscriptionCount--;
    checkSubscriptionNeeded();
  }

  checkSubscriptionNeeded() {
    if (subscriptionCount <= 0) {
      subscriptionCount = 0;
      onValueUnsubscribe();
    } else {
      onValueSubscribe();
    }
  }

  subscriptionCount:number = 0;
}

/// Represents a Simple Callback Function
typedef void SimpleCallback();

/// Represents a function that is called when a child node has changed.
export type ChildChangedCallback = (name: string, node: Node) => void;

/// Represents a function that is called on a node when a child is loading.
export type LoadChildCallback = (
    name: string, data: object, provider: SimpleNodeProvider) => SimpleNode;

export type ResolveNodeHandler = (node: CallbackNode) => Future;

export class ResolvingNodeProvider  extends SimpleNodeProvider {
  handler: ResolveNodeHandler;

  ResolvingNodeProvider([defaultNodes: {[key: string]: dynamic}, {[key: string]: NodeFactory} profiles]) :
        super(defaultNodes, profiles);

  @override
  getNode(path: string, {onLoaded: Completer<CallbackNode>, boolean forceHandle: false}):LocalNode {
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

    Completer c = new Completer();
    CallbackNode n = new CallbackNode(path, provider: this);
    n.onLoadedCompleter = c;
    isListReady: boolean = false;
    n.isListReady = () => isListReady;
    handler(n).then((m) {
      if (!m) {
        isListReady = true;
        let ts: string = ValueUpdate.getTs();
        n.getDisconnectedStatus = () => ts;
        n.listChangeController.add(r"$is");

        if (onLoaded != null && !onLoaded.isCompleted) {
          onLoaded.complete(n);
        }

        if (c != null && !c.isCompleted) {
          c.complete();
        }

        return;
      }
      isListReady = true;
      n.listChangeController.add(r"$is");
      if (onLoaded != null && !onLoaded.isCompleted) {
        onLoaded.complete(n);
      }

      if (c != null && !c.isCompleted) {
        c.complete();
      }
    }).catchError((e, stack) {
      isListReady = true;
      let ts: string = ValueUpdate.getTs();
      n.getDisconnectedStatus = () => ts;
      n.listChangeController.add(r"$is");

      if (c != null && !c.isCompleted) {
        c.completeError(e, stack);
      }
    });
    return n;
  }

  @override
  addNode(path: string, object m):SimpleNode {
    if (path == '/' || !path.startsWith('/')) return null;

    Path p = new Path(path);
    pnode: SimpleNode = getNode(p.parentPath);

    node: SimpleNode;

    if (pnode != null) {
      node = pnode.onLoadChild(p.name, m, this);
    }

    if (node == null) {
      let profile: string = m[r'$is'];
      if (profileMap.containsKey(profile)) {
        node = profileMap[profile](path);
      } else {
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

  @override
  LocalNode getOrCreateNode(path: string, [addToTree: boolean = true, init: boolean = true]) => getNode(path);
}

/// A Simple Node which delegates all basic methods to given functions.
export class CallbackNode  extends SimpleNode implements WaitForMe {
  onCreatedCallback: SimpleCallback;
  onRemovingCallback: SimpleCallback;
  onChildAddedCallback: ChildChangedCallback;
  onChildRemovedCallback: ChildChangedCallback;
  onActionInvoke: ActionFunction;
  onLoadChildCallback: LoadChildCallback;
  onSubscribeCallback: SimpleCallback;
  onUnsubscribeCallback: SimpleCallback;
  isListReady: Producer<boolean>;
  getDisconnectedStatus: Producer<string>;
  onAllListCancelCallback: SimpleCallback;
  onListStartListen: SimpleCallback;
  onLoadedCompleter: Completer;
  onValueSetCallback: ValueUpdateCallback<boolean>;

  CallbackNode(path: string,
      {provider: SimpleNodeProvider,
        this.onActionInvoke,
      let onChildAdded: ChildChangedCallback,
      let onChildRemoved: ChildChangedCallback,
      let onCreated: SimpleCallback,
      let onRemoving: SimpleCallback,
      let onLoadChild: LoadChildCallback,
      let onSubscribe: SimpleCallback,
      let onValueSet: ValueCallback<boolean>,
      SimpleCallback onUnsubscribe})
      : onChildAddedCallback = onChildAdded,
        onChildRemovedCallback = onChildRemoved,
        onCreatedCallback = onCreated,
        onRemovingCallback = onRemoving,
        onLoadChildCallback = onLoadChild,
        onSubscribeCallback = onSubscribe,
        onUnsubscribeCallback = onUnsubscribe,
        onValueSetCallback = onValueSet,
        super(path, provider);

  @override
  onInvoke(params: {[key: string]: dynamic}) {
    if (onActionInvoke != null) {
      return onActionInvoke(params);
    } else {
      return super.onInvoke(params);
    }
  }

  @override
  onCreated() {
    if (onCreatedCallback != null) {
      onCreatedCallback();
    }
  }

  @override
  onRemoving() {
    if (onRemovingCallback != null) {
      onRemovingCallback();
    }
  }

  @override
  onChildAdded(name: string, node: Node) {
    if (onChildAddedCallback != null) {
      onChildAddedCallback(name, node);
    }
  }

  @override
  onChildRemoved(name: string, node: Node) {
    if (onChildRemovedCallback != null) {
      onChildRemovedCallback(name, node);
    }
  }

  @override
  onLoadChild(name: string, data: object, provider: SimpleNodeProvider):SimpleNode {
    if (onLoadChildCallback != null) {
      return onLoadChildCallback(name, data, provider);
    } else {
      return super.onLoadChild(name, data, provider);
    }
  }

  @override
  onSubscribe() {
    if (onSubscribeCallback != null) {
      return onSubscribeCallback();
    }
  }

  @override
  get onLoaded(): Future {
    if (onLoadedCompleter != null) {
      return onLoadedCompleter.future;
    } else {
      return new Future.sync(() => null);
    }
  }

  @override
  onUnsubscribe() {
    if (onUnsubscribeCallback != null) {
      return onUnsubscribeCallback();
    }
  }

  @override
  get listReady(): boolean {
    if (isListReady != null) {
      return isListReady();
    } else {
      return true;
    }
  }

  @override
  get disconnected(): string {
    if (getDisconnectedStatus != null) {
      return getDisconnectedStatus();
    } else {
      return null;
    }
  }

  @override
  onStartListListen() {
    if (onListStartListen != null) {
      onListStartListen();
    }
    super.onStartListListen();
  }

  @override
  onAllListCancel() {
    if (onAllListCancelCallback != null) {
      onAllListCancelCallback();
    }
    super.onAllListCancel();
  }

  @override
  onSetValue(value) {
    if (onValueSetCallback != null) {
      return onValueSetCallback(value);
    }
    return super.onSetValue(value);
  }
}

export class NodeNamer  {
  static readonly string[] BANNED_CHARS = [
    r"%",
    r".",
    r"/",
    r"\",
    r"?",
    r"*",
    r":",
    r"|",
    r"<",
    r">",
    r"$",
    r"@",
    r'"',
    r"'"
  ];

  static createName(input: string):string {
    var out = new StringBuffer();
    cu(string n) => const Utf8Encoder().convert(n)[0];
    mainLoop: for (var i = 0; i < input.length; i++) {
      let char: string = input[i];

      if (char == "%" && (i + 1 < input.length)) {
        let hexA: string = input[i + 1].toUpperCase();
        if ((cu(hexA) >= cu("0") && cu(hexA) <= cu("9")) ||
            (cu(hexA) >= cu("A") && cu(hexA) <= cu("F"))
          ) {
          if (i + 2 < input.length) {
            let hexB: string = input[i + 2].toUpperCase();
            if ((cu(hexB) > cu("0") && cu(hexB) <= cu("9")) ||
                (cu(hexB) >= cu("A") && cu(hexB) <= cu("F"))
            ) {
              i += 2;
              out.write("%");
              out.write(hexA);
              out.write(hexB);
              continue;
            } else {
              ++i;
              out.write("%${hexA}");
              continue;
            }
          }
        }
      }

      for (string bannedChar in BANNED_CHARS) {
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

  static decodeName(input: string):string {
    var out = new StringBuffer();
    cu(string n) => const Utf8Encoder().convert(n)[0];
    mainLoop: for (var i = 0; i < input.length; i++) {
      let char: string = input[i];

      if (char == "%") {
        let hexA: string = input[i + 1];
        if ((cu(hexA) >= cu("0") && cu(hexA) <= cu("9")) ||
            (cu(hexA) >= cu("A") && cu(hexA) <= cu("F"))
        ) {
          string s = hexA;

          if (i + 2 < input.length) {
            let hexB: string = input[i + 2];
            if ((cu(hexB) > cu("0") && cu(hexB) <= cu("9")) ||
                (cu(hexB) >= cu("A") && cu(hexB) <= cu("F"))
            ) {
              ++i;
              s += hexB;
            }
          }

          int c = int.parse(s, radix: 16);
          out.writeCharCode(c);
          i++;
          continue;
        }
      }

      out.write(char);
    }

    return out.toString();
  }

  static joinWithGoodName(string p, name: string):string {
    return new Path(p).child(NodeNamer.createName(name)).path;
  }
}

/// Main DSLink API for Browsers
library dslink.browser;

import "dart:async";
import "dart:html";

import "dart:typed_data";

import "package:dslink/requester.dart";
import "package:dslink/responder.dart";
import "package:dslink/browser_client.dart";
import "package:dslink/common.dart";

import "package:dslink/src/crypto/pk.dart";
import "package:dslink/utils.dart";

export "package:dslink/common.dart";
export "package:dslink/requester.dart";
export "package:dslink/responder.dart";
export "package:dslink/browser_client.dart";
export "package:dslink/utils.dart"
    show
        Scheduler,
        Interval,
        DSLinkJSON,
        updateLogLevel,
        buildEnumType,
        buildActionIO,
        ByteDataUtil;
export "package:dslink/src/crypto/pk.dart" show PrivateKey;

/// DSLink Provider for the Browser
export class LinkProvider  {
  link: BrowserECDHLink;
  defaultNodes: {[key: string]: dynamic};
  profiles: {[key: string]: NodeFactory};
  loadNodes: boolean;
  provider: NodeProvider;
  dataStore: DataStorage;
  privateKey: PrivateKey;
  brokerUrl: string;
  prefix: string;
  isRequester: boolean;
  isResponder: boolean;
  token: string;

  LinkProvider(this.brokerUrl, this.prefix,
      {this.defaultNodes,
      this.profiles,
      this.provider,
      this.dataStore,
      this.loadNodes: false,
      this.isRequester: true,
      this.isResponder: true,
      this.token}) {
    if (dataStore == null) {
      dataStore = LocalDataStorage.INSTANCE;
    }
  }

  _initCalled: boolean = false;

  Future init() async {
    if ( this._initCalled) {
      return;
    }

    _initCalled = true;

    if (provider == null) {
      provider = new SimpleNodeProvider(null, profiles);
      (provider as SimpleNodeProvider).setPersistFunction(save);
    }

    if (loadNodes && provider instanceof SerializableNodeProvider ) {
      if (!(await dataStore.has("dsa_nodes"))) {
        (provider as SerializableNodeProvider).init(defaultNodes);
      } else {
        var decoded = DsJson.decode(await dataStore.get("dsa_nodes"));

        if (decoded is {[key: string]: dynamic}) {
          (provider as SerializableNodeProvider).init(decoded);
        }
      }
    } else {
      (provider as SerializableNodeProvider).init(defaultNodes);
    }

    // move the waiting part of init into a later frame
    // we need to make sure provider is created at the first frame
    // not affected by any async code
    await initLinkWithPrivateKey();
  }

  Future initLinkWithPrivateKey() async {
    privateKey = await getPrivateKey(storage: dataStore);
    link = new BrowserECDHLink(brokerUrl, prefix, privateKey,
        nodeProvider: provider,
        isRequester: isRequester,
        isResponder: isResponder,
        token:token);

  }

  Future resetSavedNodes() async {
    await dataStore.remove("dsa_nodes");
  }

  onValueChange(path: string, {int cacheLevel: 1}):Stream<ValueUpdate> {
    listener: RespSubscribeListener;
    controller: StreamController<ValueUpdate>;
    subs:number = 0;
    controller = new StreamController<ValueUpdate>.broadcast(onListen: () {
      subs++;
      if (listener == null) {
        listener = this[path].subscribe((update: ValueUpdate) {
          controller.add(update);
        }, cacheLevel);
      }
    }, onCancel: () {
      subs--;
      if (subs == 0) {
        listener.cancel();
        listener = null;
      }
    });
    return controller.stream;
  }

  Future save() async {
    if ( !(provider instanceof SerializableNodeProvider) ) {
      return;
    }

    await dataStore.store("dsa_nodes",
      DsJson.encode(
        (provider as SerializableNodeProvider).save()
      )
    );
  }

  /// Remote Path of Responder
  //string get remotePath => link.remotePath;

  syncValue(path: string) {
    var n = this[path];
    n.updateValue(n.lastValueUpdate.value, force: true);
  }

  connect():Future {
    run():Future {
      link.connect();
      return link.onConnected;
    }

    if (!_initCalled) {
      return init().then((_) => run());
    } else {
      return run();
    }
  }

  close() {
    if (link != null) {
      link.close();
      link = null;
    }
  }

  getNode(path: string):LocalNode {
    return provider.getNode(path);
  }

  addNode(path: string, object m):LocalNode {
    if ( !(provider instanceof MutableNodeProvider) ) {
      throw new Exception("Unable to Modify Node Provider: It is not mutable.");
    }
    return (provider as MutableNodeProvider).addNode(path, m);
  }

  removeNode(path: string) {
    if ( !(provider instanceof MutableNodeProvider) ) {
      throw new Exception("Unable to Modify Node Provider: It is not mutable.");
    }
    (provider as MutableNodeProvider).removeNode(path);
  }

  updateValue(path: string, dynamic value) {
    if ( !(provider instanceof MutableNodeProvider) ) {
      throw new Exception("Unable to Modify Node Provider: It is not mutable.");
    }
    (provider as MutableNodeProvider).updateValue(path, value);
  }

  dynamic val(path: string, [value = unspecified]) {
    if ( value instanceof Unspecified ) {
      return this[path].lastValueUpdate.value;
    } else {
      updateValue(path, value);
      return value;
    }
  }

  LocalNode operator [](path: string) => provider[path];

  Requester get requester => link.requester;

  Future<Requester> get onRequesterReady => link.onRequesterReady;

  LocalNode operator ~() => this["/"];
}

export class BrowserUtils  {
  static Future<string> fetchBrokerUrlFromPath(
      let path: string, otherwise: string) async {
    try {
      return (await HttpRequest.getString(path)).trim();
    } catch (e) {
      return otherwise;
    }
  }

  static createBinaryUrl(input: ByteData,
      {string type: "application/octet-stream"}):string {
    data: Uint8List = ByteDataUtil.toUint8List(input);
    return "data:${type};base64,${Base64.encode(data)}";
  }
}

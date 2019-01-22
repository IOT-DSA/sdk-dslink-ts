// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"ZvoB":[function(require,module,exports) {
"use strict";

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const base64_js_1 = __importDefault(require("base64-js"));

class Base64 {
  static encodeString(content) {
    return Base64.encode(new Buffer(content));
  }

  static decodeString(input) {
    return Buffer.from(Base64.decode(input)).toString();
  }

  static encode(bytes) {
    // url safe encode
    return base64_js_1.default.fromByteArray(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  static decode(input) {
    if (input.length % 4 !== 0) {
      // add padding to url safe string;
      input = input.padEnd((input.length >> 2) + 1 << 2, '=');
    }

    return base64_js_1.default.toByteArray(input);
  }

}

exports.default = Base64;
},{}],"TRmg":[function(require,module,exports) {
"use strict";

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const msgpack_lite_1 = __importDefault(require("msgpack-lite"));

const base64_1 = __importDefault(require("./base64"));

function toBuffer(val) {
  if (val instanceof Buffer) {
    return val;
  } else {
    return Buffer.from(val);
  }
}

exports.toBuffer = toBuffer;

class DsCodec {
  static register(name, codec) {
    if (name != null && codec != null) {
      DsCodec._codecs[name] = codec;
    }
  }

  static getCodec(name) {
    let rslt = DsCodec._codecs[name];

    if (rslt == null) {
      return DsCodec.defaultCodec;
    }

    return rslt;
  }

  get blankData() {
    if (this._blankData == null) {
      this._blankData = this.encodeFrame({});
    }

    return this._blankData;
  }

}

exports.DsCodec = DsCodec;

class DsJson {
  static encode(val, pretty = false) {
    return this.instance.encodeJson(val, pretty);
  }

  static decode(str) {
    return this.instance.decodeJson(str);
  }

}

exports.DsJson = DsJson;

class DsJsonCodecImpl extends DsCodec {
  static _safeEncoder(key, value) {
    if (typeof value === 'object') {
      if (Object.isExtensible(value)) {
        return value;
      }

      return null;
    } else {
      return value;
    }
  }

  decodeJson(str) {
    return JSON.parse(str);
  }

  encodeJson(val, pretty = false) {
    return JSON.stringify(val, DsJsonCodecImpl._safeEncoder, pretty ? 1 : undefined);
  }

  decodeBinaryFrame(bytes) {
    return this.decodeStringFrame(toBuffer(bytes).toString());
  }

  static reviver(key, value) {
    if (typeof value === 'string' && value.startsWith("\u001Bbytes:")) {
      try {
        return base64_1.default.decode(value.substring(7));
      } catch (err) {
        return null;
      }
    }

    return value;
  }

  static replacer(key, value) {
    if (value instanceof Uint8Array) {
      return `\u001Bbytes:${base64_1.default.encode(value)}`;
    }

    return value;
  }

  decodeStringFrame(str) {
    return JSON.parse(str, DsJsonCodecImpl.reviver);
  }

  encodeFrame(val) {
    return JSON.stringify(val, DsJsonCodecImpl.replacer);
  }

}

exports.DsJsonCodecImpl = DsJsonCodecImpl;
DsJson.instance = new DsJsonCodecImpl();

class DsMsgPackCodecImpl extends DsCodec {
  decodeBinaryFrame(bytes) {
    let result = msgpack_lite_1.default.decode(bytes);

    if (typeof result === 'object') {
      return result;
    }

    return {};
  }

  decodeStringFrame(input) {
    // not supported
    return {};
  }

  encodeFrame(val) {
    return msgpack_lite_1.default.encode(val);
  }

}

DsMsgPackCodecImpl.instance = new DsMsgPackCodecImpl();
exports.DsMsgPackCodecImpl = DsMsgPackCodecImpl;
DsCodec._codecs = {
  "json": DsJson.instance,
  "msgpack": DsMsgPackCodecImpl.instance
};
DsCodec.defaultCodec = DsJson.instance;
},{"./base64":"ZvoB"}],"N9NG":[function(require,module,exports) {
"use strict";

var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};

Object.defineProperty(exports, "__esModule", {
  value: true
});

const denque_1 = __importDefault(require("denque"));

const codec_1 = require("../utils/codec");

class ECDH {
  verifySalt(salt, hash) {
    return this.hashSalt(salt) == hash;
  }

}

exports.ECDH = ECDH;

class Connection {
  constructor() {
    this.codec = codec_1.DsCodec.defaultCodec;
    this.pendingAcks = new denque_1.default();
  }

  ack(ackId) {
    let findAckGroup;

    for (let i = 0; i < this.pendingAcks.length; ++i) {
      let ackGroup = this.pendingAcks.peekAt(i);

      if (ackGroup.ackId == ackId) {
        findAckGroup = ackGroup;
        break;
      } else if (ackGroup.ackId < ackId) {
        findAckGroup = ackGroup;
      }
    }

    if (findAckGroup != null) {
      let ts = new Date().getTime();

      do {
        let ackGroup = this.pendingAcks.shift();
        ackGroup.ackAll(ackId, ts);

        if (ackGroup == findAckGroup) {
          break;
        }
      } while (findAckGroup != null);
    }
  }

}

exports.Connection = Connection; /// generate message right before sending to get the latest update
/// return messages and the processors that need ack callback

class ProcessorResult {
  constructor(messages, processors) {
    this.messages = messages;
    this.processors = processors;
  }

}

exports.ProcessorResult = ProcessorResult;

class ConnectionAckGroup {
  constructor(ackId, startTime, processors) {
    this.ackId = ackId;
    this.startTime = startTime;
    this.processors = processors;
  }

  ackAll(ackid, time) {
    for (let processor of this.processors) {
      processor.ackReceived(this.ackId, this.startTime, time);
    }
  }

}

exports.ConnectionAckGroup = ConnectionAckGroup; /// Base Class for Links

class BaseLink {}

exports.BaseLink = BaseLink; /// Base Class for Server Link implementations.

class ServerLink extends BaseLink {}

exports.ServerLink = ServerLink; /// Base Class for Client Link implementations.

class ClientLink extends BaseLink {
  get logName() {
    return null;
  }

  formatLogMessage(msg) {
    if (this.logName != null) {
      return "[${logName}] ${msg}";
    }

    return msg;
  }

}

exports.ClientLink = ClientLink; /// DSA Stream Status

class StreamStatus {} /// Stream should be initialized.


StreamStatus.initialize = "initialize"; /// Stream is open.

StreamStatus.open = "open"; /// Stream is closed.

StreamStatus.closed = "closed";
exports.StreamStatus = StreamStatus;

class ErrorPhase {}

ErrorPhase.request = "request";
ErrorPhase.response = "response";
exports.ErrorPhase = ErrorPhase;

class DSError {
  constructor(type, options = {}) {
    this.type = type;
    this.msg = options.msg;
    this.detail = options.detail;
    this.path = options.path;

    if (options.phase) {
      this.phase = options.phase;
    } else {
      this.phase = ErrorPhase.response;
    }
  }

  static fromMap(m) {
    let error = new DSError('');

    if (typeof m["type"] === 'string') {
      error.type = m["type"];
    }

    if (typeof m["msg"] === 'string') {
      error.msg = m["msg"];
    }

    if (typeof m["path"] === 'string') {
      error.path = m["path"];
    }

    if (typeof m["phase"] === 'string') {
      error.phase = m["phase"];
    }

    if (typeof m["detail"] === 'string') {
      error.detail = m["detail"];
    }

    return error;
  }

  getMessage() {
    if (this.msg) {
      return this.msg;
    }

    if (this.type) {
      // TODO, return normal case instead of camel case
      return this.type;
    }

    return "Error";
  }

  serialize() {
    let rslt = {};

    if (this.msg != null) {
      rslt["msg"] = this.msg;
    }

    if (this.type != null) {
      rslt["type"] = this.type;
    }

    if (this.path != null) {
      rslt["path"] = this.path;
    }

    if (this.phase == ErrorPhase.request) {
      rslt["phase"] = ErrorPhase.request;
    }

    if (this.detail != null) {
      rslt["detail"] = this.detail;
    }

    return rslt;
  }

}

DSError.PERMISSION_DENIED = new DSError("permissionDenied");
DSError.INVALID_METHOD = new DSError("invalidMethod");
DSError.NOT_IMPLEMENTED = new DSError("notImplemented");
DSError.INVALID_PATH = new DSError("invalidPath");
DSError.INVALID_PATHS = new DSError("invalidPaths");
DSError.INVALID_VALUE = new DSError("invalidValue");
DSError.INVALID_PARAMETER = new DSError("invalidParameter");
DSError.DISCONNECTED = new DSError("disconnected", {
  phase: ErrorPhase.request
});
DSError.FAILED = new DSError("failed");
exports.DSError = DSError;

class Unspecified {}

exports.Unspecified = Unspecified; /// Marks something as being unspecified.

const unspecified = new Unspecified(); /// Unspecified means that something has never been set.
},{"../utils/codec":"TRmg"}],"bajV":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

class Stream {
  constructor(onStartListen, onAllCancel, onListen) {
    this._listeners = new Set();
    this._updating = false;
    this.isClosed = false;
    this._onStartListen = onStartListen;
    this._onAllCancel = onAllCancel;
    this._onListen = onListen;
  }

  listen(listener) {
    this._listeners.add(listener);

    if (this._onStartListen && this._listeners.size === 1) {
      this._onStartListen();
    }

    if (this._onListen) {
      this._onListen(listener);
    }

    if (this._value !== undefined && !this._updating) {
      // skip extra update if it's already in updating iteration
      listener(this._value);
    }

    return new StreamSubscription(this, listener);
  }

  unlisten(listener) {
    this._listeners.delete(listener);

    if (this._onAllCancel && this._listeners.size === 0) {
      this._onAllCancel();
    }
  }

  add(val) {
    if (this.isClosed) {
      return false;
    }

    this._value = val;

    this._dispatch();

    return true;
  }

  _dispatch() {
    this._updating = true;

    for (let listener of this._listeners) {
      listener(this._value);
    }

    this._updating = false;
  }

  close() {
    if (!this.isClosed) {
      this.isClosed = true;

      this._listeners.clear();

      if (this._onClose) {
        this._onClose();
      }
    }
  }

}

exports.Stream = Stream;

class StreamSubscription {
  constructor(stream, listener) {
    this._stream = stream;
    this._listener = listener;
  }

  close() {
    if (this._stream && this._listener) {
      this._stream.unlisten(this._listener);

      this._stream = null;
      this._listener = null;
    }
  }

}

exports.StreamSubscription = StreamSubscription;

class Completer {
  constructor() {
    this.isCompleted = false;
    this.future = new Promise((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }

  complete(val) {
    if (this._resolve) {
      this._resolve(val);
    }

    this.isCompleted = true;
  }

  completeError(val) {
    if (this._reject) {
      this._reject(val);
    }
  }

}

exports.Completer = Completer;
},{}],"wg7F":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const interfaces_1 = require("../common/interfaces");

class Request {
  constructor(requester, rid, updater, data) {
    this._isClosed = false;
    this.streamStatus = interfaces_1.StreamStatus.initialize;
    this.requester = requester;
    this.rid = rid;
    this.updater = updater;
    this.data = data;
  }

  get isClosed() {
    return this._isClosed;
  } /// resend the data if previous sending failed


  resend() {
    this.requester.addToSendList(this.data);
  }

  addReqParams(m) {
    this.requester.addToSendList({
      'rid': this.rid,
      'params': m
    });
  }

  _update(m) {
    if (typeof m["stream"] === 'string') {
      this.streamStatus = m["stream"];
    }

    let updates;
    let columns;
    let meta;

    if (Array.isArray(m["updates"])) {
      updates = m["updates"];
    }

    if (Array.isArray(m["columns"])) {
      columns = m["columns"];
    }

    if (m["meta"] instanceof Object) {
      meta = m["meta"];
    } // remove the request from global object


    if (this.streamStatus == interfaces_1.StreamStatus.closed) {
      this.requester._requests.delete(this.rid);
    }

    let error;

    if (m.hasOwnProperty("error") && m["error"] instanceof Object) {
      error = interfaces_1.DSError.fromMap(m["error"]);
      this.requester.onError.add(error);
    }

    this.updater.onUpdate(this.streamStatus, updates, columns, meta, error);
  } /// close the request and finish data


  _close(error) {
    if (this.streamStatus != interfaces_1.StreamStatus.closed) {
      this.streamStatus = interfaces_1.StreamStatus.closed;
      this.updater.onUpdate(interfaces_1.StreamStatus.closed, null, null, null, error);
    }
  } /// close the request from the client side


  close() {
    // _close will also be called later from the requester;
    this.requester.closeRequest(this);
  }

}

exports.Request = Request;
},{"../common/interfaces":"N9NG"}],"lXIX":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const interfaces_1 = require("./interfaces");

exports.ACK_WAIT_COUNT = 16;
exports.defaultCacheSize = 256;

class ConnectionHandler {
  constructor() {
    this._toSendList = [];
    this._processors = [];
    this._pendingSend = false;
  }

  get connection() {
    return this._conn;
  }

  set connection(conn) {
    if (this._connListener != null) {
      this._connListener.close();

      this._connListener = null;

      this._onDisconnected(this._conn);
    }

    this._conn = conn;
    this._connListener = this._conn.onReceive.listen(this.onData);

    this._conn.onDisconnected.then(conn => this._onDisconnected(conn)); // resend all requests after a connection


    if (this._conn.connected) {
      this.onReconnected();
    } else {
      this._conn.onConnected.then(conn => this.onReconnected());
    }
  }

  _onDisconnected(conn) {
    if (this._conn === conn) {
      if (this._connListener != null) {
        this._connListener.close();

        this._connListener = null;
      }

      this.onDisconnected();
      this._conn = null;
    }
  }

  onReconnected() {
    if (this._pendingSend) {
      this._conn.sendWhenReady(this);
    }
  }

  addToSendList(m) {
    this._toSendList.push(m);

    if (!this._pendingSend) {
      if (this._conn != null) {
        this._conn.sendWhenReady(this);
      }

      this._pendingSend = true;
    }
  } /// a processor function that's called just before the data is sent
  /// same processor won't be added to the list twice
  /// inside processor, send() data that only need to appear once per data frame


  addProcessor(processor) {
    this._processors.push(processor);

    if (!this._pendingSend) {
      if (this._conn != null) {
        this._conn.sendWhenReady(this);
      }

      this._pendingSend = true;
    }
  } /// gather all the changes from


  getSendingData(currentTime, waitingAckId) {
    this._pendingSend = false;
    let processors = this._processors;
    this._processors = [];

    for (let proc of processors) {
      proc.startSendingData(currentTime, waitingAckId);
    }

    let rslt = this._toSendList;
    this._toSendList = [];
    return new interfaces_1.ProcessorResult(rslt, processors);
  }

  clearProcessors() {
    this._processors.length = 0;
    this._pendingSend = false;
  }

}

exports.ConnectionHandler = ConnectionHandler;
},{"./interfaces":"N9NG"}],"QClj":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
}); /// Base Class for any and all nodes in the SDK.
/// If you are writing a link, please look at the [dslink.responder.SimpleNode] class.

class Node {
  constructor() {
    /// Node Attributes
    this.attributes = new Map(); /// Node Configs

    this.configs = new Map(); /// Node Children
    /// object of Child Name to Child Node

    this.children = new Map();
    this.configs.set('$is', 'node');
  }

  static getDisplayName(nameOrPath) {
    if (nameOrPath.includes('/')) {
      let names = nameOrPath.split('/');
      nameOrPath = names.pop();

      while (nameOrPath === '' && names.length) {
        nameOrPath = names.pop();
      }
    }

    if (nameOrPath.includes('%')) {
      nameOrPath = decodeURIComponent(nameOrPath);
    }

    return nameOrPath;
  } /// same as attributes for local node
  /// but different on remote node


  getOverideAttributes(attr) {
    return this.attributes.get(attr);
  } /// Get an Attribute


  getAttribute(name) {
    if (this.attributes.has(name)) {
      return this.attributes.get(name);
    }

    if (this.profile != null && this.profile.attributes.has(name)) {
      return this.profile.attributes.get(name);
    }

    return null;
  } /// Get a Config


  getConfig(name) {
    if (this.configs.has(name)) {
      return this.configs.get(name);
    }

    if (this.profile != null && this.profile.configs.has(name)) {
      return this.profile.configs.get(name);
    }

    return null;
  } /// Adds a child to this node.


  addChild(name, node) {
    this.children.set(name, node);
  } /// Remove a child from this node.
  /// [input] can be either an instance of [Node] or a [string].


  removeChild(input) {
    this.children.delete(input);
  } /// Get a Child Node


  getChild(name) {
    if (this.children.has(name)) {
      return this.children.get(name);
    }

    if (this.profile != null && this.profile.children.has(name)) {
      return this.profile.children.get(name);
    }

    return null;
  } /// Get a property of this node.
  /// If [name] starts with '$', this will fetch a config.
  /// If [name] starts with a '@', this will fetch an attribute.
  /// Otherwise this will fetch a child.


  get(name) {
    if (name.startsWith('$')) {
      return this.getConfig(name);
    }

    if (name.startsWith('@')) {
      return this.getAttribute(name);
    }

    return this.getChild(name);
  } /// Iterates over all the children of this node and passes them to the specified [callback].


  forEachChild(callback) {
    for (let [name, node] of this.children) {
      callback(name, node);
    }

    if (this.profile != null) {
      for (let [name, node] of this.profile.children) {
        if (!this.children.has(name)) {
          callback(name, node);
        }
      }
    }
  }

  forEachConfig(callback) {
    for (let [name, val] of this.configs) {
      callback(name, val);
    }

    if (this.profile != null) {
      for (let [name, val] of this.profile.configs) {
        if (!this.children.has(name)) {
          callback(name, val);
        }
      }
    }
  }

  forEachAttribute(callback) {
    for (let [name, val] of this.attributes) {
      callback(name, val);
    }

    if (this.profile != null) {
      for (let [name, val] of this.profile.attributes) {
        if (!this.children.has(name)) {
          callback(name, val);
        }
      }
    }
  } /// Gets a map for the data that will be listed in the parent node's children property.


  getSimpleMap() {
    var rslt = {};

    if (this.configs.has('$is')) {
      rslt['$is'] = this.configs.get('$is');
    }

    if (this.configs.has('$type')) {
      rslt['$type'] = this.configs.get('$type');
    }

    if (this.configs.has('$name')) {
      rslt['$name'] = this.configs.get('$name');
    }

    if (this.configs.has('$invokable')) {
      rslt['$invokable'] = this.configs.get('$invokable');
    }

    if (this.configs.has('$writable')) {
      rslt['$writable'] = this.configs.get('$writable');
    }

    if (this.configs.has('$params')) {
      rslt['$params'] = this.configs.get('$params');
    }

    if (this.configs.has('$columns')) {
      rslt['$columns'] = this.configs.get('$columns');
    }

    if (this.configs.has('$result')) {
      rslt['$result'] = this.configs.get('$result');
    }

    return rslt;
  }

}

exports.Node = Node; /// Utility class for node and config/attribute paths.

class Path {
  constructor(path) {
    /// If this path is invalid, this will be false. Otherwise this will be true.
    this.valid = true;
    this.path = path;

    this._parse();
  }

  static escapeName(str) {
    if (Path.invalidNameChar.test(str)) {
      return encodeURIComponent(str);
    }

    return str;
  }

  static getValidPath(path, basePath) {
    if (typeof path === 'string') {
      let p = new Path(path);

      if (p.valid) {
        p.mergeBasePath(basePath);
        return p;
      }
    }

    return null;
  }

  static getValidNodePath(path, basePath) {
    if (typeof path === 'string') {
      let p = new Path(path);

      if (p.valid && p.isNode) {
        p.mergeBasePath(basePath);
        return p;
      }
    }

    return null;
  }

  static getValidAttributePath(path, basePath) {
    if (typeof path === 'string') {
      let p = new Path(path);

      if (p.valid && p.isAttribute) {
        p.mergeBasePath(basePath);
        return p;
      }
    }

    return null;
  }

  static getValidConfigPath(path, basePath) {
    if (typeof path === 'string') {
      let p = new Path(path);

      if (p.valid && p.isConfig) {
        p.mergeBasePath(basePath);
        return p;
      }
    }

    return null;
  } /// Get the parent of this path.


  get parent() {
    return new Path(this.parentPath);
  } /// Get a child of this path.


  child(name) {
    return new Path((this.path.endsWith("/") ? this.path.substring(0, this.path.length - 1) : this.path) + "/" + (name.startsWith("/") ? name.substring(1) : name));
  }

  _parse() {
    if (this.path == '' || Path.invalidChar.test(this.path) || this.path.includes('//')) {
      this.valid = false;
    }

    if (this.path == '/') {
      this.valid = true;
      this.name = '/';
      this.parentPath = '';
      return;
    }

    if (this.path.endsWith('/')) {
      this.path = this.path.substring(0, this.path.length - 1);
    }

    let pos = this.path.lastIndexOf('/');

    if (pos < 0) {
      this.name = this.path;
      this.parentPath = '';
    } else if (pos == 0) {
      this.parentPath = '/';
      this.name = this.path.substring(1);
    } else {
      this.parentPath = this.path.substring(0, pos);
      this.name = this.path.substring(pos + 1);

      if (this.parentPath.includes('/$') || this.parentPath.includes('/@')) {
        // parent path can't be attribute or config
        this.valid = false;
      }
    }
  } /// Is this an absolute path?


  get isAbsolute() {
    return this.name == '/' || this.parentPath.startsWith('/');
  } /// Is this the root path?


  get isRoot() {
    return this.name == '/';
  } /// Is this a config?


  get isConfig() {
    return this.name.startsWith('$');
  } /// Is this an attribute?


  get isAttribute() {
    return this.name.startsWith('@');
  } /// Is this a node?


  get isNode() {
    return !this.name.startsWith('@') && !this.name.startsWith('$');
  } /// Merges the [base] path with this path.


  mergeBasePath(base, force = false) {
    if (base == null) {
      return;
    }

    if (!this.isAbsolute) {
      if (this.parentPath == '') {
        this.parentPath = base;
      } else {
        this.parentPath = '$base/$parentPath';
      }

      this.path = '$parentPath/$name';
    } else if (force) {
      // apply base path on a absolute path
      if (name == '') {
        // map the root path
        this.path = base;

        this._parse();
      } else {
        this.parentPath = '$base$parentPath';
        this.path = '$parentPath/$name';
      }
    }
  }

} /// Regular Expression for invalid characters in paths.


Path.invalidChar = /[\\\?\*|"<>:]/; /// Regular Expression for invalid characters in names.

Path.invalidNameChar = /[\/\\\?\*|"<>:]/;
exports.Path = Path;
},{}],"Re02":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const TIME_ZONE = function () {
  let timeZoneOffset = new Date().getTimezoneOffset();
  let s = "+";

  if (timeZoneOffset < 0) {
    timeZoneOffset = -timeZoneOffset;
    s = "-";
  }

  let hhstr = `${timeZoneOffset / 60 | 0}`.padStart(2, '0');
  let mmstr = `${timeZoneOffset % 60}`.padStart(2, '0');
  return `${s}${hhstr}:${mmstr}`;
}(); /// Represents an update to a value subscription.


class ValueUpdate {
  constructor(value, ts, options) {
    /// The id of the ack we are waiting for.
    this.waitingAck = -1; /// How many updates have happened since the last response.

    this.count = 1;
    this._cloned = false;
    this.value = value;

    if (ts) {
      this.ts = ts;
    } else {
      this.ts = ValueUpdate.getTs();
    }

    if (options) {
      if (options.status) {
        this.status = options.status;
      }

      if (options.count) {
        this.count = options.count;
      }
    }

    this.created = new Date();
  } /// Generates a timestamp in the proper DSA format.


  static getTs() {
    let d = new Date();

    if (d.getTime() === this._lastTs) {
      return this._lastTsStr;
    }

    ValueUpdate._lastTs = d.getTime();
    let offsetISOStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
    ValueUpdate._lastTsStr = `${offsetISOStr.slice(0, -1)}${TIME_ZONE}`;
    return this._lastTsStr;
  } /// Gets a [DateTime] representation of the timestamp for this value.


  get timestamp() {
    if (this._timestamp == null) {
      this._timestamp = new Date(this.ts);
    }

    return this._timestamp;
  }

  static merge(oldUpdate, newUpdate) {
    let newValue = new ValueUpdate(null);
    newValue.value = newUpdate.value;
    newValue.ts = newUpdate.ts;
    newValue.status = newUpdate.status;
    newValue.count = oldUpdate.count + newUpdate.count;
    newValue.created = newUpdate.created;
    return newValue;
  } /// Calculates the latency


  get latency() {
    if (!this._latency) {
      this._latency = this.timestamp.getTime() - this.created.getTime();
    }

    return this._latency;
  } /// merge the new update into existing instance


  mergeAdd(newUpdate) {
    this.value = newUpdate.value;
    this.ts = newUpdate.ts;
    this.status = newUpdate.status;
    this.count += newUpdate.count;
  }

  equals(other) {
    if (Array.isArray(this.value)) {
      // assume List is same if it's generated at same timestamp
      if (!Array.isArray(other.value)) {
        return false;
      }
    } else if (this.value != null && this.value instanceof Object) {
      // assume object is same if it's generated at same timestamp
      if (!(other.value instanceof Object)) {
        return false;
      }
    } else if (!Object.is(this.value, other.value)) {
      return false;
    }

    return other.ts === this.ts && other.count === this.count;
  } /// Generates a map representation of this value update.


  toMap() {
    let m = {
      "ts": this.ts,
      "value": this.value
    };

    if (this.count != 1) {
      m["count"] = this.count;
    }

    return m;
  }

  cloneForAckQueue() {
    if (!this._cloned) {
      this._cloned = true;
      return this;
    }

    return new ValueUpdate(this.value, this.ts, {
      status: this.status,
      count: this.count
    });
  }

}

ValueUpdate._lastTs = 0;
exports.ValueUpdate = ValueUpdate;
},{}],"wq45":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

class RequesterUpdate {
  constructor(streamStatus) {
    this.streamStatus = streamStatus;
  }

}

exports.RequesterUpdate = RequesterUpdate;
},{}],"duux":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const async_1 = require("../../utils/async");

const interfaces_1 = require("../../common/interfaces");

const node_cache_1 = require("../node_cache");

const value_1 = require("../../common/value");

const interface_1 = require("../interface");

class RequesterListUpdate extends interface_1.RequesterUpdate {
  constructor(node, changes, streamStatus) {
    super(streamStatus);
    this.node = node;
    this.changes = changes;
  }

}

exports.RequesterListUpdate = RequesterListUpdate;

class ListDefListener {
  constructor(node, requester, callback) {
    this.ready = false;
    this.node = node;
    this.requester = requester;
    this.listener = requester.list(node.remotePath, update => {
      this.ready = update.streamStatus !== interfaces_1.StreamStatus.initialize;
      callback(update);
    });
  }

  close() {
    this.listener.close();
  }

}

exports.ListDefListener = ListDefListener;

class ListController {
  constructor(node, requester) {
    this.changes = new Set();
    this._ready = true;
    this._pendingRemoveDef = false;

    this.onStartListen = () => {
      if (this.request == null && !this.waitToSend) {
        this.waitToSend = true;
        this.requester.addProcessor(this);
      }
    };

    this.waitToSend = false;

    this._onListen = callback => {
      if (this._ready && this.request != null) {
        setTimeout(() => {
          if (this.request == null) {
            return;
          }

          let changes = [];

          for (let [key, v] of this.node.configs) {
            changes.push(key);
          }

          for (let [key, v] of this.node.attributes) {
            changes.push(key);
          }

          for (let [key, v] of this.node.children) {
            changes.push(key);
          }

          let update = new RequesterListUpdate(this.node, changes, this.request.streamStatus);
          callback(update);
        }, 0);
      }
    };

    this._onAllCancel = () => {
      this._destroy();
    };

    this.node = node;
    this.requester = requester;
    this.stream = new async_1.Stream(this.onStartListen, this._onAllCancel, this._onListen);
  }

  get initialized() {
    return this.request != null && this.request.streamStatus !== interfaces_1.StreamStatus.initialize;
  }

  onDisconnect() {
    this.disconnectTs = value_1.ValueUpdate.getTs();
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

  onUpdate(streamStatus, updates, columns, meta, error) {
    let reseted = false; // TODO implement error handling

    if (updates != null) {
      for (let update of updates) {
        let name;
        let value;
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
          if (!reseted && (name === '$is' || name === '$base' || name === '$disconnectedTs' && typeof value === 'string')) {
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

      if (this.request.streamStatus !== interfaces_1.StreamStatus.initialize) {
        this.node.listed = true;
      }

      if (this._pendingRemoveDef) {
        this._checkRemoveDef();
      }

      this.onProfileUpdated();
    }
  }

  loadProfile(defName) {
    this._ready = true;
    let defPath = defName;

    if (!defPath.startsWith('/')) {
      let base = this.node.configs.get('$base');

      if (typeof base === 'string') {
        defPath = '$base/defs/profile/$defPath';
      } else {
        defPath = '/defs/profile/$defPath';
      }
    }

    if (this.node.profile instanceof node_cache_1.RemoteNode && this.node.profile.remotePath === defPath) {
      return;
    }

    this.node.profile = this.requester.nodeCache.getDefNode(defPath, defName);

    if (defName === 'node') {
      return;
    }

    if (this.node.profile instanceof node_cache_1.RemoteNode && !this.node.profile.listed) {
      this._ready = false;
      this._profileLoader = new ListDefListener(this.node.profile, this.requester, this._onProfileUpdate);
    }
  }

  _onProfileUpdate(update) {
    if (this._profileLoader == null) {
      //      logger.finest('warning, unexpected state of profile loading');
      return;
    }

    this._profileLoader.close();

    this._profileLoader = null;

    for (let change of update.changes) {
      if (!ListController._ignoreProfileProps.includes(change)) {
        this.changes.add(change);
      }
    }

    this._ready = true;
    this.onProfileUpdated();
  }

  onProfileUpdated() {
    if (this._ready) {
      if (this.request.streamStatus !== interfaces_1.StreamStatus.initialize) {
        this.stream.add(new RequesterListUpdate(this.node, Array.from(this.changes), this.request.streamStatus));
        this.changes.clear();
      }

      if (this.request.streamStatus === interfaces_1.StreamStatus.closed) {
        this.stream.close();
      }
    }
  }

  _checkRemoveDef() {
    this._pendingRemoveDef = false;
  }

  startSendingData(currentTime, waitingAckId) {
    if (!this.waitToSend) {
      return;
    }

    this.request = this.requester._sendRequest({
      'method': 'list',
      'path': this.node.remotePath
    }, this);
    this.waitToSend = false;
  }

  ackReceived(receiveAckId, startTime, currentTime) {}

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

ListController._ignoreProfileProps = ['$is', '$permission', '$settings'];
exports.ListController = ListController;
},{"../../utils/async":"bajV","../../common/interfaces":"N9NG","../node_cache":"jg7K","../../common/value":"Re02","../interface":"wq45"}],"YpSC":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const request_1 = require("../request");

const value_1 = require("../../common/value");

const connection_handler_1 = require("../../common/connection_handler");

class ReqSubscribeListener {
  constructor(requester, path, callback) {
    this.requester = requester;
    this.path = path;
    this.callback = callback;
  }

  close() {
    if (this.callback != null) {
      this.requester.unsubscribe(this.path, this.callback);
      this.callback = null;
    }
  }

}

exports.ReqSubscribeListener = ReqSubscribeListener; /// only a place holder for reconnect and disconnect
/// real logic is in SubscribeRequest itself

class SubscribeController {
  onDisconnect() {// TODO: implement onDisconnect
  }

  onReconnect() {// TODO: implement onReconnect
  }

  onUpdate(status, updates, columns, meta, error) {// do nothing
  }

}

exports.SubscribeController = SubscribeController;

class SubscribeRequest extends request_1.Request {
  constructor(requester, rid) {
    super(requester, rid, new SubscribeController(), null);
    this.lastSid = 0;
    this.subscriptions = new Map();
    this.subscriptionIds = new Map();
    this._changedPaths = new Set();
    this.toRemove = new Map();
    this._pendingSending = false;
    this._waitingAckCount = 0;
    this._lastWatingAckId = -1;
    this._sendingAfterAck = false;
    this.updater.request = this;
  }

  getNextSid() {
    do {
      if (this.lastSid < 0x7FFFFFFF) {
        ++this.lastSid;
      } else {
        this.lastSid = 1;
      }
    } while (this.subscriptionIds.has(this.lastSid));

    return this.lastSid;
  }

  resend() {
    this.prepareSending();
  }

  _close(error) {
    if (this.subscriptions.size > 0) {
      for (let [key, s] of this.subscriptions) {
        this._changedPaths.add(key);
      }
    }

    this._waitingAckCount = 0;
    this._lastWatingAckId = -1;
    this._sendingAfterAck = false;
  }

  _update(m) {
    let updates = m['updates'];

    if (Array.isArray(updates)) {
      for (let update of updates) {
        let path;
        let sid = -1;
        let value;
        let ts;
        let options;

        if (Array.isArray(update) && update.length > 2) {
          if (typeof update[0] === 'string') {
            path = update[0];
          } else if (typeof update[0] === 'number') {
            sid = update[0];
          } else {
            continue; // invalid response
          }

          value = update[1];
          ts = update[2];
        } else if (update != null && update instanceof Object) {
          if (typeof update['ts'] === 'string') {
            path = update['path'];
            ts = update['ts'];

            if (typeof update['path'] === 'string') {
              path = update['path'];
            } else if (typeof update['sid'] === 'number') {
              sid = update['sid'];
            } else {
              continue; // invalid response
            }
          }

          value = update['value'];
          options = update;
        } else {
          continue; // invalid response
        }

        let controller;

        if (path != null) {
          controller = this.subscriptions.get(path);
        } else if (sid > -1) {
          controller = this.subscriptionIds.get(sid);
        }

        if (controller != null) {
          let valueUpdate = new value_1.ValueUpdate(value, ts, options);
          controller.addValue(valueUpdate);
        }
      }
    }
  }

  addSubscription(controller, level) {
    let path = controller.node.remotePath;
    this.subscriptions.set(path, controller);
    this.subscriptionIds.set(controller.sid, controller);
    this.prepareSending();

    this._changedPaths.add(path);
  }

  removeSubscription(controller) {
    let path = controller.node.remotePath;

    if (this.subscriptions.has(path)) {
      this.toRemove.set(this.subscriptions.get(path).sid, this.subscriptions.get(path));
      this.prepareSending();
    } else if (this.subscriptionIds.has(controller.sid)) {
      console.error(`unexpected remoteSubscription in the requester, sid: ${controller.sid}`);
    }
  }

  startSendingData(currentTime, waitingAckId) {
    this._pendingSending = false;

    if (waitingAckId !== -1) {
      this._waitingAckCount++;
      this._lastWatingAckId = waitingAckId;
    }

    if (this.requester.connection == null) {
      return;
    }

    let toAdd = [];
    let processingPaths = this._changedPaths;
    this._changedPaths = new Set();

    for (let path of processingPaths) {
      if (this.subscriptions.has(path)) {
        let sub = this.subscriptions.get(path);
        let m = {
          'path': path,
          'sid': sub.sid
        };

        if (sub.currentQos > 0) {
          m['qos'] = sub.currentQos;
        }

        toAdd.push(m);
      }
    }

    if (toAdd.length > 0) {
      this.requester._sendRequest({
        'method': 'subscribe',
        'paths': toAdd
      }, null);
    }

    if (this.toRemove.size > 0) {
      let removeSids = [];

      for (let [sid, sub] of this.toRemove) {
        if (sub.callbacks.size === 0) {
          removeSids.push(sid);
          this.subscriptions.delete(sub.node.remotePath);
          this.subscriptionIds.delete(sub.sid);

          sub._destroy();
        }
      }

      this.requester._sendRequest({
        'method': 'unsubscribe',
        'sids': removeSids
      }, null);

      this.toRemove.clear();
    }
  }

  ackReceived(receiveAckId, startTime, currentTime) {
    if (receiveAckId === this._lastWatingAckId) {
      this._waitingAckCount = 0;
    } else {
      this._waitingAckCount--;
    }

    if (this._sendingAfterAck) {
      this._sendingAfterAck = false;
      this.prepareSending();
    }
  }

  prepareSending() {
    if (this._sendingAfterAck) {
      return;
    }

    if (this._waitingAckCount > connection_handler_1.ACK_WAIT_COUNT) {
      this._sendingAfterAck = true;
      return;
    }

    if (!this._pendingSending) {
      this._pendingSending = true;
      this.requester.addProcessor(this);
    }
  }

}

exports.SubscribeRequest = SubscribeRequest;

class ReqSubscribeController {
  constructor(node, requester) {
    this.callbacks = new Map();
    this.currentQos = -1;
    this.node = node;
    this.requester = requester;
    this.sid = requester._subscription.getNextSid();
  }

  listen(callback, qos) {
    if (qos < 0 || qos > 3) {
      qos = 0;
    }

    let qosChanged = false;

    if (this.callbacks.has(callback)) {
      this.callbacks.set(callback, qos);
      qosChanged = this.updateQos();
    } else {
      this.callbacks.set(callback, qos);

      if (qos > this.currentQos) {
        qosChanged = true;
        this.currentQos = qos;
      }

      if (this._lastUpdate != null) {
        callback(this._lastUpdate);
      }
    }

    if (qosChanged) {
      this.requester._subscription.addSubscription(this, this.currentQos);
    }
  }

  unlisten(callback) {
    if (this.callbacks.has(callback)) {
      let cacheLevel = this.callbacks.get(callback);
      this.callbacks.delete(callback);

      if (this.callbacks.size === 0) {
        this.requester._subscription.removeSubscription(this);
      } else if (cacheLevel === this.currentQos && this.currentQos > 1) {
        this.updateQos();
      }
    }
  }

  updateQos() {
    let maxQos = 0;

    for (let qos of this.callbacks.values()) {
      maxQos = qos > maxQos ? qos : maxQos;
    }

    if (maxQos !== this.currentQos) {
      this.currentQos = maxQos;
      return true;
    }

    return false;
  }

  addValue(update) {
    this._lastUpdate = update;

    for (let callback of Array.from(this.callbacks.keys())) {
      callback(this._lastUpdate);
    }
  }

  _destroy() {
    this.callbacks.clear();
    this.node._subscribeController = null;
  }

}

exports.ReqSubscribeController = ReqSubscribeController;
},{"../request":"wg7F","../../common/value":"Re02","../../common/connection_handler":"lXIX"}],"nCNP":[function(require,module,exports) {
"use strict"; // part of dslink.common;

Object.defineProperty(exports, "__esModule", {
  value: true
});

class Permission {
  static parse(obj, defaultVal = Permission.NEVER) {
    if (typeof obj === 'string' && Permission.nameParser.hasOwnProperty(obj)) {
      return Permission.nameParser[obj];
    }

    return defaultVal;
  }

} /// now allowed to do anything


Permission.NONE = 0; /// list node

Permission.LIST = 1; /// read node

Permission.READ = 2; /// write attribute and value

Permission.WRITE = 3; /// config the node

Permission.CONFIG = 4; /// something that can never happen

Permission.NEVER = 5;
Permission.names = ['none', 'list', 'read', 'write', 'config', 'never'];
Permission.nameParser = {
  'none': Permission.NONE,
  'list': Permission.LIST,
  'read': Permission.READ,
  'write': Permission.WRITE,
  'config': Permission.CONFIG,
  'never': Permission.NEVER
};
exports.Permission = Permission;

class PermissionList {
  constructor() {
    this.idMatchs = {};
    this.groupMatchs = {};
    this.defaultPermission = Permission.NONE;
    this._FORCE_CONFIG = true;
  }

  updatePermissions(data) {
    idMatchs.clear();
    groupMatchs.clear();
    defaultPermission = Permission.NONE;

    for (object; obj; of) data;

    {
      if (obj != null && obj instanceof Object) {
        if (typeof obj['id'] === 'string') {
          idMatchs[obj['id']] = Permission.nameParser[obj['permission']];
        } else if (typeof obj['group'] === 'string') {
          if (obj['group'] == 'default') {
            defaultPermission = Permission.nameParser[obj['permission']];
          } else {
            groupMatchs[obj['group']] = Permission.nameParser[obj['permission']];
          }
        }
      }
    }
  }

  getPermission(responder) {
    // TODO Permission temp workaround before user permission is implemented
    if (this._FORCE_CONFIG) {
      return Permission.CONFIG;
    }

    if (idMatchs.hasOwnProperty(responder.reqId)) {
      return idMatchs[responder.reqId];
    }

    rslt: number = Permission.NEVER;

    for (string; group; of) responder.groups;

    {
      if (groupMatchs.hasOwnProperty(group)) {
        int;
        v = groupMatchs[group];

        if (v < rslt) {
          // choose the lowest permission from all matched group
          rslt = v;
        }
      }
    }

    if (rslt == Permission.NEVER) {
      return defaultPermission;
    }

    return rslt;
  }

}

exports.PermissionList = PermissionList;
},{}],"q+mg":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

class TableColumn {
  constructor(name, type, defaultValue) {
    this.name = name;
    this.type = type;
    this.defaultValue = defaultValue;
  }

  getData() {
    let rslt = {
      "type": this.type,
      "name": this.name
    };

    if (this.defaultValue != null) {
      rslt["default"] = this.defaultValue;
    }

    return rslt;
  } /// convert tableColumns into List of object


  static serializeColumns(list) {
    let rslts = [];

    for (let m of list) {
      if (m instanceof Object) {
        if (m instanceof TableColumn) {
          rslts.push(m.getData());
        } else {
          rslts.push(m);
        }
      }
    }

    return rslts;
  } /// parse List of object into TableColumn


  static parseColumns(list) {
    let rslt = [];

    for (let m of list) {
      if (m != null && m instanceof Object && typeof m["name"] === 'string') {
        let type = "string";

        if (typeof m["type"] === 'string') {
          type = m["type"];
        }

        rslt.push(new TableColumn(m["name"], type, m["default"]));
      } else if (m instanceof TableColumn) {
        rslt.push(m);
      } else {
        // invalid column data
        return null;
      }
    }

    return rslt;
  }

}

exports.TableColumn = TableColumn;

class Table {
  constructor(columns, rows, meta) {
    this.columns = columns;
    this.rows = rows;
    this.meta = meta;
  }

}

exports.Table = Table;

class TableColumns {
  constructor(columns) {
    this.columns = columns;
  }

}

exports.TableColumns = TableColumns;

class TableMetadata {
  constructor(meta) {
    this.meta = meta;
  }

}

exports.TableMetadata = TableMetadata;
},{}],"+yD6":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const async_1 = require("../../utils/async");

const permission_1 = require("../../common/permission");

const interfaces_1 = require("../../common/interfaces");

const table_1 = require("../../common/table");

const interface_1 = require("../interface");

class RequesterInvokeUpdate extends interface_1.RequesterUpdate {
  constructor(updates, rawColumns, columns, streamStatus, meta, error) {
    super(streamStatus);
    this.updates = updates;
    this.rawColumns = rawColumns;
    this.meta = meta;
    this.error = error;
  }

  get rows() {
    let colLen = -1;

    if (this.columns != null) {
      colLen = this.columns.length;
    }

    if (this._rows == null) {
      this._rows = [];

      if (this.updates == null) {
        return this._rows;
      }

      for (let obj of this.updates) {
        let row;

        if (Array.isArray(obj)) {
          if (obj.length < colLen) {
            row = obj.concat();

            for (let i = obj.length; i < colLen; ++i) {
              row.push(this.columns[i].defaultValue);
            }
          } else if (obj.length > colLen) {
            if (colLen === -1) {
              // when column is unknown, just return all values
              row = obj.concat();
            } else {
              row = obj.slice(0, colLen);
            }
          } else {
            row = obj;
          }
        } else if (obj != null && obj instanceof Object) {
          row = [];

          if (this.columns == null) {
            let keys = obj.keys;
            this.columns = keys.map(x => new table_1.TableColumn(x, "dynamic"));
          }

          if (this.columns != null) {
            for (let column of this.columns) {
              if (obj.hasOwnProperty(column.name)) {
                row.push(obj[column.name]);
              } else {
                row.push(column.defaultValue);
              }
            }
          }
        }

        this._rows.push(row);
      }
    }

    return this._rows;
  }

}

exports.RequesterInvokeUpdate = RequesterInvokeUpdate;

class RequesterInvokeStream extends async_1.Stream {}

exports.RequesterInvokeStream = RequesterInvokeStream;

class InvokeController {
  constructor(node, requester, params, maxPermission = permission_1.Permission.CONFIG) {
    this.mode = 'stream';
    this.lastStatus = interfaces_1.StreamStatus.initialize;

    this._onUnsubscribe = obj => {
      if (this._request != null && this._request.streamStatus !== interfaces_1.StreamStatus.closed) {
        this._request.close();
      }
    };

    this.node = node;
    this.requester = requester;
    this._stream = new RequesterInvokeStream();
    this._stream._onClose = this._onUnsubscribe;
    let reqMap = {
      'method': 'invoke',
      'path': node.remotePath,
      'params': params
    };

    if (maxPermission !== permission_1.Permission.CONFIG) {
      reqMap['permit'] = permission_1.Permission.names[maxPermission];
    } // TODO: update node before invoke to load columns
    //    if(!node.isUpdated()) {
    //      node._list().listen( this._onNodeUpdate)
    //    } else {


    this._request = requester._sendRequest(reqMap, this);
    this._stream.request = this._request; //    }
  }

  static getNodeColumns(node) {
    let columns = node.getConfig('$columns');

    if (!Array.isArray(columns) && node.profile != null) {
      columns = node.profile.getConfig('$columns');
    }

    if (Array.isArray(columns)) {
      return table_1.TableColumn.parseColumns(columns);
    }

    return null;
  }

  onUpdate(streamStatus, updates, columns, meta, error) {
    if (meta != null && typeof meta['mode'] === 'string') {
      this.mode = meta['mode'];
    } // TODO: implement error


    if (columns != null) {
      if (this._cachedColumns == null || this.mode === 'refresh') {
        this._cachedColumns = table_1.TableColumn.parseColumns(columns);
      } else {
        this._cachedColumns = this._cachedColumns.concat(table_1.TableColumn.parseColumns(columns));
      }
    } else if (this._cachedColumns == null) {
      this._cachedColumns = InvokeController.getNodeColumns(this.node);
    }

    if (error != null) {
      streamStatus = interfaces_1.StreamStatus.closed;

      this._stream.add(new RequesterInvokeUpdate(null, null, null, streamStatus, meta, error));
    } else if (updates != null || meta != null || streamStatus !== this.lastStatus) {
      this._stream.add(new RequesterInvokeUpdate(updates, columns, this._cachedColumns, streamStatus, meta));
    }

    this.lastStatus = streamStatus;

    if (streamStatus === interfaces_1.StreamStatus.closed) {
      this._stream.close();
    }
  }

  onDisconnect() {}

  onReconnect() {}

}

exports.InvokeController = InvokeController;
},{"../../utils/async":"bajV","../../common/permission":"nCNP","../../common/interfaces":"N9NG","../../common/table":"q+mg","../interface":"wq45"}],"UnXq":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function buildEnumType(values) {
  return `enum[${values.join(',')}]`;
}

exports.buildEnumType = buildEnumType;
},{}],"jg7K":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
}); /// manage cached nodes for requester

const node_1 = require("../common/node");

const list_1 = require("./request/list");

const subscribe_1 = require("./request/subscribe");

const permission_1 = require("../common/permission");

const invoke_1 = require("./request/invoke");

const utils_1 = require("../../utils");

class RemoteNodeCache {
  constructor() {
    this._nodes = new Map();
  }

  RemoteNodeCache() {}

  getRemoteNode(path) {
    let node = this._nodes.get(path);

    if (node == null) {
      if (this._nodes.size % 1000 === 0) {//        logger.fine("Node Cache hit ${this._nodes.length} nodes in size.");
      }

      if (path.startsWith("defs")) {
        node = new RemoteDefNode(path);

        this._nodes.set(path, node);
      } else {
        node = new RemoteNode(path);

        this._nodes.set(path, node);
      }
    }

    return node;
  }

  cachedNodePaths() {
    return this._nodes.keys;
  }

  isNodeCached(path) {
    return this._nodes.has(path);
  }

  clearCachedNode(path) {
    this._nodes.delete(path);
  }

  clear() {
    this._nodes.clear();
  }

  getDefNode(path, defName) {
    if (DefaultDefNodes.nameMap.hasOwnProperty(defName)) {
      return DefaultDefNodes.nameMap[defName];
    }

    return this.getRemoteNode(path);
  } /// update node with a map.


  updateRemoteChildNode(parent, name, m) {
    let path;

    if (parent.remotePath === '/') {
      path = `/${name}`;
    } else {
      path = `${parent.remotePath}/${name}`;
    }

    let rslt;

    if (this._nodes.has(path)) {
      rslt = this._nodes.get(path);
      rslt.updateRemoteChildData(m, this);
    } else {
      rslt = new RemoteNode(path);

      this._nodes.set(path, rslt);

      rslt.updateRemoteChildData(m, this);
    }

    return rslt;
  }

}

exports.RemoteNodeCache = RemoteNodeCache;

class RemoteNode extends node_1.Node {
  constructor(remotePath) {
    super();
    this.listed = false;
    this.remotePath = remotePath;

    this._getRawName();
  }

  get subscribeController() {
    return this._subscribeController;
  }

  get hasValueUpdate() {
    if (this._subscribeController == null) {
      return false;
    }

    return this._subscribeController._lastUpdate != null;
  }

  get lastValueUpdate() {
    if (this.hasValueUpdate) {
      return this._subscribeController._lastUpdate;
    } else {
      return null;
    }
  }

  _getRawName() {
    if (this.remotePath === '/') {
      this.name = '/';
    } else {
      this.name = this.remotePath.split('/').pop();
    }
  } /// node data is not ready until all profile and mixins are updated


  isUpdated() {
    if (!this.isSelfUpdated()) {
      return false;
    }

    if (this.profile instanceof RemoteNode && !this.profile.isSelfUpdated()) {
      return false;
    }

    return true;
  } /// whether the node's own data is updated


  isSelfUpdated() {
    return this._listController != null && this._listController.initialized;
  }

  _list(requester) {
    if (this._listController == null) {
      this._listController = this.createListController(requester);
    }

    return this._listController.stream;
  } /// need a factory function for children class to override


  createListController(requester) {
    return new list_1.ListController(this, requester);
  }

  _subscribe(requester, callback, qos) {
    if (this._subscribeController == null) {
      this._subscribeController = new subscribe_1.ReqSubscribeController(this, requester);
    }

    this._subscribeController.listen(callback, qos);
  }

  _unsubscribe(requester, callback) {
    if (this._subscribeController != null) {
      this._subscribeController.unlisten(callback);
    }
  }

  _invoke(params, requester, maxPermission = permission_1.Permission.CONFIG) {
    return new invoke_1.InvokeController(this, requester, params, maxPermission)._stream;
  } /// used by list api to update simple data for children


  updateRemoteChildData(m, cache) {
    let childPathPre;

    if (this.remotePath === '/') {
      childPathPre = '/';
    } else {
      childPathPre = `${this.remotePath}/`;
    }

    for (let key in m) {
      let value = m[key];

      if (key.startsWith('$')) {
        this.configs.set(key, value);
      } else if (key.startsWith('@')) {
        this.attributes.set(key, value);
      } else if (value != null && value instanceof Object) {
        let node = cache.getRemoteNode(`${childPathPre}/${key}`);
        this.children.set(key, node);

        if (node instanceof RemoteNode) {
          node.updateRemoteChildData(value, cache);
        }
      }
    }
  } /// clear all configs attributes and children


  resetNodeCache() {
    this.configs.clear();
    this.attributes.clear();
    this.children.clear();
  }

  save(includeValue = true) {
    let map = {};

    for (let [key, value] of this.configs) {
      map[key] = value;
    }

    for (let [key, value] of this.attributes) {
      map[key] = value;
    }

    for (let [key, node] of this.children) {
      map[key] = node instanceof RemoteNode ? node.save() : node.getSimpleMap();
    }

    if (includeValue && this._subscribeController != null && this._subscribeController._lastUpdate != null) {
      map["?value"] = this._subscribeController._lastUpdate.value;
      map["?value_timestamp"] = this._subscribeController._lastUpdate.ts;
    }

    return map;
  }

}

exports.RemoteNode = RemoteNode;

class RemoteDefNode extends RemoteNode {
  constructor(path) {
    super(path);
  }

}

exports.RemoteDefNode = RemoteDefNode;

class DefaultDefNodes {}

DefaultDefNodes._defaultDefs = {
  "node": {},
  "static": {},
  "getHistory": {
    "$invokable": "read",
    "$result": "table",
    "$params": [{
      "name": "Timerange",
      "type": "string",
      "edito": "daterange"
    }, {
      "name": "Interval",
      "type": "enum",
      "default": "none",
      "edito": utils_1.buildEnumType(["default", "none", "1Y", "3N", "1N", "1W", "1D", "12H", "6H", "4H", "3H", "2H", "1H", "30M", "15M", "10M", "5M", "1M", "30S", "15S", "10S", "5S", "1S"])
    }, {
      "name": "Rollup",
      "default": "none",
      "type": utils_1.buildEnumType(["none", "avg", "min", "max", "sum", "first", "last", "count", "delta"])
    }],
    "$columns": [{
      "name": "timestamp",
      "type": "time"
    }, {
      "name": "value",
      "type": "dynamic"
    }]
  }
};

DefaultDefNodes.nameMap = function () {
  let rslt = {};

  for (let k in DefaultDefNodes._defaultDefs) {
    let m = DefaultDefNodes._defaultDefs[k];
    let path = `/defs/profile/${k}`;
    let node = new RemoteDefNode(path);

    for (let n in m) {
      let v = DefaultDefNodes._defaultDefs[k];

      if (n.startsWith('$')) {
        node.configs.set(n, v);
      } else if (n.startsWith('@')) {
        node.attributes.set(n, v);
      }
    }

    node.listed = true;
    rslt[k] = node;
  }

  return rslt;
}();

DefaultDefNodes.pathMap = function () {
  let rslt = {};

  for (let k in DefaultDefNodes.nameMap) {
    let node = DefaultDefNodes.nameMap[k];

    if (node instanceof RemoteNode) {
      rslt[node.remotePath] = node;
    }
  }

  return rslt;
}();

exports.DefaultDefNodes = DefaultDefNodes;
},{"../common/node":"QClj","./request/list":"duux","./request/subscribe":"YpSC","../common/permission":"nCNP","./request/invoke":"+yD6","../../utils":"UnXq"}],"wdMm":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const async_1 = require("../../utils/async");

const permission_1 = require("../../common/permission");

const interface_1 = require("../interface");

class SetController {
  constructor(requester, path, value, maxPermission = permission_1.Permission.CONFIG) {
    this.completer = new async_1.Completer();
    this.requester = requester;
    this.path = path;
    this.value = value;
    let reqMap = {
      'method': 'set',
      'path': path,
      'value': value
    };

    if (maxPermission !== permission_1.Permission.CONFIG) {
      reqMap['permit'] = permission_1.Permission.names[maxPermission];
    }

    this._request = requester._sendRequest(reqMap, this);
  }

  get future() {
    return this.completer.future;
  }

  onUpdate(status, updates, columns, meta, error) {
    // TODO implement error
    this.completer.complete(new interface_1.RequesterUpdate(status));
  }

  onDisconnect() {}

  onReconnect() {}

}

exports.SetController = SetController;
},{"../../utils/async":"bajV","../../common/permission":"nCNP","../interface":"wq45"}],"Eaoe":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const async_1 = require("../../utils/async");

const interface_1 = require("../interface");

class RemoveController {
  constructor(requester, path) {
    this.completer = new async_1.Completer();
    this.requester = requester;
    this.path = path;
    let reqMap = {
      'method': 'remove',
      'path': path
    };
    this._request = requester._sendRequest(reqMap, this);
  }

  get future() {
    return this.completer.future;
  }

  onUpdate(status, updates, columns, meta, error) {
    // TODO implement error
    this.completer.complete(new interface_1.RequesterUpdate(status));
  }

  onDisconnect() {}

  onReconnect() {}

}

exports.RemoveController = RemoveController;
},{"../../utils/async":"bajV","../interface":"wq45"}],"9L6c":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const async_1 = require("../utils/async");

const request_1 = require("./request");

const connection_handler_1 = require("../common/connection_handler");

const node_cache_1 = require("./node_cache");

const subscribe_1 = require("./request/subscribe");

const interfaces_1 = require("../common/interfaces");

const list_1 = require("./request/list");

const permission_1 = require("../common/permission");

const set_1 = require("./request/set");

const remove_1 = require("./request/remove");

class Requester extends connection_handler_1.ConnectionHandler {
  constructor(cache) {
    super();
    this._requests = new Map();

    this.onData = list => {
      if (Array.isArray(list)) {
        for (let resp of list) {
          if (resp != null && resp instanceof Object) {
            this._onReceiveUpdate(resp);
          }
        }
      }
    };

    this.onError = new async_1.Stream();
    this.lastRid = 0;
    this._connected = false;
    this.nodeCache = cache ? cache : new node_cache_1.RemoteNodeCache();
    this._subscription = new subscribe_1.SubscribeRequest(this, 0);

    this._requests.set(0, this._subscription);
  }

  get subscriptionCount() {
    return this._subscription.subscriptions.size;
  }

  get openRequestCount() {
    return this._requests.size;
  }

  _onReceiveUpdate(m) {
    if (typeof m['rid'] === 'number' && this._requests.has(m['rid'])) {
      this._requests.get(m['rid'])._update(m);
    }
  }

  getNextRid() {
    do {
      if (this.lastRid < 0x7FFFFFFF) {
        ++this.lastRid;
      } else {
        this.lastRid = 1;
      }
    } while (this._requests.has(this.lastRid));

    return this.lastRid;
  }

  getSendingData(currentTime, waitingAckId) {
    let rslt = super.getSendingData(currentTime, waitingAckId);
    return rslt;
  }

  sendRequest(m, updater) {
    return this._sendRequest(m, updater);
  }

  _sendRequest(m, updater) {
    m['rid'] = this.getNextRid();
    let req;

    if (updater != null) {
      req = new request_1.Request(this, this.lastRid, updater, m);

      this._requests.set(this.lastRid, req);
    }

    if (this._conn) {
      this.addToSendList(m);
    }

    return req;
  }

  isNodeCached(path) {
    return this.nodeCache.isNodeCached(path);
  }

  subscribe(path, callback, qos = 0) {
    let node = this.nodeCache.getRemoteNode(path);

    node._subscribe(this, callback, qos);

    return new subscribe_1.ReqSubscribeListener(this, path, callback);
  }

  unsubscribe(path, callback) {
    let node = this.nodeCache.getRemoteNode(path);

    node._unsubscribe(this, callback);
  }

  onValueChange(path, qos = 0) {
    let listener;
    let stream;
    stream = new async_1.Stream(() => {
      if (listener == null) {
        listener = this.subscribe(path, update => {
          stream.add(update);
        }, qos);
      }
    }, () => {
      if (listener) {
        listener.close();
        listener = null;
      }
    });
    return stream;
  }

  getNodeValue(path, timeoutMs = 0) {
    return new Promise((resolve, reject) => {
      let listener;
      let timer;
      listener = this.subscribe(path, update => {
        resolve(update);

        if (listener != null) {
          listener.close();
          listener = null;
        }

        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      });

      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          timer = null;

          if (listener) {
            listener.close();
            listener = null;
          }

          reject(new Error(`failed to receive value, timeout: ${timeoutMs}ms`));
        }, timeoutMs);
      }
    });
  }

  getRemoteNode(path) {
    return new Promise((resolve, reject) => {
      let sub = this.list(path, update => {
        resolve(update.node);

        if (sub != null) {
          sub.close();
        }
      });
    });
  }

  list(path, callback) {
    let node = this.nodeCache.getRemoteNode(path);
    return node._list(this).listen(callback);
  }

  invoke(path, params = {}, callback, maxPermission = permission_1.Permission.CONFIG) {
    let node = this.nodeCache.getRemoteNode(path);

    let stream = node._invoke(params, this, maxPermission);

    if (callback) {
      stream.listen(callback);
    }

    return stream;
  }

  set(path, value, maxPermission = permission_1.Permission.CONFIG) {
    return new set_1.SetController(this, path, value, maxPermission).future;
  }

  remove(path) {
    return new remove_1.RemoveController(this, path).future;
  } /// close the request from requester side and notify responder


  closeRequest(request) {
    if (this._requests.has(request.rid)) {
      if (request.streamStatus !== interfaces_1.StreamStatus.closed) {
        this.addToSendList({
          'method': 'close',
          'rid': request.rid
        });
      }

      this._requests.delete(request.rid);

      request.close();
    }
  }

  onDisconnected() {
    if (!this._connected) return;
    this._connected = false;
    let newRequests = new Map();
    newRequests.set(0, this._subscription);

    for (let [n, req] of this._requests) {
      if (req.rid <= this.lastRid && !(req.updater instanceof list_1.ListController)) {
        req._close(interfaces_1.DSError.DISCONNECTED);
      } else {
        newRequests.set(req.rid, req);
        req.updater.onDisconnect();
      }
    }

    this._requests = newRequests;
  }

  onReconnected() {
    if (this._connected) return;
    this._connected = true;
    super.onReconnected();

    for (let [n, req] of this._requests) {
      req.updater.onReconnect();
      req.resend();
    }
  }

}

exports.Requester = Requester;
},{"../utils/async":"bajV","./request":"wg7F","../common/connection_handler":"lXIX","./node_cache":"jg7K","./request/subscribe":"YpSC","../common/interfaces":"N9NG","./request/list":"duux","../common/permission":"nCNP","./request/set":"wdMm","./request/remove":"Eaoe"}],"Hcj+":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const async_1 = require("../utils/async");

class PassiveChannel {
  constructor(conn, connected = false) {
    this.onReceive = new async_1.Stream();
    this._processors = [];
    this._isReady = false;
    this.connected = true;
    this.onDisconnectController = new async_1.Completer();
    this.onConnectController = new async_1.Completer();
    this.conn = conn;
    this.connected = connected;
  }

  sendWhenReady(handler) {
    this.handler = handler;
    this.conn.requireSend();
  }

  getSendingData(currentTime, waitingAckId) {
    if (this.handler != null) {
      let rslt = this.handler.getSendingData(currentTime, waitingAckId); //handler = null;

      return rslt;
    }

    return null;
  }

  get isReady() {
    return this._isReady;
  }

  set isReady(val) {
    this._isReady = val;
  }

  get onDisconnected() {
    return this.onDisconnectController.future;
  }

  get onConnected() {
    return this.onConnectController.future;
  }

  updateConnect() {
    if (this.connected) return;
    this.connected = true;
    this.onConnectController.complete(this);
  }

}

exports.PassiveChannel = PassiveChannel;
},{"../utils/async":"bajV"}],"3FSK":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const interfaces_1 = require("../common/interfaces");

const connection_channel_1 = require("../common/connection_channel");

const async_1 = require("../utils/async");

class WebSocketConnection extends interfaces_1.Connection {
  /// clientLink is not needed when websocket works in server link
  constructor(socket, clientLink, onConnect, useCodec) {
    super();
    this._onRequestReadyCompleter = new async_1.Completer();
    this._onDisconnectedCompleter = new async_1.Completer();
    this._dataSent = false; /// add this count every 20 seconds, set to 0 when receiving data
    /// when the count is 3, disconnect the link

    this._dataReceiveCount = 0;
    this._opened = false;
    this.nextMsgId = 1;
    this._sending = false;
    this._authError = false;
    this.socket = socket;
    this.clientLink = clientLink;
    this.onConnect = onConnect;

    if (useCodec != null) {
      this.codec = useCodec;
    }

    socket.binaryType = "arraybuffer";
    this._responderChannel = new connection_channel_1.PassiveChannel(this);
    this._requesterChannel = new connection_channel_1.PassiveChannel(this);

    socket.onmessage = event => {
      this._onData(event);
    };

    socket.onclose = event => {
      this._onDone(event);
    };

    socket.onopen = event => {
      this._onOpen(event);
    }; // TODO, when it's used in client link, wait for the server to send {allowed} before complete this


    setTimeout(() => {
      this._onRequestReadyCompleter.complete(this._requesterChannel);
    }, 0);
    this.pingTimer = setInterval(() => {
      this.onPingTimer();
    }, 20000);
  }

  get responderChannel() {
    return this._responderChannel;
  }

  get requesterChannel() {
    return this._requesterChannel;
  }

  get onRequesterReady() {
    return this._onRequestReadyCompleter.future;
  }

  get onDisconnected() {
    return this._onDisconnectedCompleter.future;
  }

  onPingTimer() {
    if (this._dataReceiveCount >= 3) {
      close();
      return;
    }

    this._dataReceiveCount++;

    if (this._dataSent) {
      this._dataSent = false;
      return;
    }

    this.addConnCommand(null, null);
  }

  requireSend() {
    if (!this._sending) {
      this._sending = true;
      setTimeout(() => {
        this._send();
      }, 0);
    }
  }

  get opened() {
    return this._opened;
  }

  _onOpen(e) {
    //    logger.info("Connected");
    this._opened = true;

    if (this.onConnect != null) {
      this.onConnect();
    }

    this._responderChannel.updateConnect();

    this._requesterChannel.updateConnect();

    this.socket.send(this.codec.blankData);
    this.requireSend();
  } /// add server command, will be called only when used as server connection


  addConnCommand(key, value) {
    if (this._msgCommand == null) {
      this._msgCommand = {};
    }

    if (key != null) {
      this._msgCommand[key] = value;
    }

    this.requireSend();
  }

  _onData(e) {
    //    logger.fine("onData:");
    this._dataReceiveCount = 0;
    let m;

    if (e.data instanceof ArrayBuffer) {
      try {
        let bytes = new Uint8Array(e.data);
        m = this.codec.decodeBinaryFrame(bytes); //        logger.fine("$m");

        if (typeof m["salt"] === 'string') {
          this.clientLink.updateSalt(m["salt"]);
        }

        let needAck = false;

        if (Array.isArray(m["responses"]) && m["responses"].length > 0) {
          needAck = true; // send responses to requester channel

          this._requesterChannel.onReceive.add(m["responses"]);
        }

        if (Array.isArray(m["requests"]) && m["requests"].length > 0) {
          needAck = true; // send requests to responder channel

          this._responderChannel.onReceive.add(m["requests"]);
        }

        if (typeof m["ack"] === 'number') {
          this.ack(m["ack"]);
        }

        if (needAck) {
          let msgId = m["msg"];

          if (msgId != null) {
            this.addConnCommand("ack", msgId);
          }
        }
      } catch (err) {
        console.error("error in onData", err, stack);
        this.close();
        return;
      }
    } else if (typeof e.data === 'string') {
      try {
        m = this.codec.decodeStringFrame(e.data); //        logger.fine("$m");

        let needAck = false;

        if (Array.isArray(m["responses"]) && m["responses"].length > 0) {
          needAck = true; // send responses to requester channel

          this._requesterChannel.onReceive.add(m["responses"]);
        }

        if (Array.isArray(m["requests"]) && m["requests"].length > 0) {
          needAck = true; // send requests to responder channel

          this._responderChannel.onReceive.add(m["requests"]);
        }

        if (typeof m["ack"] === "number") {
          this.ack(m["ack"]);
        }

        if (needAck) {
          let msgId = m["msg"];

          if (msgId != null) {
            this.addConnCommand("ack", msgId);
          }
        }
      } catch (err) {
        console.error(err);
        this.close();
        return;
      }
    }
  }

  _send() {
    this._sending = false;

    if (this.socket.readyState !== WebSocket.OPEN) {
      return;
    } //    logger.fine("browser sending");


    let needSend = false;
    let m;

    if (this._msgCommand != null) {
      m = this._msgCommand;
      needSend = true;
      this._msgCommand = null;
    } else {
      m = {};
    }

    let pendingAck = [];
    let ts = new Date().getTime();

    let rslt = this._responderChannel.getSendingData(ts, this.nextMsgId);

    if (rslt != null) {
      if (rslt.messages.length > 0) {
        m["responses"] = rslt.messages;
        needSend = true;
      }

      if (rslt.processors.length > 0) {
        pendingAck = pendingAck.concat(rslt.processors);
      }
    }

    rslt = this._requesterChannel.getSendingData(ts, this.nextMsgId);

    if (rslt != null) {
      if (rslt.messages.length > 0) {
        m["requests"] = rslt.messages;
        needSend = true;
      }

      if (rslt.processors.length > 0) {
        pendingAck = pendingAck.concat(rslt.processors);
      }
    }

    if (needSend) {
      if (this.nextMsgId !== -1) {
        if (pendingAck.length > 0) {
          this.pendingAcks.push(new interfaces_1.ConnectionAckGroup(this.nextMsgId, ts, pendingAck));
        }

        m["msg"] = this.nextMsgId;

        if (this.nextMsgId < 0x7FFFFFFF) {
          ++this.nextMsgId;
        } else {
          this.nextMsgId = 1;
        }
      } //      logger.fine("send: $m");


      let encoded = this.codec.encodeFrame(m);

      try {
        this.socket.send(encoded);
      } catch (e) {
        console.error('Unable to send on socket', e);
        this.close();
      }

      this._dataSent = true;
    }
  }

  _onDone(o) {
    if (o instanceof CloseEvent) {
      if (o.code === 1006) {
        this._authError = true;
      }
    } //    logger.fine("socket disconnected");


    if (!this._requesterChannel.onReceive.isClosed) {
      this._requesterChannel.onReceive.close();
    }

    if (!this._requesterChannel.onDisconnectController.isCompleted) {
      this._requesterChannel.onDisconnectController.complete(this._requesterChannel);
    }

    if (!this._responderChannel.onReceive.isClosed) {
      this._responderChannel.onReceive.close();
    }

    if (!this._responderChannel.onDisconnectController.isCompleted) {
      this._responderChannel.onDisconnectController.complete(this._responderChannel);
    }

    if (!this._onDisconnectedCompleter.isCompleted) {
      this._onDisconnectedCompleter.complete(this._authError);
    }

    if (this.pingTimer != null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  close() {
    if (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING) {
      this.socket.close();
    }

    this._onDone();
  }

}

exports.WebSocketConnection = WebSocketConnection;
},{"../common/interfaces":"N9NG","../common/connection_channel":"Hcj+","../utils/async":"bajV"}],"0BdU":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
}); /// a client link for both http and ws

const interfaces_1 = require("../common/interfaces");

const async_1 = require("../utils/async");

const requester_1 = require("../requester/requester");

const browser_ws_conn_1 = require("./browser_ws_conn");

const codec_1 = require("../utils/codec");

class DummyECDH {
  constructor() {
    this.encodedPublicKey = "";
  }

  hashSalt(salt) {
    return '';
  }

  verifySalt(salt, hash) {
    return true;
  }

}

exports.DummyECDH = DummyECDH;

class BrowserUserLink extends interfaces_1.ClientLink {
  constructor(wsUpdateUri, format = 'msgpack') {
    super();
    this._onRequesterReadyCompleter = new async_1.Completer();
    this.requester = new requester_1.Requester(); //  readonly responder: Responder;

    this.nonce = new DummyECDH();
    this._wsDelay = 1;

    if (wsUpdateUri.startsWith("http")) {
      wsUpdateUri = `ws${wsUpdateUri.substring(4)}`;
    }

    this.wsUpdateUri = wsUpdateUri;
    this.format = format;

    if (window.location.hash.includes("dsa_json")) {
      this.format = "json";
    }
  }

  get onRequesterReady() {
    return this._onRequesterReadyCompleter.future;
  }

  updateSalt(salt) {// do nothing
  }

  connect() {
    this.initWebsocket(false);
  }

  initWebsocketLater(ms) {
    if (this._initSocketTimer) return;
    this._initSocketTimer = setTimeout(() => this.initWebsocket, ms);
  }

  initWebsocket(reconnect = true) {
    this._initSocketTimer = null;
    let socket = new WebSocket(`${this.wsUpdateUri}?session=${BrowserUserLink.session}&format=${this.format}`);
    this._wsConnection = new browser_ws_conn_1.WebSocketConnection(socket, this, null, codec_1.DsCodec.getCodec(this.format)); // if (this.responder != null) {
    //   this.responder.connection = this._wsConnection.responderChannel;
    // }

    if (this.requester != null) {
      this._wsConnection.onRequesterReady.then(channel => {
        this.requester.connection = channel;

        if (!this._onRequesterReadyCompleter.isCompleted) {
          this._onRequesterReadyCompleter.complete(this.requester);
        }
      });
    }

    this._wsConnection.onDisconnected.then(connection => {
      //      logger.info("Disconnected");
      if (this._wsConnection == null) {
        // connection is closed
        return;
      }

      if (this._wsConnection._opened) {
        this._wsDelay = 1;
        this.initWebsocket(false);
      } else if (reconnect) {
        this.initWebsocketLater(this._wsDelay * 1000);
        if (this._wsDelay < 60) this._wsDelay++;
      } else {
        this._wsDelay = 5;
        this.initWebsocketLater(5000);
      }
    });
  }

  reconnect() {
    if (this._wsConnection != null) {
      this._wsConnection.socket.close();
    }
  }

  close() {
    if (this._initSocketTimer) {
      clearTimeout(this._initSocketTimer);
      this._initSocketTimer = null;
    }

    if (this._wsConnection != null) {
      this._wsConnection.close();

      this._wsConnection = null;
    }
  }

}

BrowserUserLink.session = Math.random().toString(16).substr(2, 8);
exports.BrowserUserLink = BrowserUserLink;
},{"../common/interfaces":"N9NG","../utils/async":"bajV","../requester/requester":"9L6c","./browser_ws_conn":"3FSK","../utils/codec":"TRmg"}],"YnW4":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const browser_user_link_1 = require("./src/browser/browser_user_link");

if (Object.isExtensible(window)) {
  window.DSLink = browser_user_link_1.BrowserUserLink;
}

exports.DSLink = browser_user_link_1.BrowserUserLink;
},{"./src/browser/browser_user_link":"0BdU"}]},{},["YnW4"], null)
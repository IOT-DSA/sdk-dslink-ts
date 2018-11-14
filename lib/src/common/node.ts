// part of dslink.common;

/// Base Class for any and all nodes in the SDK.
/// If you are writing a link, please look at the [dslink.responder.SimpleNode] class.
export class Node  {
  static getDisplayName(nameOrPath: string):string {
    if (nameOrPath.contains('/')) {
      let names: List = nameOrPath.split('/');
      nameOrPath = names.removeLast();
      while (nameOrPath == '' && !names.isEmpty) {
        nameOrPath = names.removeLast();
      }
    }

    if (nameOrPath.contains('%')) {
      nameOrPath = UriComponentDecoder.decode(nameOrPath);
    }

    return nameOrPath;
  }

  /// This node's profile.
  profile: Node;

  /// Node Attributes
  attributes: {[key: string]: object} = {};

  /// same as attributes for local node
  /// but different on remote node
  getOverideAttributes(attr: string):object {
    return attributes[attr];
  }

  Node();

  /// Get an Attribute
  getAttribute(name: string):object {
    if (attributes.containsKey(name)) {
      return attributes[name];
    }

    if (profile != null && profile.attributes.containsKey(name)) {
      return profile.attributes[name];
    }
    return null;
  }

  /// Node Configs
  configs: {[key: string]: object} = {r'$is': 'node'};

  /// Get a Config
  getConfig(name: string):object {
    if (configs.containsKey(name)) {
      return configs[name];
    }

    if (profile != null && profile.configs.containsKey(name)) {
      return profile.configs[name];
    }
    return null;
  }

  /// Node Children
  /// object of Child Name to Child Node
  children: {[key: string]: Node} = {};

  /// Adds a child to this node.
  addChild(name: string, node: Node) {
    children[name] = node;
  }

  /// Remove a child from this node.
  /// [input] can be either an instance of [Node] or a [string].
  removeChild(dynamic input):string {
    if ( typeof input === 'string' ) {
      children.remove(getChild(input));
      return input;
    } else if ( input instanceof Node ) {
      children.remove(input);
    } else {
      throw new Exception("Invalid Input");
    }
    return null;
  }

  /// Get a Child Node
  getChild(name: string):Node {
    if (children.containsKey(name)) {
      return children[name];
    }

    if (profile != null && profile.children.containsKey(name)) {
      return profile.children[name];
    }
    return null;
  }

  /// Get a property of this node.
  /// If [name] starts with '$', this will fetch a config.
  /// If [name] starts with a '@', this will fetch an attribute.
  /// Otherwise this will fetch a child.
  get(name: string):object {
    if (name.startsWith(r'$')) {
      return getConfig(name);
    }
    if (name.startsWith('@')) {
      return getAttribute(name);
    }
    return getChild(name);
  }


  /// Iterates over all the children of this node and passes them to the specified [callback].
  void forEachChild(void callback(name: string, node: Node)) {
    children.forEach(callback);
    if (profile != null) {
      profile.children.forEach((str: string, Node n) {
        if (!children.containsKey(str)) {
          callback(str, n);
        }
      });
    }
  }

  void forEachConfig(void callback(name: string, value: object)) {
    configs.forEach(callback);
    if (profile != null) {
      profile.configs.forEach((str: string, val: object) {
        if (!configs.containsKey(str)) {
          callback(str, val);
        }
      });
    }
  }

  void forEachAttribute(void callback(name: string, value: object)) {
    attributes.forEach(callback);
    if (profile != null) {
      profile.attributes.forEach((str: string, val: object) {
        if (!attributes.containsKey(str)) {
          callback(str, val);
        }
      });
    }
  }

  /// Gets a map for the data that will be listed in the parent node's children property.
  getSimpleMap():{[key: string]: dynamic} {
    var rslt = <string, dynamic>{};
    if (configs.containsKey(r'$is')) {
      rslt[r'$is'] = configs[r'$is'];
    }

    if (configs.containsKey(r'$type')) {
      rslt[r'$type'] = configs[r'$type'];
    }

    if (configs.containsKey(r'$name')) {
      rslt[r'$name'] = configs[r'$name'];
    }

    if (configs.containsKey(r'$invokable')) {
      rslt[r'$invokable'] = configs[r'$invokable'];
    }

    if (configs.containsKey(r'$writable')) {
      rslt[r'$writable'] = configs[r'$writable'];
    }

    if (configs.containsKey(r'$params')) {
      rslt[r'$params'] = configs[r'$params'];
    }

    if (configs.containsKey(r'$columns')) {
      rslt[r'$columns'] = configs[r'$columns'];
    }

    if (configs.containsKey(r'$result')) {
      rslt[r'$result'] = configs[r'$result'];
    }

    // TODO(rick): add permission of current requester
    return rslt;
  }
}

/// Utility class for node and config/attribute paths.
export class Path  {
  /// Regular Expression for invalid characters in paths.
  static final invalidChar: RegExp = new RegExp(r'[\\\?\*|"<>:]');

  /// Regular Expression for invalid characters in names.
  static final invalidNameChar: RegExp = new RegExp(r'[\/\\\?\*|"<>:]');

  static escapeName(str: string):string {
    if (str.contains(invalidNameChar)) {
      return Uri.encodeComponent(str);
    }
    return str;
  }

  static getValidPath(path: object, basePath: string):Path {
    if ( typeof path === 'string' ) {
      Path p = new Path(path);
      if (p.valid) {
        return p..mergeBasePath(basePath);
      }
    }
    return null;
  }

  static getValidNodePath(path: object, basePath: string):Path {
    if ( typeof path === 'string' ) {
      Path p = new Path(path);
      if (p.valid && p.isNode) {
        return p..mergeBasePath(basePath);
      }
    }
    return null;
  }

  static getValidAttributePath(path: object, basePath: string):Path {
    if ( typeof path === 'string' ) {
      Path p = new Path(path);
      if (p.valid && p.isAttribute) {
        return p..mergeBasePath(basePath);
      }
    }
    return null;
  }

  static getValidConfigPath(path: object, basePath: string):Path {
    if ( typeof path === 'string' ) {
      Path p = new Path(path);
      if (p.valid && p.isConfig) {
        return p..mergeBasePath(basePath);
      }
    }
    return null;
  }

  /// Real Path
  path: string;

  /// Real Parent Path
  parentPath: string;

  /// Get the parent of this path.
  Path get parent => new Path(parentPath);

  /// Get a child of this path.
  Path child(name: string) =>
      new Path(
          (path.endsWith("/") ? path.substring(0, path.length - 1) : path) +
              "/" +
              (name.startsWith("/") ? name.substring(1) : name));

  /// The name of this path.
  /// This is the last component of the path.
  /// For the root node, this is '/'
  name: string;

  /// If this path is invalid, this will be false. Otherwise this will be true.
  valid: boolean = true;

  Path(this.path) {
    _parse();
  }

  _parse() {
    if (path == '' || path.contains(invalidChar) || path.contains('//')) {
      valid = false;
    }
    if (path == '/') {
      valid = true;
      name = '/';
      parentPath = '';
      return;
    }
    if (path.endsWith('/')) {
      path = path.substring(0, path.length - 1);
    }
    pos:number = path.lastIndexOf('/');
    if (pos < 0) {
      name = path;
      parentPath = '';
    } else if (pos == 0) {
      parentPath = '/';
      name = path.substring(1);
    } else {
      parentPath = path.substring(0, pos);
      name = path.substring(pos + 1);
      if (parentPath.contains(r'/$') || parentPath.contains('/@')) {
        // parent path can't be attribute or config
        valid = false;
      }
    }
  }

  /// Is this an absolute path?
  get isAbsolute(): boolean {
    return name == '/' || parentPath.startsWith('/');
  }

  /// Is this the root path?
  get isRoot(): boolean {
    return name == '/';
  }

  /// Is this a config?
  get isConfig(): boolean {
    return name.startsWith(r'$');
  }

  /// Is this an attribute?
  get isAttribute(): boolean {
    return name.startsWith(r'@');
  }

  /// Is this a node?
  get isNode(): boolean {
    return !name.startsWith(r'@') && !name.startsWith(r'$');
  }

  /// Merges the [base] path with this path.
  mergeBasePath(base: string, force: boolean = false) {
    if (base == null) {
      return;
    }

    if (!isAbsolute) {
      if (parentPath == '') {
        parentPath = base;
      } else {
        parentPath = '$base/$parentPath';
      }
      path = '$parentPath/$name';
    } else if (force) {
      // apply base path on a absolute path
      if (name == '') {
        // map the root path
        path = base;
        _parse();
      } else {
        parentPath = '$base$parentPath';
        path = '$parentPath/$name';
      }
    }
  }
}

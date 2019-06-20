// part of dslink.responder;

export interface NodeProviderImpl extends NodeProvider {
  {[key: string]: LocalNode} get nodes;
}

export interface LocalNodeImpl extends LocalNode {
  LocalNodeImpl(path: string) : super(path);

  serialize(withChildren: boolean):object {
    var rslt = {};
    configs.forEach((key, val) {
      rslt[key] = val;
    });

    attributes.forEach((key, val) {
      rslt[key] = val;
    });

    children.forEach((key, val) {
      if (withChildren) {
        if ( val instanceof LocalNodeImpl ) {
          rslt[key] = val.serialize(true);
        } else {
          rslt[key] = val.getSimpleMap();
        }
      }
    });

    return rslt;
  }

  _loaded: boolean = false;

  get loaded(): boolean { return this._loaded;}

  load(object m) {
    if ( this._loaded) {
      configs.clear();
      attributes.clear();
      children.clear();
    }
    childPathPre: string;
    if (path == '/') {
      childPathPre = '/';
    } else {
      childPathPre = '$path/';
    }

    m.forEach((key: string, value) {
      if (key.startsWith('$')) {
        configs[key] = value;
      } else if (key.startsWith('@')) {
        attributes[key] = value;
      } else if ( (value != null && value instanceof Object) ) {
        let node: Node = provider.getOrCreateNode('$childPathPre$key', false);
        if ( node instanceof LocalNodeImpl ) {
          node.load(value);
        }
        children[key] = node;
      }
    });
    _loaded = true;
  }

  updateList(name: string) {
    listChangeController.add(name);
  }

  setAttribute(name: string, value: object, responder: Responder,
      let response: Response):Response {
    if (!attributes.hasOwnProperty(name) || attributes[name] != value) {
      attributes[name] = value;
      updateList(name);

      if ( provider instanceof SerializableNodeProvider ) {
        (provider as SerializableNodeProvider).persist();
      }
    }
    return response..close();
  }

  removeAttribute(name: string, responder: Responder,
      let response: Response):Response {
    if (attributes.hasOwnProperty(name)) {
      attributes.remove(name);
      updateList(name);

      if ( provider instanceof SerializableNodeProvider ) {
        (provider as SerializableNodeProvider).persist();
      }
    }
    return response..close();
  }

  setConfig(name: string, value: object, responder: Responder,
      let response: Response):Response {
    var config = Configs.getConfig(name, profile);
    response.close(config.setConfig(value, this, responder));
    return response;
  }

  removeConfig(name: string, responder: Responder, response: Response):Response {
    var config = Configs.getConfig(name, profile);
    return response..close(config.removeConfig(this, responder));
  }

  setValue(
    value: object,
    responder: Responder,
    response: Response,
    maxPermission:number = Permission.CONFIG):Response {
    updateValue(value);
    // TODO: check value type
    return response..close();
  }
}

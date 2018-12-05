// part of dslink.responder;

export class ConfigSetting  {
  readonly name: string;
  readonly type: string;

  /// need permission to read
  readonly defaultValue: object;

  /// whether broker need to maintain the change of config value when ds link is offline
  // boolean maintain

  ConfigSetting(this.name, this.type, {this.defaultValue});
  ConfigSetting.fromMap(this.name, object m)
      : type = m.containsKey('type') ? m['type'] : 'string',
        defaultValue = m.containsKey('default') ? m['default'] : null {}

  setConfig(value: object, node: LocalNodeImpl, responder: Responder):DSError {
    if (node.configs[name] != value) {
      node.configs[name] = value;
      node.updateList(name);
    }
    return null;
  }

  removeConfig(node: LocalNodeImpl, responder: Responder):DSError {
    if (node.configs.containsKey(name)) {
      node.configs.remove(name);
      node.updateList(name);
    }
    return null;
  }
}

export class Configs  {
  static readonly _globalConfigs: object = const {
    r'$is': const {'type': 'profile'},
    r'$interface': const {'type': 'interface'},

    /// list of permissions
    r'$permissions': const {
      'type': 'list',
      'require': Permission.CONFIG,
      'writable': Permission.CONFIG,
    },

    /// the display name
    r'$name': const {'type': 'string'},

    /// type of subscription stream
    r'$type': const {'type': 'type'},

    /// permission needed to invoke
    r'$invokable': const {'type': 'permission', 'default': 'read'},

    /// permission needed to set
    r'$writable': const {'type': 'permission', 'default': 'never'},

    /// config settings, only used by profile nodes
    r'$settings': const {'type': 'map'},

    /// params of invoke method
    r'$params': const {'type': 'list'},

    /// stream columns of invoke method
    r'$columns': const {'type': 'list'},

    /// stream meta of invoke method
    r'$streamMeta': const {'type': 'list'}
    // not serializable
  };

  static readonly global: Configs = new Configs()..load( this._globalConfigs);
  static readonly defaultConfig: ConfigSetting =
      new ConfigSetting.fromMap('', const {});

  static getConfig(name: string, profile: Node):ConfigSetting {
    if (global.configs.containsKey(name)) {
      return global.configs[name];
    }
    if ( profile instanceof DefinitionNode && profile.configs.containsKey(name)) {
      return profile.configs[name];
    }
    return defaultConfig;
  }

  configs: {[key: string]: ConfigSetting} = {};
  load(inputs: object) {
    inputs.forEach((name, m) {
      if ( (m != null && m instanceof Object) ) {
        configs[name] = new ConfigSetting.fromMap(name, m);
      }
    });
  }
}

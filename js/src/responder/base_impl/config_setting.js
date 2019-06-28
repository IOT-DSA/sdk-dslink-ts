"use strict";
// part of dslink.responder;
Object.defineProperty(exports, "__esModule", { value: true });
class ConfigSetting {
    constructor() {
        this.defaultValue = m.hasOwnProperty('default') ? m['default'] : null;
    }
    hasOwnProperty() { }
}
exports.ConfigSetting = ConfigSetting;
{ }
setConfig(value, object, node, LocalNodeImpl, responder, Responder);
DSError;
{
    if (node.configs[name] != value) {
        node.configs[name] = value;
        node.updateList(name);
    }
    return null;
}
removeConfig(node, LocalNodeImpl, responder, Responder);
DSError;
{
    if (node.configs.hasOwnProperty(name)) {
        node.configs.remove(name);
        node.updateList(name);
    }
    return null;
}
class Configs {
}
Configs._globalConfigs = ;
exports.Configs = Configs;
const { '$is': , const: { 'type': , 'profile':  }, '$interface': , const: { 'type': , 'interface':  }, 
/// list of permissions
'$permissions': , const: { 'type': , 'list': , 'require': Permission, CONFIG, 'writable': Permission, CONFIG, }, 
/// the display name
'$name': , const: { 'type': , 'string':  }, 
/// type of subscription stream
'$type': , const: { 'type': , 'type':  }, 
/// permission needed to invoke
'$invokable': , const: { 'type': , 'permission': , 'default': , 'read':  }, 
/// permission needed to set
'$writable': , const: { 'type': , 'permission': , 'default': , 'never':  }, 
/// config settings, only used by profile nodes
'$settings': , const: { 'type': , 'map':  }, 
/// params of invoke method
'$params': , const: { 'type': , 'list':  }, 
/// stream columns of invoke method
'$columns': , const: { 'type': , 'list':  }, 
/// stream meta of invoke method
'$streamMeta': , const: { 'type': , 'list':  }
// not serializable
 };
global: exports.Configs = Configs = new Configs()..load(this._globalConfigs);
defaultConfig: exports.ConfigSetting = ConfigSetting =
    new ConfigSetting.fromMap('');
const {};
getConfig(name, string, profile, Node);
ConfigSetting;
{
    if (global.configs.hasOwnProperty(name)) {
        return global.configs[name];
    }
    if (profile instanceof DefinitionNode && profile.configs.hasOwnProperty(name)) {
        return profile.configs[name];
    }
    return defaultConfig;
}
configs: {
    [key, string];
    ConfigSetting;
}
{ }
;
load(inputs, object);
{
    inputs.forEach((name, m) => {
        if ((m != null && m instanceof Object)) {
            configs[name] = new ConfigSetting.fromMap(name, m);
        }
    });
}
//# sourceMappingURL=config_setting.js.map
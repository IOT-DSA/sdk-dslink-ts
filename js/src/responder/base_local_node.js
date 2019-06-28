"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_state_1 = require("./node_state");
const node_1 = require("../common/node");
class BaseLocalNode extends node_state_1.LocalNode {
    createChild(name, cls, ...args) {
        let childPath = node_1.Path.concat(this.path, name);
        let childNode = new cls(childPath, this.provider, ...args);
        this.addChild(name, childNode);
    }
    save() {
        let data = {};
        this.saveConfigs(data);
        this.saveAttributes(data);
        this.saveChildren(data);
        return data;
    }
    saveChildren(data) {
        for (let [key, value] of this.children) {
            if (value instanceof node_state_1.LocalNode) {
                let saved = value.save();
                if (saved) {
                    data[key] = saved;
                }
            }
        }
    }
    saveAttributes(data) {
        for (let [key, value] of this.attributes) {
            data[key] = value;
        }
    }
    shouldSaveConfig(key) {
        return false;
    }
    saveConfigs(data) {
        for (let [key, value] of this.configs) {
            if (this.shouldSaveConfig(key)) {
                data[key] = value;
            }
        }
    }
    load(data) {
        for (let key in data) {
            if (key === '')
                continue;
            switch (key.charCodeAt(0)) {
                case 64: /* @ */
                    this.attributes.set(key, data[key]);
                    continue;
                case 36: /* $ */
                    if (this.shouldSaveConfig(key)) {
                        this.configs.set(key, data[key]);
                    }
                    continue;
                case 63: /* ? */
                    continue;
                default:
                    if (data instanceof Object) {
                        let child = this.loadChild(key, data);
                        if (child) {
                            this.addChild(key, child);
                        }
                    }
            }
        }
    }
    loadChild(key, data) {
        // create node and load data here
        return null;
    }
}
exports.BaseLocalNode = BaseLocalNode;
//# sourceMappingURL=base_local_node.js.map
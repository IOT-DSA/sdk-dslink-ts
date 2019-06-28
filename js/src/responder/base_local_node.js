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
        return key === '$is';
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
                        let newChild = this.loadChild(key, data);
                        if (newChild) {
                            this.addChild(key, newChild);
                        }
                    }
            }
        }
    }
    /**
     * load child, return the child if a new child node is created
     */
    loadChild(key, data) {
        let child = this.children.get(key);
        if (child instanceof BaseLocalNode) {
            // load data to existing child
            child.load(data);
        }
        // default implementation doesn't know how to create a new child, return null
        return null;
    }
}
exports.BaseLocalNode = BaseLocalNode;
//# sourceMappingURL=base_local_node.js.map
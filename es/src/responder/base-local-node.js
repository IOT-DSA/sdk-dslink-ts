import { LocalNode } from './node_state';
import { Path } from '../common/node';
import { decryptPassword, encryptPassword } from '../utils/encrypt';
export class BaseLocalNode extends LocalNode {
    createChild(name, cls, ...args) {
        let childPath = Path.concat(this.path, name);
        // @ts-ignore
        let childNode = new cls(childPath, this.provider, ...args);
        this.addChild(name, childNode);
        return childNode;
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
            if (value instanceof LocalNode) {
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
                if (key.startsWith('$$') && key.endsWith('password')) {
                    data[key] = encryptPassword(value);
                }
                else {
                    data[key] = value;
                }
            }
        }
    }
    load(data) {
        for (let key in data) {
            if (key === '')
                continue;
            switch (key.charCodeAt(0)) {
                case 64 /* @ */:
                    this.attributes.set(key, data[key]);
                    continue;
                case 36 /* $ */:
                    if (this.shouldSaveConfig(key)) {
                        if (key.startsWith('$$') && key.endsWith('password')) {
                            this.configs.set(key, decryptPassword(data[key]));
                        }
                        else {
                            this.configs.set(key, data[key]);
                        }
                    }
                    continue;
                case 63 /* ? */:
                    continue;
                default:
                    let childData = data[key];
                    if (childData instanceof Object) {
                        this.loadChild(key, childData);
                    }
            }
        }
    }
    /**
     * load data into existing child
     * or create new child
     */
    loadChild(key, data) {
        let child = this.children.get(key);
        if (child instanceof BaseLocalNode) {
            // load data to existing child
            child.load(data);
        }
        // default implementation doesn't know how to create a new child
    }
}
//# sourceMappingURL=base-local-node.js.map
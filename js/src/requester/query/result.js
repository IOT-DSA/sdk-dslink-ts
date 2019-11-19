"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("../../common/node");
class NodeResult extends node_1.Node {
    constructor(stream, value, configs, attributes, children) {
        super();
        this.stream = stream;
        this.updateNode({ value, configs, attributes, children });
    }
    listen(listener) {
        return this.stream.listen(listener);
    }
    updateNode(node) {
        this.value = node.value;
        this.configs = node.configs;
        this.attributes = node.attributes;
        this.children = node.children;
    }
    isSame(node) {
        const { value, configs, attributes, children } = node;
        if (value !== this.value ||
            configs.size !== this.configs.size ||
            attributes.size !== this.attributes.size ||
            children.size !== this.children.size) {
            return false;
        }
        for (let [key, value] of this.configs) {
            if (configs.get(key) !== value) {
                return false;
            }
        }
        for (let [key, value] of this.attributes) {
            if (attributes.get(key) !== value) {
                return false;
            }
        }
        for (let [key, value] of this.children) {
            if (children.get(key) !== value) {
                return false;
            }
        }
        return true;
    }
}
exports.NodeResult = NodeResult;
//# sourceMappingURL=result.js.map
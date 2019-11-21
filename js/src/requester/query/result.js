"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("../../common/node");
class NodeQueryResult extends node_1.Node {
    constructor(path, stream, value, configs, attributes, children) {
        super();
        this.path = path;
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
    clone() {
        return new NodeQueryResult(this.path, this.stream, this.value, this.configs, this.attributes, this.children);
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
    toObject() {
        let result = {};
        for (let [key, value] of this.configs) {
            result[key] = value;
        }
        for (let [key, value] of this.attributes) {
            result[key] = value;
        }
        for (let [key, value] of this.children) {
            result[key] = value.toObject();
        }
        if (this.value !== undefined) {
            result['?value'] = this.value;
        }
        return result;
    }
}
exports.NodeQueryResult = NodeQueryResult;
//# sourceMappingURL=result.js.map
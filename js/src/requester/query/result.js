"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeQueryResult = void 0;
const node_1 = require("../../common/node");
class NodeQueryResult extends node_1.Node {
    constructor(path, nodeQuery, value, configs, attributes, children) {
        super();
        this.path = path;
        this.nodeQuery = nodeQuery;
        this.updateNode({ value, configs, attributes, children });
    }
    listen(listener, useCache = true) {
        return this.nodeQuery.listen(listener, useCache);
    }
    updateNode(node) {
        this.value = node.value;
        this.configs = node.configs;
        this.attributes = node.attributes;
        this.children = node.children;
    }
    clone() {
        return new NodeQueryResult(this.path, this.nodeQuery, this.value, this.configs, this.attributes, this.children);
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
    getActionCallback() {
        if (this.actionCallback) {
            return this.actionCallback;
        }
        let callback = (params) => this.nodeQuery.requester.invokeOnce(this.path, params);
        this.actionCallback = callback;
        return callback;
    }
    toObject() {
        let { query, summary } = this.nodeQuery;
        if (this.getConfig('$invokable') || (summary === null || summary === void 0 ? void 0 : summary.getConfig('$invokable'))) {
            return this.getActionCallback();
        }
        let returnSimpleValue = true;
        for (let key of Object.keys(query)) {
            if (key !== '?value' && key !== '?filter') {
                returnSimpleValue = false;
                break;
            }
        }
        if (returnSimpleValue) {
            return this.value;
        }
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
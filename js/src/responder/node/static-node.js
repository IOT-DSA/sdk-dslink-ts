"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_local_node_1 = require("../base-local-node");
class StaticNode extends base_local_node_1.BaseLocalNode {
    constructor() {
        super(...arguments);
        this.profileName = 'static';
    }
    loadChild(key, data) {
        let childNode = new StaticNode(`${this.path}/${key}`, this.provider);
        childNode.load(data);
        this.addChild(key, childNode);
    }
    shouldSaveConfig(key) {
        return true;
    }
    save() {
        return null;
    }
}
exports.StaticNode = StaticNode;
//# sourceMappingURL=static-node.js.map
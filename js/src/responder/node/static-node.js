"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaticNode = void 0;
const base_local_node_1 = require("../base-local-node");
const node_state_1 = require("../node_state");
class StaticNode extends base_local_node_1.BaseLocalNode {
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
StaticNode.profileName = 'static';
node_state_1.NodeProvider.ProfileNode = StaticNode;
//# sourceMappingURL=static-node.js.map
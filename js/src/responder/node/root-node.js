"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootNode = void 0;
const base_local_node_1 = require("../base-local-node");
const node_state_1 = require("../node_state");
class RootNode extends base_local_node_1.BaseLocalNode {
    constructor(data, provider) {
        if (!provider) {
            provider = new node_state_1.NodeProvider();
        }
        super('/', provider);
        this.provider.setRoot(this);
        if (data) {
            this.load(data);
        }
    }
}
exports.RootNode = RootNode;
//# sourceMappingURL=root-node.js.map
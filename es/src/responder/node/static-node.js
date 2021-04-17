import { BaseLocalNode } from '../base-local-node';
import { NodeProvider } from '../node_state';
export class StaticNode extends BaseLocalNode {
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
StaticNode.profileName = 'static';
NodeProvider.ProfileNode = StaticNode;
//# sourceMappingURL=static-node.js.map
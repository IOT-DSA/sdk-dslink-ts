import { BaseLocalNode } from '../base-local-node';
import { NodeProvider } from '../node_state';
export class RootNode extends BaseLocalNode {
    constructor(data, provider) {
        if (!provider) {
            provider = new NodeProvider();
        }
        super('/', provider);
        this.provider.setRoot(this);
        if (data) {
            this.load(data);
        }
    }
}
//# sourceMappingURL=root-node.js.map
import {BaseLocalNode} from '../base-local-node';
import {NodeProvider} from '../node_state';

export class RootNode extends BaseLocalNode {
  constructor(data?: {[key: string]: any}, provider?: NodeProvider) {
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

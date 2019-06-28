import {BaseLocalNode} from "../base_local_node";
import {NodeProvider} from "../node_state";


export class RootNode extends BaseLocalNode {
  constructor(data?: {[key: string]: any}) {
    super('/', new NodeProvider());
    this.provider.setRoot(this);
    if (data) {
      this.load(data);
    }
  }
}
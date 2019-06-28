import {BaseLocalNode} from "../base_local_node";
import {NodeProvider} from "../node_state";


export class RootNode extends BaseLocalNode {

  constructor() {
    super('/', new NodeProvider());
    this.provider.setRoot(this);
  }
}
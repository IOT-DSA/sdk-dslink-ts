import {BaseLocalNode} from "../base_local_node";
import {NodeProvider} from "../node_state";
import {Permission} from "../../common/permission";


export class ValueNode extends BaseLocalNode {

  _valueReady = true;

  constructor(path: string, provider: NodeProvider, profileName: string = 'node', type = 'dynamic', writtable = Permission.NEVER) {
    super(path, provider, profileName);
    this.setConfig('$type', type);
    if (writtable < Permission.NEVER) {
      this.setConfig('$writable', Permission.names[writtable]);
    }
  }

  save(): {[p: string]: any} {
    let data = super.save();
    data['?value'] = this._value;
    return data;
  }

  load(data: {[p: string]: any}) {
    super.load(data);
    if (data.hasOwnProperty('?value')) {
      this._value = data;
    }
  }
}
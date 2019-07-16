import {BaseLocalNode} from "../base-local-node";
import {NodeProvider} from "../node_state";
import {Permission} from "../../common/permission";

/**
 * base class for a serializable value node
 */
export class ValueNode extends BaseLocalNode {

  _saveValue: boolean;

  constructor(path: string, provider: NodeProvider, profileName: string = 'node', type = 'dynamic', writable = Permission.NEVER, saveValue = false) {
    super(path, provider, profileName);
    this.setConfig('$type', type);
    this._saveValue = saveValue;
    if (writable < Permission.NEVER) {
      this.setConfig('$writable', Permission.names[writable]);
    }
  }

  save(): {[p: string]: any} {
    let data = super.save();
    if (this._saveValue) {
      data['?value'] = this._value;
    }
    return data;
  }

  load(data: {[p: string]: any}) {
    super.load(data);
    if (this._saveValue && data.hasOwnProperty('?value')) {
      this._value = data['?value'];
    }
  }

  changeValue(newValue: any) {
    let changed = super.changeValue((newValue));
    if (changed && this._saveValue) {
      this.provider.save();
    }
    return changed;
  }
}
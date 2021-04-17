import { BaseLocalNode } from '../base-local-node';
import { Permission } from '../../common/permission';
/**
 * base class for a serializable value node
 */
export class ValueNode extends BaseLocalNode {
    constructor(path, provider, type = 'dynamic', writable = Permission.NEVER, saveValue = false) {
        super(path, provider);
        this.setConfig('$type', type);
        this._saveValue = saveValue;
        if (writable < Permission.NEVER) {
            this.setConfig('$writable', Permission.names[writable]);
        }
    }
    save() {
        let data = super.save();
        if (this._saveValue) {
            data['?value'] = this._value;
        }
        return data;
    }
    load(data) {
        super.load(data);
        if (this._saveValue && data.hasOwnProperty('?value')) {
            this.setValue(data['?value']);
        }
    }
    onValueChange(newValue) {
        let changed = super.onValueChange(newValue);
        if (changed && this._saveValue) {
            this.provider.save();
        }
        return changed;
    }
}
//# sourceMappingURL=value-node.js.map
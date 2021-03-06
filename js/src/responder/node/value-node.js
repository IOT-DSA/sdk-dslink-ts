"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueNode = void 0;
const base_local_node_1 = require("../base-local-node");
const permission_1 = require("../../common/permission");
/**
 * base class for a serializable value node
 */
class ValueNode extends base_local_node_1.BaseLocalNode {
    constructor(path, provider, type = 'dynamic', writable = permission_1.Permission.NEVER, saveValue = false) {
        super(path, provider);
        this.setConfig('$type', type);
        this._saveValue = saveValue;
        if (writable < permission_1.Permission.NEVER) {
            this.setConfig('$writable', permission_1.Permission.names[writable]);
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
exports.ValueNode = ValueNode;
//# sourceMappingURL=value-node.js.map
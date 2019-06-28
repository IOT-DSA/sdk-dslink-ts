"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_local_node_1 = require("../base_local_node");
const permission_1 = require("../../common/permission");
class ValueNode extends base_local_node_1.BaseLocalNode {
    constructor(path, provider, profileName = 'node', type = 'dynamic', writtable = permission_1.Permission.NEVER) {
        super(path, provider, profileName);
        this.setConfig('$type', type);
        if (writtable < permission_1.Permission.NEVER) {
            this.setConfig('$writable', permission_1.Permission.names[writtable]);
        }
    }
    save() {
        let data = super.save();
        data['?value'] = this._value;
        return data;
    }
    load(data) {
        super.load(data);
        if (data.hasOwnProperty('?value')) {
            this._value = data;
        }
    }
}
exports.ValueNode = ValueNode;
//# sourceMappingURL=ValueNode.js.map
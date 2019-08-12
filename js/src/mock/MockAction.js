"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_local_node_1 = require("../responder/base-local-node");
const permission_1 = require("../common/permission");
const interfaces_1 = require("../common/interfaces");
class MockActionNode extends base_local_node_1.BaseLocalNode {
    invoke(params, response, parentNode, maxPermission = permission_1.Permission.CONFIG) {
        if (this.onInvoke) {
            let rslt = this.onInvoke(params);
            if (Array.isArray((rslt))) {
                response.updateStream(rslt);
            }
            else if (rslt != null && rslt.__proto__ === Object.prototype) {
                let columns = [];
                let out = [];
                for (let x in rslt) {
                    columns.push({
                        "name": x,
                        "type": "dynamic"
                    });
                    out.push(rslt[x]);
                }
                response.updateStream([out], { columns });
            }
        }
        else {
            response.close(interfaces_1.DsError.NOT_IMPLEMENTED);
        }
    }
    shouldSaveConfig(key) {
        return true;
    }
    load(data) {
        super.load(data);
        if (typeof data['?invoke'] === 'function') {
            this.onInvoke = data['?invoke'];
        }
    }
}
exports.MockActionNode = MockActionNode;
//# sourceMappingURL=MockAction.js.map
import { BaseLocalNode } from '../responder/base-local-node';
import { Permission } from '../common/permission';
import { DsError } from '../common/interfaces';
export class MockActionNode extends BaseLocalNode {
    invoke(params, response, parentNode, maxPermission = Permission.CONFIG) {
        if (this.onInvoke) {
            let rslt = this.onInvoke(params);
            if (Array.isArray(rslt)) {
                response.updateStream(rslt);
            }
            else if (rslt != null && rslt.__proto__ === Object.prototype) {
                let columns = [];
                let out = [];
                for (let x in rslt) {
                    columns.push({
                        name: x,
                        type: 'dynamic'
                    });
                    out.push(rslt[x]);
                }
                response.updateStream([out], { columns });
            }
        }
        else {
            response.close(DsError.NOT_IMPLEMENTED);
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
//# sourceMappingURL=MockAction.js.map
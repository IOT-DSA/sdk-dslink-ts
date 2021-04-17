import { LocalNode } from '../node_state';
import { Permission } from '../../common/permission';
import { DsError } from '../../common/interfaces';
import { Table } from '../../common/table';
export class ActionNode extends LocalNode {
    constructor(path, provider, invokable = Permission.WRITE) {
        super(path, provider);
        this.setConfig('$invokable', Permission.names[invokable]);
    }
    /**
     *  Override this to have simple customized invoke callback
     */
    onInvoke(params, parentNode, maxPermission = Permission.CONFIG) { }
    /**
     *  Called by the link internals to invoke this node.
     *  Override this to have a full customized invoke callback
     */
    invoke(params, response, parentNode, maxPermission = Permission.CONFIG) {
        let result;
        try {
            result = this.onInvoke(params, parentNode, maxPermission);
        }
        catch (err) {
            let error = new DsError('invokeException', { msg: String(err) });
            response.close(error);
            return response;
        }
        let rtype = 'values';
        if (this.configs.has('$result')) {
            rtype = this.configs.get('$result');
        }
        function sendResult(rslt) {
            if (rslt == null) {
                // Create a default result based on the result type
                if (rtype === 'values') {
                    rslt = {};
                }
                else if (rtype === 'table') {
                    rslt = [];
                }
                else if (rtype === 'stream') {
                    rslt = [];
                }
            }
            if (Array.isArray(rslt)) {
                response.updateStream(rslt, { streamStatus: 'closed' });
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
                response.updateStream([out], { columns, streamStatus: 'closed' });
            }
            else if (rslt instanceof Table) {
                response.updateStream(rslt.rows, { columns: rslt.columns, streamStatus: 'closed' });
            }
            else if (rslt instanceof DsError) {
                response.close(rslt);
            }
            else if (rslt instanceof Promise) {
                rslt.then(sendResult).catch((e) => {
                    let error = new DsError('invokeException', { msg: String(e) });
                    response.close(error);
                });
            }
            else {
                response.close();
            }
        }
        sendResult(result);
    }
}
//# sourceMappingURL=action-node.js.map
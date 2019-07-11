"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_state_1 = require("../node_state");
const permission_1 = require("../../common/permission");
const interfaces_1 = require("../../common/interfaces");
const table_1 = require("../../common/table");
class ActionNode extends node_state_1.LocalNode {
    constructor(path, provider, profileName = 'node', invokable = permission_1.Permission.WRITE) {
        super(path, provider, profileName);
        this.setConfig('$invokable', permission_1.Permission.names[invokable]);
    }
    /**
     *  Override this to have simple customized invoke callback
     */
    onInvoke(params, parentNode, maxPermission = permission_1.Permission.CONFIG) {
    }
    /**
     *  Called by the link internals to invoke this node.
     *  Override this to have a full customized invoke callback
     */
    invoke(params, responder, response, parentNode, maxPermission = permission_1.Permission.CONFIG) {
        let rslt;
        try {
            rslt = this.onInvoke(params, parentNode, maxPermission);
        }
        catch (err) {
            let error = new interfaces_1.DSError("invokeException", { msg: String(err) });
            response.close(error);
            return response;
        }
        let rtype = "values";
        if (this.configs.has("$result")) {
            rtype = this.configs.get("$result");
        }
        if (rslt == null) {
            // Create a default result based on the result type
            if (rtype === "values") {
                rslt = {};
            }
            else if (rtype === "table") {
                rslt = [];
            }
            else if (rtype === "stream") {
                rslt = [];
            }
        }
        if (Array.isArray((rslt))) {
            response.updateStream(rslt, { streamStatus: interfaces_1.StreamStatus.closed });
        }
        else if (rslt != null && rslt instanceof Object) {
            let columns = [];
            let out = [];
            for (let x in rslt) {
                columns.push({
                    "name": x,
                    "type": "dynamic"
                });
                out.push(rslt[x]);
            }
            response.updateStream([out], { columns, streamStatus: interfaces_1.StreamStatus.closed });
        }
        else if (rslt instanceof table_1.Table) {
            response.updateStream(rslt.rows, { columns: rslt.columns, streamStatus: interfaces_1.StreamStatus.closed });
        }
        else {
            response.close();
        }
    }
}
exports.ActionNode = ActionNode;
//# sourceMappingURL=ActionNode.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async_1 = require("../../utils/async");
const permission_1 = require("../../common/permission");
const interface_1 = require("../interface");
/** @ignore */
class SetController {
    constructor(requester, path, value, maxPermission = permission_1.Permission.CONFIG) {
        this.completer = new async_1.Completer();
        this.requester = requester;
        this.path = path;
        this.value = value;
        let reqMap = {
            method: 'set',
            path: path,
            value: value
        };
        if (maxPermission !== permission_1.Permission.CONFIG) {
            reqMap['permit'] = permission_1.Permission.names[maxPermission];
        }
        this._request = requester._sendRequest(reqMap, this);
    }
    get future() {
        return this.completer.future;
    }
    onUpdate(status, updates, columns, meta, error) {
        // TODO implement error
        this.completer.complete(new interface_1.RequesterUpdate(status, error));
    }
    onDisconnect() { }
    onReconnect() { }
}
exports.SetController = SetController;
//# sourceMappingURL=set.js.map
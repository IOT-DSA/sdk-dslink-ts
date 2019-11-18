"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async_1 = require("../../utils/async");
const interface_1 = require("../interface");
/** @ignore */
class RemoveController {
    constructor(requester, path) {
        this.completer = new async_1.Completer();
        this.requester = requester;
        this.path = path;
        let reqMap = {
            method: 'remove',
            path: path
        };
        this._request = requester._sendRequest(reqMap, this);
    }
    get future() {
        return this.completer.future;
    }
    onUpdate(status, updates, columns, meta, error) {
        // TODO implement error
        this.completer.complete(new interface_1.RequesterUpdate(status));
    }
    onDisconnect() { }
    onReconnect() { }
}
exports.RemoveController = RemoveController;
//# sourceMappingURL=remove.js.map
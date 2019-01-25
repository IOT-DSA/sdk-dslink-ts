import { Completer } from "../../utils/async";
import { Permission } from "../../common/permission";
import { RequesterUpdate } from "../interface";
export class SetController {
    constructor(requester, path, value, maxPermission = Permission.CONFIG) {
        this.completer = new Completer();
        this.requester = requester;
        this.path = path;
        this.value = value;
        let reqMap = {
            'method': 'set',
            'path': path,
            'value': value
        };
        if (maxPermission !== Permission.CONFIG) {
            reqMap['permit'] = Permission.names[maxPermission];
        }
        this._request = requester._sendRequest(reqMap, this);
    }
    get future() {
        return this.completer.future;
    }
    onUpdate(status, updates, columns, meta, error) {
        // TODO implement error
        this.completer.complete(new RequesterUpdate(status));
    }
    onDisconnect() {
    }
    onReconnect() {
    }
}
//# sourceMappingURL=set.js.map
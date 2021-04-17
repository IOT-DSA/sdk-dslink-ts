import { Completer } from '../../utils/async';
import { RequesterUpdate } from '../interface';
/** @ignore */
export class RemoveController {
    constructor(requester, path) {
        this.completer = new Completer();
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
        this.completer.complete(new RequesterUpdate(status));
    }
    onDisconnect() { }
    onReconnect() { }
}
//# sourceMappingURL=remove.js.map
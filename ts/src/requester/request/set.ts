import {Requester} from "../requester";
import {Request} from "../request";
import {Completer} from "../../utils/async";
import {Permission} from "../../common/permission";
import {DsError, StreamStatus} from "../../common/interfaces";
import {RequesterUpdate, RequestUpdater} from "../interface";

/** @ignore */
export class SetController implements RequestUpdater {
  readonly completer: Completer<RequesterUpdate> = new Completer<RequesterUpdate>();

  get future() {
    return this.completer.future;
  }

  readonly requester: Requester;
  readonly path: string;
  readonly value: any;
  _request: Request;

  constructor(requester: Requester, path: string, value: any, maxPermission: number = Permission.CONFIG) {
    this.requester = requester;
    this.path = path;
    this.value = value;

    let reqMap: any = {
      'method': 'set',
      'path': path,
      'value': value
    };

    if (maxPermission !== Permission.CONFIG) {
      reqMap['permit'] = Permission.names[maxPermission];
    }

    this._request = requester._sendRequest(reqMap, this);
  }

  onUpdate(status: StreamStatus, updates: any[], columns: any[], meta: object, error: DsError) {
    // TODO implement error
    this.completer.complete(new RequesterUpdate(status));
  }

  onDisconnect() {
  }

  onReconnect() {
  }
}

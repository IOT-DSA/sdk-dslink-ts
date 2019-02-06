import {Requester} from "../requester";
import {Request} from "../Request";
import {Completer} from "../../utils/async";
import {DSError} from "../../common/interfaces";
import {RequesterUpdate, RequestUpdater} from "../interface";

/** @ignore */
export class RemoveController implements RequestUpdater {
  readonly completer: Completer<RequesterUpdate> = new Completer<RequesterUpdate>();

  get future() {
    return this.completer.future;
  }

  readonly requester: Requester;
  readonly path: string;
  _request: Request;

  constructor(requester: Requester, path: string) {
    this.requester = requester;
    this.path = path;

    let reqMap = {
      'method': 'remove',
      'path': path
    };

    this._request = requester._sendRequest(reqMap, this);
  }

  onUpdate(status: string, updates: any[], columns: any[], meta: object, error: DSError) {
    // TODO implement error
    this.completer.complete(new RequesterUpdate(status));
  }

  onDisconnect() {
  }

  onReconnect() {
  }
}

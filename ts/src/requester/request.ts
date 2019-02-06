/// request class handles raw response from responder
import {Requester} from "./requester";
import {DSError, StreamStatus} from "../common/interfaces";
import {RequestUpdater} from "./interface";

export class Request {
  readonly requester: Requester;
  readonly rid: number;
  readonly data: { [key: string]: any };

  /// raw request callback
  readonly updater: RequestUpdater;
  _isClosed: boolean = false;
  get isClosed(): boolean {
    return this._isClosed;
  }

  constructor(requester: Requester, rid: number, updater: RequestUpdater, data: { [key: string]: any }) {
    this.requester = requester;
    this.rid = rid;
    this.updater = updater;
    this.data = data;
  }

  streamStatus: string = StreamStatus.initialize;

  /// resend the data if previous sending failed
  resend() {
    this.requester.addToSendList(this.data);
  }

  addReqParams(m: { [key: string]: any }) {
    this.requester.addToSendList({'rid': this.rid, 'params': m});
  }

  _update(m: { [key: string]: any }) {
    if (typeof m["stream"] === 'string') {
      this.streamStatus = m["stream"];
    }
    let updates: any[];
    let columns: any[];
    let meta: object;
    if (Array.isArray(m["updates"])) {
      updates = m["updates"];
    }
    if (Array.isArray(m["columns"])) {
      columns = m["columns"];
    }
    if (m["meta"] instanceof Object) {
      meta = m["meta"];
    }
    // remove the request from global object
    if (this.streamStatus === StreamStatus.closed) {
      this.requester._requests.delete(this.rid);
    }
    let error: DSError;
    if (m.hasOwnProperty("error") && m["error"] instanceof Object) {
      error = DSError.fromMap(m["error"]);
      this.requester.onError.add(error);
    }

    this.updater.onUpdate(this.streamStatus, updates, columns, meta, error);
  }

  /// close the request and finish data
  _close(error: DSError) {
    if (this.streamStatus != StreamStatus.closed) {
      this.streamStatus = StreamStatus.closed;
      this.updater.onUpdate(StreamStatus.closed, null, null, null, error);
    }
  }

  /// close the request from the client side
  close() {
    // _close will also be called later from the requester;
    this.requester.closeRequest(this);
  }
}

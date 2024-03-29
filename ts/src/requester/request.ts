/// request class handles raw response from responder
import {Requester} from './requester';
import {DsError, StreamStatus} from '../common/interfaces';
import {RequestUpdater} from './interface';

export class Request {
  readonly requester: Requester;
  readonly rid: number;
  readonly data: {[key: string]: any};

  /// raw request callback
  readonly updater: RequestUpdater;
  _isClosed: boolean = false;
  get isClosed(): boolean {
    return this._isClosed;
  }

  constructor(requester: Requester, rid: number, updater: RequestUpdater, data: {[key: string]: any}) {
    this.requester = requester;
    this.rid = rid;
    this.updater = updater;
    this.data = data;
  }

  streamStatus: StreamStatus = 'initialize';

  /// resend the data if previous sending failed
  resend() {
    this.streamStatus = 'initialize';
    this.requester.addToSendList(this.data);
  }

  _update(m: {[key: string]: any}) {
    if (typeof m['stream'] === 'string') {
      this.streamStatus = m['stream'] as StreamStatus;
    }
    let updates: any[];
    let columns: any[];
    let meta: object;
    if (Array.isArray(m['updates'])) {
      updates = m['updates'];
    }
    if (Array.isArray(m['columns'])) {
      columns = m['columns'];
    }
    if (m['meta'] instanceof Object) {
      meta = m['meta'];
    }
    // remove the request from global object
    if (this.streamStatus === 'closed') {
      this.requester._requests.delete(this.rid);
    }
    let error: DsError;
    if (m.hasOwnProperty('error') && m['error'] instanceof Object) {
      error = DsError.fromMap(m['error']);
      this.requester.onError.add(error);
    }

    this.updater.onUpdate(this.streamStatus, updates, columns, meta, error);
  }

  /// close the request and finish data
  _close(error: DsError) {
    if (this.streamStatus != 'closed') {
      this.streamStatus = 'closed';
      this.updater.onUpdate('closed', null, null, null, error);
    }
  }

  /// close the request from the client side
  close() {
    // _close will also be called later from the requester;
    this.requester.closeRequest(this);
  }
}

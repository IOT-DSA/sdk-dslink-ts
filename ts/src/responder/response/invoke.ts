// part of dslink.responder;

import {Response} from '../response';
import {LocalNode} from '../node_state';
import {Responder} from '../responder';
import {DsError, StreamStatus} from '../../common/interfaces';
import {TableColumn} from '../../common/table';

export type OnInvokeClosed = (response: InvokeResponse) => void;
export type OnInvokeSend = (response: InvokeResponse, m: any) => void;

/// return true if params are valid
export type OnReqParams = (resp: InvokeResponse, m: any) => boolean;

class InvokeResponseUpdate {
  status: StreamStatus;
  columns: any[];
  updates: any[];
  meta: {[key: string]: any};

  constructor(status: StreamStatus, updates: any[], columns: any[], meta: {[key: string]: any}) {
    this.status = status;
    this.updates = updates;
    this.columns = columns;
    this.meta = meta;
  }
}

export class InvokeResponse extends Response {
  readonly parentNode: LocalNode;
  readonly node: LocalNode;
  readonly name: string;

  constructor(responder: Responder, rid: number, parentNode: LocalNode, node: LocalNode, name: string) {
    super(responder, rid, 'invoke');
    this.parentNode = parentNode;
    this.node = node;
    this.name = name;
  }

  /** @ignore */
  pendingData: InvokeResponseUpdate[] = [];
  /** @ignore */
  _hasSentColumns: boolean = false;

  /** @ignore
   *  update data for the responder stream
   */
  updateStream(
    updates: any[],
    options: {
      columns?: any[];
      streamStatus?: StreamStatus;
      meta?: {[key: string]: any};
      autoSendColumns?: boolean;
    } = {}
  ) {
    let {columns, streamStatus, meta, autoSendColumns} = options;
    if (!streamStatus) {
      streamStatus = 'closed';
    }
    if (meta != null && meta['mode'] === 'refresh') {
      this.pendingData.length = 0;
    }

    if (!this._hasSentColumns) {
      if (
        columns == null &&
        autoSendColumns !== false &&
        this.node != null &&
        Array.isArray(this.node.configs.get('$columns'))
      ) {
        columns = this.node.configs.get('$columns');
      }
    }

    if (columns != null) {
      this._hasSentColumns = true;
    }

    this.pendingData.push(new InvokeResponseUpdate(streamStatus, updates, columns, meta));
    this.prepareSending();
  }

  /** @ignore */
  onReqParams: OnReqParams;

  /** @ignore
   *  new parameter from the requester
   */
  updateReqParams(m: any) {
    if (this.onReqParams != null) {
      this.onReqParams(this, m);
    }
  }

  /** @ignore */
  startSendingData(currentTime: number, waitingAckId: number) {
    this._pendingSending = false;
    if (this._err != null) {
      this.responder.closeResponse(this.rid, this, this._err);
      if (this._sentStreamStatus === 'closed') {
        this._close();
      }
      return;
    }

    let totalRows = 0;
    for (let i = 0; i < this.pendingData.length; ++i) {
      let update = this.pendingData[i];
      let outColumns: any[];
      if (update.columns != null) {
        outColumns = TableColumn.serializeColumns(update.columns);
      }
      // dont send more than 64 rows in one message frame
      if (update.updates?.length + totalRows > 64) {
        let count = 64 - totalRows;
        if (count > 0) {
          this.responder.updateResponse(this, update.updates.slice(0, count), {
            columns: outColumns
          });
          // dont resend rows and columns that's already sent
          update.updates = update.updates.slice(count);
          update.columns = null;
        }
        this.pendingData = this.pendingData.slice(i);
        this.prepareSending();
        return;
      }
      totalRows += update.updates?.length || 0;

      this.responder.updateResponse(this, update.updates, {
        streamStatus: update.status,
        columns: outColumns,
        meta: update.meta
        // handleMap: (m) {
        //   if (onSendUpdate != null) {
        //     onSendUpdate(this, m);
        //   }
        // }
      });

      if (this._sentStreamStatus === 'closed') {
        this._close();
        break;
      }
    }
    this.pendingData.length = 0;
  }

  /// close the request from responder side and also notify the requester
  close(err: DsError = null) {
    if (err != null) {
      this._err = err;
    }
    if (this.pendingData.length) {
      this.pendingData[this.pendingData.length].status = 'closed';
    } else {
      this.pendingData.push(new InvokeResponseUpdate('closed', null, null, null));
      this.prepareSending();
    }
  }

  /** @ignore */
  _err: DsError;

  onClose: OnInvokeClosed;
  onSendUpdate: OnInvokeSend;

  /** @ignore */
  _close() {
    if (this.onClose != null) {
      this.onClose(this);
    }
  }
}

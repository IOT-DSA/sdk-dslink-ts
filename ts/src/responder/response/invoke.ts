// part of dslink.responder;

import {Response} from "../response";
import {LocalNode} from "../node_state";
import {Responder} from "../responder";
import {DSError, StreamStatus} from "../../common/interfaces";
import {TableColumn} from "../../common/table";

export type OnInvokeClosed = (response: InvokeResponse) => void;
export type OnInvokeSend = (response: InvokeResponse, m: any) => void;

/// return true if params are valid
export type OnReqParams = (resp: InvokeResponse, m: any) => boolean;

class InvokeResponseUpdate {
  status: string;
  columns: any[];
  updates: any[];
  meta: {[key: string]: any};

  constructor(status: string, updates: any[], columns: any[], meta: {[key: string]: any}) {
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

  pendingData: InvokeResponseUpdate[] = [];

  _hasSentColumns: boolean = false;

  /// update data for the responder stream
  updateStream(updates: any[],
               options: {
                 columns?: any[], streamStatus?: string,
                 meta?: {[key: string]: any}, autoSendColumns?: boolean
               } = {}) {
    let {columns, streamStatus, meta, autoSendColumns} = options;
    if (!streamStatus) {
      streamStatus = StreamStatus.closed;
    }
    if (meta != null && meta['mode'] === 'refresh') {
      this.pendingData.length = 0;
    }

    if (!this._hasSentColumns) {
      if (columns == null &&
        autoSendColumns !== false &&
        this.node != null &&
        Array.isArray(this.node.configs.get("$columns"))) {
        columns = this.node.configs.get("$columns");
      }
    }

    if (columns != null) {
      this._hasSentColumns = true;
    }

    this.pendingData.push(
      new InvokeResponseUpdate(streamStatus, updates, columns, meta)
    );
    this.prepareSending();
  }

  onReqParams: OnReqParams;

  /// new parameter from the requester
  updateReqParams(m: any) {
    if (this.onReqParams != null) {
      this.onReqParams(this, m);
    }
  }

  startSendingData(currentTime: number, waitingAckId: number) {
    this._pendingSending = false;
    if (this._err != null) {
      this.responder.closeResponse(this.rid, this, this._err);
      if (this._sentStreamStatus === StreamStatus.closed) {
        this._close();
      }
      return;
    }

    for (let update of this.pendingData) {
      let outColumns: any[];
      if (update.columns != null) {
        outColumns = TableColumn.serializeColumns(update.columns);
      }

      this.responder.updateResponse(
        this,
        update.updates,
        {
          streamStatus: update.status,
          columns: outColumns,
          meta: update.meta,
          // handleMap: (m) {
          //   if (onSendUpdate != null) {
          //     onSendUpdate(this, m);
          //   }
          // }
        }
      );

      if (this._sentStreamStatus === StreamStatus.closed) {
        this._close();
        break;
      }
    }
    this.pendingData.length = 0;
  }

  /// close the request from responder side and also notify the requester
  close(err: DSError = null) {
    if (err != null) {
      this._err = err;
    }
    if (this.pendingData.length) {
      this.pendingData[this.pendingData.length].status = StreamStatus.closed;
    } else {
      this.pendingData.push(
        new InvokeResponseUpdate(StreamStatus.closed, null, null, null)
      );
      this.prepareSending();
    }
  }

  _err: DSError;

  onClose: OnInvokeClosed;
  onSendUpdate: OnInvokeSend;

  _close() {
    if (this.onClose != null) {
      this.onClose(this);
    }
  }
}

// part of dslink.responder;

export type OnInvokeClosed = (response: InvokeResponse) => void;
export type OnInvokeSend = (response: InvokeResponse, object m) => void;

/// return true if params are valid
export type OnReqParams = (resp: InvokeResponse, object m) => boolean;

class _InvokeResponseUpdate {
  status: string;
  columns: List;
  updates: List;
  meta: object;

  _InvokeResponseUpdate(this.status, this.updates, this.columns, this.meta);
}

export class InvokeResponse  extends Response {
  final parentNode: LocalNode;
  final node: LocalNode;
  final name: string;

  InvokeResponse(responder: Responder, rid:number, this.parentNode, this.node, this.name)
      : super(responder, rid, 'invoke');

  pendingData: _InvokeResponseUpdate[] = new _InvokeResponseUpdate[]();

  _hasSentColumns: boolean = false;

  /// update data for the responder stream
  updateStream(updates: List,
      {columns: List, string streamStatus: StreamStatus.open,
        let meta: object, boolean autoSendColumns: true}) {
    if (meta != null && meta['mode'] == 'refresh') {
      pendingData.length = 0;
    }

    if (!_hasSentColumns) {
      if (columns == null &&
        autoSendColumns &&
        node != null &&
        node.configs[r"$columns"] is List) {
        columns = node.configs[r"$columns"];
      }
    }

    if (columns != null) {
      _hasSentColumns = true;
    }

    pendingData.add(
      new _InvokeResponseUpdate(streamStatus, updates, columns, meta)
    );
    prepareSending();
  }

  onReqParams: OnReqParams;
  /// new parameter from the requester
  updateReqParams(object m) {
    if (onReqParams != null) {
      onReqParams(this, m);
    }
  }

  @override
  startSendingData(currentTime:number, waitingAckId:number) {
    _pendingSending = false;
    if ( this._err != null) {
      responder.closeResponse(rid, response: this, error: _err);
      if ( this._sentStreamStatus == StreamStatus.closed) {
        _close();
      }
      return;
    }

    for (_InvokeResponseUpdate update in pendingData) {
      List<{[key: string]: dynamic}> outColumns;
      if (update.columns != null) {
        outColumns = TableColumn.serializeColumns(update.columns);
      }

      responder.updateResponse(
        this,
        update.updates,
        streamStatus: update.status,
        columns: outColumns,
        meta: update.meta, handleMap: (m) {
        if (onSendUpdate != null) {
          onSendUpdate(this, m);
        }
      });

      if ( this._sentStreamStatus == StreamStatus.closed) {
        _close();
        break;
      }
    }
    pendingData.length = 0;
  }

  /// close the request from responder side and also notify the requester
  close(err: DSError = null) {
    if (err != null) {
      _err = err;
    }
    if (!pendingData.isEmpty) {
      pendingData.last.status = StreamStatus.closed;
    } else {
      pendingData.add(
        new _InvokeResponseUpdate(StreamStatus.closed, null, null, null)
      );
      prepareSending();
    }
  }

  _err: DSError;

  onClose: OnInvokeClosed;
  onSendUpdate: OnInvokeSend;

  _close() {
    if (onClose != null) {
      onClose(this);
    }
  }

  /// for the broker trace action
  getTraceData(change: string = '+'):ResponseTrace {
    return new ResponseTrace(parentNode.path, 'invoke', rid, change, name);
  }
}

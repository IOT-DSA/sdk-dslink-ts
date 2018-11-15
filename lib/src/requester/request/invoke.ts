// part of dslink.requester;

export class RequesterInvokeUpdate  extends RequesterUpdate {
  rawColumns: List;
  columns: TableColumn[];
  updates: List;
  error: DSError;
  meta: object;

  RequesterInvokeUpdate(this.updates, this.rawColumns, this.columns,
      let streamStatus: string,
      {this.meta, this.error})
      : super(streamStatus);

  _rows: List[];

  get rows(): List[] {
    colLen:number = -1;
    if (columns != null) {
      colLen = columns.length;
    }
    if ( this._rows == null) {
      _rows = [];
      if (updates == null) {
        return this._rows;
      }
      for (object obj in updates) {
        let row: dynamic[];
        if ( Array.isArray(obj) ) {
          if (obj.length < colLen) {
            row = obj.toList();
            for (int i = obj.length; i < colLen; ++i) {
              row.add(columns[i].defaultValue);
            }
          } else if (obj.length > colLen) {
            if (colLen == -1) {
              // when column is unknown, just return all values
              row = obj.toList();
            } else {
              row = obj.sublist(0, colLen);
            }
          } else {
            row = obj;
          }
        } else if ( (obj != null && obj instanceof Object) ) {
          row = [];
          if (columns == null) {
            let map: object = obj;
            let keys: string[] = map.keys.map((k) => k.toString()).toList();
            columns = keys.map((x) => new TableColumn(x, "dynamic")).toList();
          }

          if (columns != null) {
            for (TableColumn column in columns) {
              if (obj.containsKey(column.name)) {
                row.add(obj[column.name]);
              } else {
                row.add(column.defaultValue);
              }
            }
          }
        }
        _rows.add(row);
      }
    }
    return this._rows;
  }
}

export class InvokeController  implements RequestUpdater {
  static getNodeColumns(node: RemoteNode):TableColumn[] {
    columns: object = node.getConfig(r'$columns');
    if ( !Array.isArray(columns) && node.profile != null) {
      columns = node.profile.getConfig(r'$columns');
    }
    if ( Array.isArray(columns) ) {
      return TableColumn.parseColumns(columns);
    }
    return null;
  }

  final node: RemoteNode;
  final requester: Requester;

  _controller: StreamController<RequesterInvokeUpdate>;
  _stream: Stream<RequesterInvokeUpdate>;
  _request: Request;
  _cachedColumns: TableColumn[];

  mode: string = 'stream';
  lastStatus: string = StreamStatus.initialize;

  InvokeController(this.node, this.requester, params: object,
      [maxPermission:number = Permission.CONFIG, RequestConsumer fetchRawReq]) {
    _controller = new StreamController<RequesterInvokeUpdate>();
    _controller.done.then( this._onUnsubscribe);
    _stream = this._controller.stream;
    var reqMap = <string, dynamic>{
      'method': 'invoke',
      'path': node.remotePath,
      'params': params
    };

    if (maxPermission != Permission.CONFIG) {
      reqMap['permit'] = Permission.names[maxPermission];
    }
// TODO: update node before invoke to load columns
//    if(!node.isUpdated()) {
//      node._list().listen( this._onNodeUpdate)
//    } else {

    _request = requester._sendRequest(reqMap, this);

    if (fetchRawReq != null) {
      fetchRawReq( this._request);
    }
//    }
  }

  _onUnsubscribe(obj) {
    if ( this._request != null && this._request.streamStatus != StreamStatus.closed) {
      _request.close();
    }
  }

  onUpdate(streamStatus: string, updates: List, columns: List, meta: object,
      let error: DSError) {
    if (meta != null && typeof meta['mode'] === 'string') {
      mode = meta['mode'];
    }
    // TODO: implement error
    if (columns != null) {
      if ( this._cachedColumns == null || mode == 'refresh') {
        _cachedColumns = TableColumn.parseColumns(columns);
      } else {
        _cachedColumns.addAll(TableColumn.parseColumns(columns));
      }
    } else if ( this._cachedColumns == null) {
      _cachedColumns = getNodeColumns(node);
    }

    if (error != null) {
      streamStatus = StreamStatus.closed;
      _controller.add(
          new RequesterInvokeUpdate(
              null, null, null, streamStatus, error: error, meta: meta));
    } else if (updates != null || meta != null || streamStatus != lastStatus) {
      _controller.add(new RequesterInvokeUpdate(
          updates, columns, this._cachedColumns, streamStatus, meta: meta));
    }
    lastStatus = streamStatus;
    if (streamStatus == StreamStatus.closed) {
      _controller.close();
    }
  }

  void onDisconnect() {}

  void onReconnect() {}
}

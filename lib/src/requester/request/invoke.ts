import {Requester} from "../requester";
import {Request} from "../Request";
import {Completer, Stream} from "../../utils/async";
import {Permission} from "../../common/permission";
import {DSError, StreamStatus} from "../../common/interfaces";
import {TableColumn} from "../../common/table";
import {RemoteNode} from "../node_cache";
import {RequesterUpdate, RequestUpdater} from "../interface";

export class RequesterInvokeUpdate extends RequesterUpdate {
  rawColumns: any[];
  columns: TableColumn[];
  updates: any[];
  error: DSError;
  meta: {[key: string]: any};

  constructor(updates: any[], rawColumns: any[], columns: TableColumn[],
              streamStatus: string,
              meta: {[key: string]: any}, error?: DSError) {
    super(streamStatus);
    this.updates = updates;
    this.rawColumns = rawColumns;
    this.meta = meta;
    this.error = error;
  }


  _rows: any[][];

  get rows(): any[][] {
    let colLen = -1;
    if (this.columns != null) {
      colLen = this.columns.length;
    }
    if (this._rows == null) {
      this._rows = [];
      if (this.updates == null) {
        return this._rows;
      }
      for (let obj of this.updates) {
        let row: any[];
        if (Array.isArray(obj)) {
          if (obj.length < colLen) {
            row = obj.concat();
            for (let i = obj.length; i < colLen; ++i) {
              row.push(this.columns[i].defaultValue);
            }
          } else if (obj.length > colLen) {
            if (colLen === -1) {
              // when column is unknown, just return all values
              row = obj.concat();
            } else {
              row = obj.slice(0, colLen);
            }
          } else {
            row = obj;
          }
        } else if ((obj != null && obj instanceof Object)) {
          row = [];
          if (this.columns == null) {
            let keys: string[] = obj.keys;
            this.columns = keys.map((x) => new TableColumn(x, "dynamic"));
          }

          if (this.columns != null) {
            for (let column of this.columns) {
              if (obj.hasOwnProperty(column.name)) {
                row.push(obj[column.name]);
              } else {
                row.push(column.defaultValue);
              }
            }
          }
        }
        this._rows.push(row);
      }
    }
    return this._rows;
  }
}

export class RequesterInvokeStream extends Stream<RequesterInvokeUpdate> {
  requester: RequesterInvokeStream;
}


export class InvokeController implements RequestUpdater {
  static getNodeColumns(node: RemoteNode): TableColumn[] {
    let columns = node.getConfig('$columns');
    if (!Array.isArray(columns) && node.profile != null) {
      columns = node.profile.getConfig('$columns');
    }
    if (Array.isArray(columns)) {
      return TableColumn.parseColumns(columns);
    }
    return null;
  }

  readonly node: RemoteNode;
  readonly requester: Requester;

  _stream: RequesterInvokeStream;
  _request: Request;
  _cachedColumns: TableColumn[];

  mode: string = 'stream';
  lastStatus: string = StreamStatus.initialize;

  constructor(node: RemoteNode, requester: Requester, params: object,
              maxPermission = Permission.CONFIG) {
    this.node = node;
    this.requester = requester;
    this._stream = new RequesterInvokeStream();
    this._stream.requester = this.requester;
    this._stream._onClose = this._onUnsubscribe;
    let reqMap: any = {
      'method': 'invoke',
      'path': node.remotePath,
      'params': params
    };

    if (maxPermission !== Permission.CONFIG) {
      reqMap['permit'] = Permission.names[maxPermission];
    }
// TODO: update node before invoke to load columns
//    if(!node.isUpdated()) {
//      node._list().listen( this._onNodeUpdate)
//    } else {

    this._request = requester._sendRequest(reqMap, this);


//    }
  }

  _onUnsubscribe = (obj?: any) => {
    if (this._request != null && this._request.streamStatus !== StreamStatus.closed) {
      this._request.close();
    }
  };

  onUpdate(streamStatus: string, updates: any[], columns: any[], meta: {[key: string]: any},
           error: DSError) {
    if (meta != null && typeof meta['mode'] === 'string') {
      this.mode = meta['mode'];
    }
    // TODO: implement error
    if (columns != null) {
      if (this._cachedColumns == null || this.mode === 'refresh') {
        this._cachedColumns = TableColumn.parseColumns(columns);
      } else {
        this._cachedColumns = this._cachedColumns.concat(TableColumn.parseColumns(columns));
      }
    } else if (this._cachedColumns == null) {
      this._cachedColumns = InvokeController.getNodeColumns(this.node);
    }

    if (error != null) {
      streamStatus = StreamStatus.closed;
      this._stream.add(
        new RequesterInvokeUpdate(
          null, null, null, streamStatus, meta, error));
    } else if (updates != null || meta != null || streamStatus !== this.lastStatus) {
      this._stream.add(new RequesterInvokeUpdate(
        updates, columns, this._cachedColumns, streamStatus, meta));
    }
    this.lastStatus = streamStatus;
    if (streamStatus === StreamStatus.closed) {
      this._stream.close();
    }
  }

  onDisconnect() {
  }

  onReconnect() {
  }
}

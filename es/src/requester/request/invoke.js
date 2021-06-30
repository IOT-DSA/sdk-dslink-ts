import { Stream } from '../../utils/async';
import { Permission } from '../../common/permission';
import { TableColumn } from '../../common/table';
import { RequesterUpdate } from '../interface';
export class RequesterInvokeUpdate extends RequesterUpdate {
    constructor(updates, rawColumns, columns, streamStatus, meta, error) {
        super(streamStatus, error);
        this.updates = updates;
        if (rawColumns) {
            this.rawColumns = rawColumns;
            this.columns = TableColumn.parseColumns(rawColumns);
        }
        else {
            this.columns = columns;
        }
        this.meta = meta;
    }
    get rows() {
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
                let row;
                if (Array.isArray(obj)) {
                    if (obj.length < colLen) {
                        row = obj.concat();
                        for (let i = obj.length; i < colLen; ++i) {
                            row.push(this.columns[i].defaultValue);
                        }
                    }
                    else if (obj.length > colLen) {
                        if (colLen === -1) {
                            // when column is unknown, just return all values
                            row = obj.concat();
                        }
                        else {
                            row = obj.slice(0, colLen);
                        }
                    }
                    else {
                        row = obj;
                    }
                }
                else if (obj != null && obj instanceof Object) {
                    row = [];
                    if (this.columns == null) {
                        let keys = obj.keys;
                        this.columns = keys.map((x) => new TableColumn(x, 'dynamic'));
                    }
                    if (this.columns != null) {
                        for (let column of this.columns) {
                            if (obj.hasOwnProperty(column.name)) {
                                row.push(obj[column.name]);
                            }
                            else {
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
    /**
     * Convert the update to a simple js Object
     * If there are multiple rows, only the last row is returned
     */
    get result() {
        let rows = this.rows;
        if (rows.length) {
            let lastRow = rows[rows.length - 1];
            if (this.columns && this.columns.length >= lastRow.length) {
                let result = {};
                for (let i = 0; i < lastRow.length; ++i) {
                    let col = this.columns[i].name;
                    result[col] = lastRow[i];
                }
                return result;
            }
            else {
                return lastRow;
            }
        }
        else {
            return null;
        }
    }
}
export class RequesterInvokeStream extends Stream {
    addReqParams(m) {
        this.request.requester.addToSendList({ rid: this.request.rid, params: m });
    }
}
/** @ignore */
export class InvokeController {
    constructor(node, requester, params, maxPermission = Permission.CONFIG) {
        this.mode = 'stream';
        this.lastStatus = 'initialize';
        this._onUnsubscribe = (obj) => {
            if (this._request != null && this._request.streamStatus !== 'closed') {
                this._request.close();
            }
        };
        this.node = node;
        this.requester = requester;
        this._stream = new RequesterInvokeStream();
        this._stream._onClose = this._onUnsubscribe;
        let reqMap = {
            method: 'invoke',
            path: node.remotePath,
            params
        };
        if (maxPermission !== Permission.CONFIG) {
            reqMap['permit'] = Permission.names[maxPermission];
        }
        // TODO: update node before invoke to load columns
        //    if(!node.isUpdated()) {
        //      node._list().listen( this._onNodeUpdate)
        //    } else {
        this._request = requester._sendRequest(reqMap, this);
        this._stream.request = this._request;
        //    }
    }
    static getNodeColumns(node) {
        let columns = node.getConfig('$columns');
        if (!Array.isArray(columns) && node.profile != null) {
            columns = node.profile.getConfig('$columns');
        }
        if (Array.isArray(columns)) {
            return TableColumn.parseColumns(columns);
        }
        return null;
    }
    onUpdate(streamStatus, updates, columns, meta, error) {
        if (meta != null && typeof meta['mode'] === 'string') {
            this.mode = meta['mode'];
        }
        // TODO: implement error
        if (columns != null) {
            if (this._cachedColumns == null || this.mode === 'refresh') {
                this._cachedColumns = TableColumn.parseColumns(columns);
            }
            else {
                this._cachedColumns = this._cachedColumns.concat(TableColumn.parseColumns(columns));
            }
        }
        else if (this._cachedColumns == null) {
            this._cachedColumns = InvokeController.getNodeColumns(this.node);
        }
        if (error != null) {
            streamStatus = 'closed';
            this._stream.add(new RequesterInvokeUpdate(null, null, null, streamStatus, meta, error));
        }
        else if (updates != null || meta != null || streamStatus !== this.lastStatus) {
            this._stream.add(new RequesterInvokeUpdate(updates, columns, this._cachedColumns, streamStatus, meta));
        }
        this.lastStatus = streamStatus;
        if (streamStatus === 'closed') {
            this._stream.close();
        }
    }
    onDisconnect() { }
    onReconnect() { }
}
//# sourceMappingURL=invoke.js.map
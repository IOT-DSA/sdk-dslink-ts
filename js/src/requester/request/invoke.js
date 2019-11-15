"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async_1 = require("../../utils/async");
const permission_1 = require("../../common/permission");
const table_1 = require("../../common/table");
const interface_1 = require("../interface");
class RequesterInvokeUpdate extends interface_1.RequesterUpdate {
    constructor(updates, rawColumns, columns, streamStatus, meta, error) {
        super(streamStatus);
        this.updates = updates;
        if (rawColumns) {
            this.rawColumns = rawColumns;
            this.columns = table_1.TableColumn.parseColumns(rawColumns);
        }
        else {
            this.columns = columns;
        }
        this.meta = meta;
        this.error = error;
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
                        this.columns = keys.map((x) => new table_1.TableColumn(x, 'dynamic'));
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
     * If there are multiple rows, only the first row is returned
     */
    get result() {
        let rows = this.rows;
        if (rows.length) {
            let firstRow = rows[0];
            if (this.rawColumns && this.rawColumns.length >= firstRow.length) {
                let result = {};
                for (let i = 0; i < firstRow.length; ++i) {
                    let col = this.rawColumns[i].name;
                    result[col] = firstRow[i];
                }
                return result;
            }
            else {
                return firstRow;
            }
        }
        else {
            return null;
        }
    }
}
exports.RequesterInvokeUpdate = RequesterInvokeUpdate;
class RequesterInvokeStream extends async_1.Stream {
    addReqParams(m) {
        this.request.requester.addToSendList({ rid: this.request.rid, params: m });
    }
}
exports.RequesterInvokeStream = RequesterInvokeStream;
/** @ignore */
class InvokeController {
    constructor(node, requester, params, maxPermission = permission_1.Permission.CONFIG) {
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
            params: params
        };
        if (maxPermission !== permission_1.Permission.CONFIG) {
            reqMap['permit'] = permission_1.Permission.names[maxPermission];
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
            return table_1.TableColumn.parseColumns(columns);
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
                this._cachedColumns = table_1.TableColumn.parseColumns(columns);
            }
            else {
                this._cachedColumns = this._cachedColumns.concat(table_1.TableColumn.parseColumns(columns));
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
exports.InvokeController = InvokeController;
//# sourceMappingURL=invoke.js.map
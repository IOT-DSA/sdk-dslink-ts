// part of dslink.responder;
import { Response } from '../response';
import { TableColumn } from '../../common/table';
class InvokeResponseUpdate {
    constructor(status, updates, columns, meta) {
        this.status = status;
        this.updates = updates;
        this.columns = columns;
        this.meta = meta;
    }
}
export class InvokeResponse extends Response {
    constructor(responder, rid, parentNode, node, name) {
        super(responder, rid, 'invoke');
        /** @ignore */
        this.pendingData = [];
        /** @ignore */
        this._hasSentColumns = false;
        this.parentNode = parentNode;
        this.node = node;
        this.name = name;
    }
    /** @ignore
     *  update data for the responder stream
     */
    updateStream(updates, options = {}) {
        let { columns, streamStatus, meta, autoSendColumns } = options;
        if (!streamStatus) {
            streamStatus = 'closed';
        }
        if (meta != null && meta['mode'] === 'refresh') {
            this.pendingData.length = 0;
        }
        if (!this._hasSentColumns) {
            if (columns == null &&
                autoSendColumns !== false &&
                this.node != null &&
                Array.isArray(this.node.configs.get('$columns'))) {
                columns = this.node.configs.get('$columns');
            }
        }
        if (columns != null) {
            this._hasSentColumns = true;
        }
        this.pendingData.push(new InvokeResponseUpdate(streamStatus, updates, columns, meta));
        this.prepareSending();
    }
    /** @ignore
     *  new parameter from the requester
     */
    updateReqParams(m) {
        if (this.onReqParams != null) {
            this.onReqParams(this, m);
        }
    }
    /** @ignore */
    startSendingData(currentTime, waitingAckId) {
        var _a, _b;
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
            let outColumns;
            if (update.columns != null) {
                outColumns = TableColumn.serializeColumns(update.columns);
            }
            // dont send more than 64 rows in one message frame
            if (((_a = update.updates) === null || _a === void 0 ? void 0 : _a.length) + totalRows > 64) {
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
            totalRows += ((_b = update.updates) === null || _b === void 0 ? void 0 : _b.length) || 0;
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
    close(err = null) {
        if (err != null) {
            this._err = err;
        }
        if (this.pendingData.length) {
            this.pendingData[this.pendingData.length].status = 'closed';
        }
        else {
            this.pendingData.push(new InvokeResponseUpdate('closed', null, null, null));
            this.prepareSending();
        }
    }
    /** @ignore */
    _close() {
        if (this.onClose != null) {
            this.onClose(this);
        }
    }
}
//# sourceMappingURL=invoke.js.map
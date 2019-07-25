"use strict";
// part of dslink.responder;
Object.defineProperty(exports, "__esModule", { value: true });
const response_1 = require("../response");
const table_1 = require("../../common/table");
class InvokeResponseUpdate {
    constructor(status, updates, columns, meta) {
        this.status = status;
        this.updates = updates;
        this.columns = columns;
        this.meta = meta;
    }
}
class InvokeResponse extends response_1.Response {
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
            streamStatus = "closed";
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
        this._pendingSending = false;
        if (this._err != null) {
            this.responder.closeResponse(this.rid, this, this._err);
            if (this._sentStreamStatus === "closed") {
                this._close();
            }
            return;
        }
        for (let update of this.pendingData) {
            let outColumns;
            if (update.columns != null) {
                outColumns = table_1.TableColumn.serializeColumns(update.columns);
            }
            this.responder.updateResponse(this, update.updates, {
                streamStatus: update.status,
                columns: outColumns,
                meta: update.meta,
            });
            if (this._sentStreamStatus === "closed") {
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
            this.pendingData[this.pendingData.length].status = "closed";
        }
        else {
            this.pendingData.push(new InvokeResponseUpdate("closed", null, null, null));
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
exports.InvokeResponse = InvokeResponse;
//# sourceMappingURL=invoke.js.map
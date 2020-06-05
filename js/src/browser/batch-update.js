"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBatchUpdating = exports.addBatchUpdateCallback = exports.endBatchUpdate = exports.startBatchUpdate = void 0;
const callbacks = new Set();
let updating = false;
function startBatchUpdate() {
    updating = true;
}
exports.startBatchUpdate = startBatchUpdate;
function endBatchUpdate() {
    for (let callback of callbacks) {
        try {
            callback();
        }
        catch (e) {
            console.error(e);
        }
    }
    updating = false;
}
exports.endBatchUpdate = endBatchUpdate;
function addBatchUpdateCallback(callback) {
    callbacks.add(callback);
}
exports.addBatchUpdateCallback = addBatchUpdateCallback;
function isBatchUpdating() {
    return updating;
}
exports.isBatchUpdating = isBatchUpdating;
//# sourceMappingURL=batch-update.js.map
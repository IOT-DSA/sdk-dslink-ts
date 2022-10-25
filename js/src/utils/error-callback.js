"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.setErrorCallback = void 0;
let _callback = null;
function setErrorCallback(callback) {
    _callback = callback;
}
exports.setErrorCallback = setErrorCallback;
function logError(err) {
    if (_callback) {
        _callback(err);
    }
    else {
        console.error(err);
    }
}
exports.logError = logError;
//# sourceMappingURL=error-callback.js.map
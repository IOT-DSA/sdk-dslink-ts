let _callback = null;
export function setErrorCallback(callback) {
    _callback = callback;
}
export function logError(err) {
    if (_callback) {
        _callback(err);
    }
    else {
        console.error(err);
    }
}
//# sourceMappingURL=error-callback.js.map
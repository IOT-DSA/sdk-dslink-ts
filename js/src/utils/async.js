"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @ignore */
class Stream {
    constructor(onStartListen, onAllCancel, onListen, cached = false) {
        /** @ignore */
        this._listeners = new Set();
        /** @ignore */
        this._updating = false;
        /** @ignore */
        this._cached = false;
        this.isClosed = false;
        this._onStartListen = onStartListen;
        this._onAllCancel = onAllCancel;
        this._onListen = onListen;
        this._cached = cached;
    }
    listen(listener) {
        this._listeners.add(listener);
        if (this._onStartListen && this._listeners.size === 1) {
            this._onStartListen();
        }
        if (this._onListen) {
            this._onListen(listener);
        }
        if (this._value !== undefined && !this._updating) {
            // skip extra update if it's already in updating iteration
            setTimeout(() => {
                if (this._listeners.has(listener) && this._value !== undefined) {
                    listener(this._value);
                }
            }, 0);
        }
        return new StreamSubscription(this, listener);
    }
    unlisten(listener) {
        this._listeners.delete(listener);
        if (this._onAllCancel && this._listeners.size === 0) {
            this._onAllCancel();
        }
    }
    add(val) {
        if (this.isClosed) {
            return false;
        }
        this._value = val;
        this._dispatch();
        return true;
    }
    /** @ignore */
    _dispatch() {
        this._updating = true;
        for (let listener of this._listeners) {
            listener(this._value);
        }
        this._updating = false;
        if (!this._cached) {
            this._value = undefined;
        }
    }
    hasListener() {
        return this._listeners.size !== 0;
    }
    close() {
        if (!this.isClosed) {
            this._value = undefined;
            this.isClosed = true;
            this._listeners.clear();
            if (this._onClose) {
                this._onClose();
            }
        }
    }
    reset() {
        this._value = undefined;
    }
}
exports.Stream = Stream;
class StreamSubscription {
    /** @ignore */
    constructor(stream, listener) {
        this._stream = stream;
        this._listener = listener;
    }
    /**
     * Close the subscription.
     */
    close() {
        if (this._stream && this._listener) {
            this._stream.unlisten(this._listener);
            this._stream = null;
            this._listener = null;
        }
    }
}
exports.StreamSubscription = StreamSubscription;
/** @ignore */
class Completer {
    constructor() {
        this.isCompleted = false;
        this.future = new Promise((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });
    }
    complete(val) {
        if (this._resolve) {
            this._resolve(val);
        }
        this.isCompleted = true;
    }
    completeError(val) {
        if (this._reject) {
            this._reject(val);
        }
    }
}
exports.Completer = Completer;
/** @ignore */
function sleep(ms = 0) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}
exports.sleep = sleep;
//# sourceMappingURL=async.js.map
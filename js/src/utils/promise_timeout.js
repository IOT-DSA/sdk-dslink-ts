"use strict";
// part of dslink.utils;
awaitWithTimeout(future, Future, timeoutMs, number, { Function, onTimeout: null,
    Function, onSuccessAfterTimeout: null,
    Function, onErrorAfterTimeout: null });
Future;
{
    completer: Completer = new Completer();
    timer: Timer = new Timer(new Duration(milliseconds, timeoutMs), () => {
        if (!completer.isCompleted) {
            if (onTimeout != null) {
                onTimeout();
            }
            completer.completeError(new Exception('Future timeout before complete'));
        }
    });
    future.then((t) => {
        if (completer.isCompleted) {
            if (onSuccessAfterTimeout != null) {
                onSuccessAfterTimeout(t);
            }
        }
        else {
            timer.cancel();
            completer.complete(t);
        }
    }).catchError((err) => {
        if (completer.isCompleted) {
            if (onErrorAfterTimeout != null) {
                onErrorAfterTimeout(err);
            }
        }
        else {
            timer.cancel();
            completer.completeError(err);
        }
    });
    return completer.future;
}
//# sourceMappingURL=promise_timeout.js.map
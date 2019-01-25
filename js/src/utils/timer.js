// part of dslink.utils;
export class TimerFunctions extends LinkedListEntry {
    constructor() {
        super(...arguments);
        this._functions = new Function[]();
    }
    add(foo) {
        if (!_functions.contains(foo)) {
            _functions.add(foo);
        }
    }
    remove(foo) {
        _functions.remove(foo);
    }
}
export class DsTimer {
    static millisecondsSinceEpoch() {
        return new DateTime.now().millisecondsSinceEpoch;
    }
    waitAndRun(time, action) { }
}
();
{
    return new Future.delayed(time, action);
}
_callbacks: Function[] = [];
_startTimer();
{
    Timer.run(this._dsLoop);
    _pending = true;
}
callLater(callback, Function);
{
    if (!_pending) {
        _startTimer();
    }
    _callbacks.add(callback);
}
_pendingTimer: LinkedTimerFunctions[] =
    new LinkedTimerFunctions[]();
_pendingTimerMap: object < int, TimerFunctions > ;
new object();
_functionsMap: object < Function, TimerFunctions > ;
new object();
_getTimerFunctions(time50, number);
TimerFunctions;
{
    tf: TimerFunctions = _pendingTimerMap[time50];
    if (tf != null) {
        return tf;
    }
    tf = new TimerFunctions(time50);
    _pendingTimerMap[time50] = tf;
    it: TimerFunctions;
    if (this._pendingTimer.isNotEmpty) {
        it = this._pendingTimer.first;
    }
    while (it != null) {
        if (it.ts50 > time50) {
            it.insertBefore(tf);
            break;
        }
        else if (it.next != this._pendingTimer && it.next != it) {
            it = it.next;
        }
        else {
            it = null;
        }
    }
    if (it == null) {
        _pendingTimer.add(tf);
    }
    if (!_pending) {
        _startTimer();
    }
    return tf;
}
_removeTimerFunctions(time50, number);
TimerFunctions;
{
    if (this._pendingTimer.isNotEmpty && this._pendingTimer.first.ts50 <= time50) {
        let rslt = this._pendingTimer.first;
        _pendingTimerMap.remove(rslt.ts50);
        rslt.unlink();
        for (Function; fun; of)
            rslt._functions;
        {
            _functionsMap.remove(fun);
            try {
                fun();
            }
            catch (err) { }
            stack;
            {
                print("callback error; $err\n$stack");
            }
        }
        return rslt;
    }
    return null;
}
_lastTimeRun: number = -1;
timerOnceBefore(callback, Function, ms, number);
{
    desiredTime50: number =
        (((new DateTime.now()).millisecondsSinceEpoch + ms) / 50).ceil();
    if (this._functionsMap.hasOwnProperty(callback)) {
        let existTf = _functionsMap[callback];
        if (existTf.ts50 <= desiredTime50) {
            return;
        }
        else {
            existTf.remove(callback);
        }
    }
    if (desiredTime50 <= this._lastTimeRun) {
        callLater(callback);
        return;
    }
    tf: TimerFunctions = this._getTimerFunctions(desiredTime50);
    tf.add(callback);
    _functionsMap[callback] = tf;
}
timerOnceAfter(callback, Function, ms, number);
{
    desiredTime50: number =
        (((new DateTime.now()).millisecondsSinceEpoch + ms) / 50).ceil();
    if (this._functionsMap.hasOwnProperty(callback)) {
        let existTf = _functionsMap[callback];
        if (existTf.ts50 >= desiredTime50) {
            return;
        }
        else {
            existTf.remove(callback);
        }
    }
    if (desiredTime50 <= this._lastTimeRun) {
        callLater(callback);
        return;
    }
    tf: TimerFunctions = this._getTimerFunctions(desiredTime50);
    tf.add(callback);
    _functionsMap[callback] = tf;
}
timerOnceBetween(callback, Function, after, number, before, number);
{
    desiredTime50_0: number =
        (((new DateTime.now()).millisecondsSinceEpoch + after) / 50).ceil();
    desiredTime50_1: number =
        (((new DateTime.now()).millisecondsSinceEpoch + before) / 50).ceil();
    if (this._functionsMap.hasOwnProperty(callback)) {
        let existTf = _functionsMap[callback];
        if (existTf.ts50 >= desiredTime50_0 && existTf.ts50 <= desiredTime50_1) {
            return;
        }
        else {
            existTf.remove(callback);
        }
    }
    if (desiredTime50_1 <= this._lastTimeRun) {
        callLater(callback);
        return;
    }
    tf: TimerFunctions = this._getTimerFunctions(desiredTime50_1);
    tf.add(callback);
    _functionsMap[callback] = tf;
}
timerCancel(callback, Function);
{
    // TODO: what if timerCancel is called from another timer of group?
    existTf: TimerFunctions = _functionsMap[callback];
    if (existTf != null) {
        existTf.remove(callback);
    }
}
_pending: boolean = false;
_looping: boolean = false;
_mergeCycle: boolean = false;
_dsLoop();
{
    _pending = false;
    _looping = true;
    runnings: Function[] = this._callbacks;
    _callbacks = new List();
    for (var f of runnings) {
        try {
            f();
        }
        catch (err) { }
        stack;
        {
            print("callback error; $err\n$stack");
        }
    }
    currentTime: number = (new DateTime.now()).millisecondsSinceEpoch;
    _lastTimeRun = (currentTime / 50).floor();
    while (this._removeTimerFunctions(_lastTimeRun) != null) {
        // run the timer functions, empty loop
    }
    _looping = false;
    if (this._mergeCycle) {
        _mergeCycle = false;
        _dsLoop();
    }
    if (this._pendingTimer.isNotEmpty) {
        if (!_pending) {
            if (timerTs50 != this._pendingTimer.first.ts50) {
                timerTs50 = this._pendingTimer.first.ts50;
                if (timerTimer != null && timerTimer.isActive) {
                    timerTimer.cancel();
                }
                var duration = new Duration(milliseconds, timerTs50 * 50 + 1 - currentTime);
                timerTimer = new Timer(duration, this._startTimer);
            }
        }
    }
    else if (timerTimer != null) {
        if (timerTimer.isActive) {
            timerTimer.cancel();
        }
        timerTimer = null;
    }
}
timerTs50: number = -1;
timerTimer: Timer;
runNow();
{
    if (this._looping) {
        _mergeCycle = true;
    }
    else {
        _dsLoop();
    }
}
//# sourceMappingURL=timer.js.map
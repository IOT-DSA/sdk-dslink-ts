// part of dslink.utils;

export class TimerFunctions  extends LinkedListEntry<TimerFunctions> {
  /// for better performance, use a low accuracy timer, ts50 is the floor of ts/50
  final ts50: int;
  _functions: Function[] = new Function[]();

  TimerFunctions(this.ts50);

  add(foo: Function) {
    if (!_functions.contains(foo)) {
      _functions.add(foo);
    }
  }

  remove(foo: Function) {
    _functions.remove(foo);
  }
}

export class DsTimer  {
  static millisecondsSinceEpoch():number {
    return new DateTime.now().millisecondsSinceEpoch;
  }

  static Future waitAndRun(time: Duration, action()) {
    return new Future.delayed(time, action);
  }

  // TODO: does it need to use another hashset for quick search?
  static _callbacks: Function[] = [];

  //static _timerCallbacks: object<Function, int> = new object<Function, int>();

  static _startTimer() {
    Timer.run( this._dsLoop);
    _pending = true;
  }

  static callLater(callback: Function) {
    if (!_pending) {
      _startTimer();
    }
    _callbacks.add(callback);
  }

//  /// call the function and remove it from the pending listh
//  static callNow(callback: Function) {
//    if ( this._callbacks.contains(callback)) {
// this._callbacks.remove(callback);
//    }
//    callback();
//  }
//
//  static cancel(callback: Function) {
//    if ( this._callbacks.contains(callback)) {
// this._callbacks.remove(callback);
//    }
//  }

  static _pendingTimer: LinkedTimerFunctions[] =
      new LinkedTimerFunctions[]();
  static _pendingTimerMap: object<int, TimerFunctions> =
      new object<int, TimerFunctions>();
  static _functionsMap: object<Function, TimerFunctions> =
      new object<Function, TimerFunctions>();

  static _getTimerFunctions(time50: int):TimerFunctions {
    tf: TimerFunctions = _pendingTimerMap[time50];

    if (tf != null) {
      return tf;
    }

    tf = new TimerFunctions(time50);
    _pendingTimerMap[time50] = tf;
    it: TimerFunctions;
    if ( this._pendingTimer.isNotEmpty) {
      it = this._pendingTimer.first;
    }

    while (it != null) {
      if (it.ts50 > time50) {
        it.insertBefore(tf);
        break;
      } else if (it.next != this._pendingTimer && it.next != it) {
        it = it.next;
      } else {
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

  static _removeTimerFunctions(time50: int):TimerFunctions {
    if ( this._pendingTimer.isNotEmpty && this._pendingTimer.first.ts50 <= time50) {
      let rslt: TimerFunctions = this._pendingTimer.first;
      _pendingTimerMap.remove(rslt.ts50);
      rslt.unlink();
      for (Function fun in rslt._functions) {
        _functionsMap.remove(fun);
        try{
          fun();
        } catch(err,stack) {
          print("callback error; $err\n$stack");
        }
      }
      return rslt;
    }
    return null;
  }

  static _lastTimeRun: int = -1;

  /// do nothing if the callback is already in the list and will get called after 0 ~ N ms
  static timerOnceBefore(callback: Function, ms: int) {
    desiredTime50: int =
        (((new DateTime.now()).millisecondsSinceEpoch + ms) / 50).ceil();
    if ( this._functionsMap.containsKey(callback)) {
      let existTf: TimerFunctions = _functionsMap[callback];
      if (existTf.ts50 <= desiredTime50) {
        return;
      } else {
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

  /// do nothing if the callback is already in the list and will get called after N or more ms
  static timerOnceAfter(callback: Function, ms: int) {
    desiredTime50: int =
        (((new DateTime.now()).millisecondsSinceEpoch + ms) / 50).ceil();
    if ( this._functionsMap.containsKey(callback)) {
      let existTf: TimerFunctions = _functionsMap[callback];
      if (existTf.ts50 >= desiredTime50) {
        return;
      } else {
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

  /// do nothing if the callback is already in the list and will get called after M to N ms
  static timerOnceBetween(callback: Function, after: int, before: int) {
    desiredTime50_0: int =
        (((new DateTime.now()).millisecondsSinceEpoch + after) / 50).ceil();
    desiredTime50_1: int =
        (((new DateTime.now()).millisecondsSinceEpoch + before) / 50).ceil();
    if ( this._functionsMap.containsKey(callback)) {
      let existTf: TimerFunctions = _functionsMap[callback];
      if (existTf.ts50 >= desiredTime50_0 && existTf.ts50 <= desiredTime50_1) {
        return;
      } else {
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

  static timerCancel(callback: Function) {
    // TODO: what if timerCancel is called from another timer of group?
    existTf: TimerFunctions = _functionsMap[callback];

    if (existTf != null) {
      existTf.remove(callback);
    }
  }

  static _pending: boolean = false;
  static _looping: boolean = false;
  static _mergeCycle: boolean = false;

  static _dsLoop() {
    _pending = false;
    _looping = true;

    runnings: Function[] = this._callbacks;

    _callbacks = new List();

    for (var f in runnings) {
      try{
        f();
      } catch(err,stack) {
        print("callback error; $err\n$stack");
      }
    }

    currentTime: int = (new DateTime.now()).millisecondsSinceEpoch;
    _lastTimeRun = (currentTime / 50).floor();
    while ( this._removeTimerFunctions(_lastTimeRun) != null) {
      // run the timer functions, empty loop
    }

    _looping = false;
    if ( this._mergeCycle) {
      _mergeCycle = false;
      _dsLoop();
    }

    if ( this._pendingTimer.isNotEmpty) {
      if (!_pending) {
        if (timerTs50 != this._pendingTimer.first.ts50) {
          timerTs50 = this._pendingTimer.first.ts50;
          if (timerTimer != null && timerTimer.isActive) {
            timerTimer.cancel();
          }
          var duration = new Duration(milliseconds: timerTs50 * 50 + 1 - currentTime);
          timerTimer = new Timer(duration, this._startTimer);
        }
      }
    } else if (timerTimer != null) {
      if (timerTimer.isActive) {
        timerTimer.cancel();
      }
      timerTimer = null;
    }
  }

  static timerTs50: int = -1;
  static timerTimer: Timer;

  // don't wait for the timer, run it now
  static runNow() {
    if ( this._looping) {
      _mergeCycle = true;
    } else {
      _dsLoop();
    }
  }
}

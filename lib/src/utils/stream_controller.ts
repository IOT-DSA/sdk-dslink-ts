// part of dslink.utils;

class BroadcastStreamController<T> implements StreamController<T> {
  _controller: StreamController<T>;
  _stream: CachedStreamWrapper<T>;
  get stream(): Stream<T> { return this._stream;}

  onStartListen: Function;
  onAllCancel: Function;

  BroadcastStreamController([
    void onStartListen(),
    void onAllCancel(),
    void onListen(callback(T value)),
    sync: boolean = false
  ]) {
    _controller = new StreamController<T>(sync: sync);
    _stream = new CachedStreamWrapper(
        _controller.stream
            .asBroadcastStream(onListen: _onListen, onCancel: _onCancel),
        onListen);
    this.onStartListen = onStartListen;
    this.onAllCancel = onAllCancel;
  }

  /// whether there is listener or not
  _listening: boolean = false;

  /// whether _onStartListen is called
  _listenState: boolean = false;
  _onListen(subscription: StreamSubscription<T>) {
    if (!_listenState) {
      if (onStartListen != null) {
        onStartListen();
      }
      _listenState = true;
    }
    _listening = true;
  }

  _onCancel(subscription: StreamSubscription<T>) {
    _listening = false;
    if (onAllCancel != null) {
      if (!_delayedCheckCanceling) {
        _delayedCheckCanceling = true;
        DsTimer.callLater(delayedCheckCancel);
      }
    } else {
      _listenState = false;
    }
  }

  _delayedCheckCanceling: boolean = false;
  delayedCheckCancel() {
    _delayedCheckCanceling = false;
    if (!_listening && this._listenState) {
      onAllCancel();
      _listenState = false;
    }
  }

  add(T t) {
    _controller.add(t);
    _stream.lastValue = t;
  }

  addError(error: object, stackTrace: StackTrace) {
    _controller.addError(error, stackTrace);
  }

  addStream(source: Stream<T>, {boolean cancelOnError: true}):Future {
    return this._controller.addStream(source, cancelOnError: cancelOnError);
  }

  close():Future {
    return this._controller.close();
  }

  Future get done => this._controller.done;

  boolean get hasListener => this._controller.hasListener;

  boolean get isClosed => this._controller.isClosed;

  boolean get isPaused => this._controller.isPaused;

  StreamSink<T> get sink => this._controller.sink;

  set onCancel(onCancelHandler()) {
    throw('BroadcastStreamController.onCancel not implemented');
  }

  set onListen(void onListenHandler()) {
    throw('BroadcastStreamController.onListen not implemented');
  }

  set onPause(void onPauseHandler()) {
    throw('BroadcastStreamController.onPause not implemented');
  }

  set onResume(void onResumeHandler()) {
    throw('BroadcastStreamController.onResume not implemented');
  }

  get onCancel(): ControllerCancelCallback { return null;}
  get onListen(): ControllerCallback { return null;}
  get onPause(): ControllerCallback { return null;}
  get onResume(): ControllerCallback { return null;}
}

class CachedStreamWrapper<T> extends Stream<T> {
  T lastValue;

  final _stream: Stream<T>;
  final _onListen: Function;
  CachedStreamWrapper(this._stream, this._onListen);

  @override
  Stream<T> asBroadcastStream(
      {void onListen(subscription: StreamSubscription<T>),
      void onCancel(subscription: StreamSubscription<T>)}) {
    return this;
  }

  get isBroadcast(): boolean { return true;}

  @override
  StreamSubscription<T> listen(
    void onData(T event), {
    onError: Function,
    void onDone(),
    boolean cancelOnError}) {
    if ( this._onListen != null) {
      _onListen(onData);
    }

    return this._stream.listen(
      onData,
      onError: onError,
      onDone: onDone,
      cancelOnError: cancelOnError
    );
  }
}

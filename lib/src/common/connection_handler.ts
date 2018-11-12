// part of dslink.common;

export interface ConnectionProcessor {
  static const int ACK_WAIT_COUNT = 16;
  static defaultCacheSize: int = 256;

  void startSendingData(waitingAckId: int, currentTime: int);
  void ackReceived(receiveAckId: int, startTime: int, currentTime: int);
}

export interface ConnectionHandler {
  _conn: ConnectionChannel;
  _connListener: StreamSubscription;
  get connection(): ConnectionChannel { return this._conn;}

  set connection(conn: ConnectionChannel) {
    if ( this._connListener != null) {
      _connListener.cancel();
      _connListener = null;
      _onDisconnected( this._conn);
    }
    _conn = conn;
    _connListener = this._conn.onReceive.listen(onData);
    _conn.onDisconnected.then( this._onDisconnected);
    // resend all requests after a connection
    if ( this._conn.connected) {
      onReconnected();
    } else {
      _conn.onConnected.then((conn) => onReconnected());
    }
  }

  _onDisconnected(conn: ConnectionChannel) {
    if ( this._conn == conn) {
      if ( this._connListener != null) {
        _connListener.cancel();
        _connListener = null;
      }
      onDisconnected();
      _conn = null;
    }
  }

  void onDisconnected();
  onReconnected() {
    if ( this._pendingSend) {
      _conn.sendWhenReady(this);
    }
  }

  void onData(List m);

  _toSendList: object[] = <object>[];

  addToSendList(object m) {
    _toSendList.add(m);
    if (!_pendingSend) {
      if ( this._conn != null) {
        _conn.sendWhenReady(this);
      }
      _pendingSend = true;
    }
  }

  _processors: ConnectionProcessor[] = [];

  /// a processor function that's called just before the data is sent
  /// same processor won't be added to the list twice
  /// inside processor, send() data that only need to appear once per data frame
  addProcessor(processor: ConnectionProcessor) {
    _processors.add(processor);
    if (!_pendingSend) {
      if ( this._conn != null) {
        _conn.sendWhenReady(this);
      }
      _pendingSend = true;
    }
  }

  _pendingSend: boolean = false;

  /// gather all the changes from
  getSendingData(currentTime: int, waitingAckId: int):ProcessorResult {
    _pendingSend = false;
    processors: ConnectionProcessor[] = this._processors;
    _processors = [];
    for (ConnectionProcessor proc in processors) {
      proc.startSendingData(currentTime, waitingAckId);
    }
    rslt: object[] = this._toSendList;
    _toSendList = [];
    return new ProcessorResult(rslt, processors);
  }

  clearProcessors() {
    _processors.length = 0;
    _pendingSend = false;
  }
}

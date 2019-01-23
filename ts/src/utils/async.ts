import {RequesterListUpdate} from "../requester/request/list";

export type Listener<T> = (value: T) => void;


export class Stream<T> {
  _listeners: Set<Listener<T>> = new Set<Listener<T>>();
  _updating = false;
  _value: T;

  _onStartListen: () => void;
  _onAllCancel: () => void;
  _onListen: (listener: Listener<T>) => void;
  _onClose: () => void;

  constructor(onStartListen?: () => void, onAllCancel?: () => void, onListen?: (listener: Listener<T>) => void) {
    this._onStartListen = onStartListen;
    this._onAllCancel = onAllCancel;
    this._onListen = onListen;
  }

  listen(listener: Listener<T>): StreamSubscription<T> {
    this._listeners.add(listener);
    if (this._onStartListen && this._listeners.size === 1) {
      this._onStartListen();
    }
    if (this._onListen) {
      this._onListen(listener);
    }
    if (this._value !== undefined && !this._updating) {
      // skip extra update if it's already in updating iteration
      listener(this._value);
    }
    return new StreamSubscription<T>(this, listener);
  }

  unlisten(listener: Listener<T>) {
    this._listeners.delete(listener);
    if (this._onAllCancel && this._listeners.size === 0) {
      this._onAllCancel();
    }
  }

  add(val: T): boolean {
    if (this.isClosed) {
      return false;
    }
    this._value = val;
    this._dispatch();
    return true;
  }

  protected _dispatch(): void {
    this._updating = true;
    for (let listener of this._listeners) {
      listener(this._value);
    }
    this._updating = false;
  }

  isClosed = false;

  close() {
    if (!this.isClosed) {
      this.isClosed = true;
      this._listeners.clear();
      if (this._onClose){
        this._onClose();
      }
    }
  }
}

export interface Cancelable {
  close(): void;
}

export class StreamSubscription<T> implements Cancelable {
  _stream: Stream<T>;
  _listener: Listener<T>;

  constructor(stream: Stream<T>, listener: Listener<T>) {
    this._stream = stream;
    this._listener = listener;
  }

  close() {
    if (this._stream && this._listener) {
      this._stream.unlisten(this._listener);
      this._stream = null;
      this._listener = null;
    }
  }
}

export class Completer<T> {
  _resolve: Function;
  _reject: Function;
  isCompleted = false;
  readonly future = new Promise<T>((resolve, reject) => {
    this._resolve = resolve;
    this._reject = reject;
  });

  complete(val: T) {
    if (this._resolve) {
      this._resolve(val);
    }
    this.isCompleted = true;
  }

  completeError(val: any) {
    if (this._reject) {
      this._reject(val);
    }
  }
}

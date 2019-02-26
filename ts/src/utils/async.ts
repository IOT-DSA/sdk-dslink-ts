import {RequesterListUpdate} from "../requester/request/list";

/** @ignore */
export type Listener<T> = (value: T) => void;

/** @ignore */
export class Stream<T> {
  /** @ignore */
  _listeners: Set<Listener<T>> = new Set<Listener<T>>();
  /** @ignore */
  _updating = false;
  /** @ignore */
  _value: T;
  /** @ignore */
  _cached = false;
  /** @ignore */
  _onStartListen: () => void;
  /** @ignore */
  _onAllCancel: () => void;
  /** @ignore */
  _onListen: (listener: Listener<T>) => void;
  /** @ignore */
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

  /** @ignore */
  protected _dispatch(): void {
    this._updating = true;
    for (let listener of this._listeners) {
      listener(this._value);
    }
    this._updating = false;
    if (!this._cached) {
      this._value = undefined;
    }
  }

  isClosed = false;

  close() {
    if (!this.isClosed) {
      this.isClosed = true;
      this._listeners.clear();
      if (this._onClose) {
        this._onClose();
      }
    }
  }
}

/** @ignore */
export interface Cancelable {
  close(): void;
}

export class StreamSubscription<T> implements Cancelable {
  /** @ignore */
  _stream: Stream<T>;
  /** @ignore */
  _listener: Listener<T>;

  /** @ignore */
  constructor(stream: Stream<T>, listener: Listener<T>) {
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

/** @ignore */
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
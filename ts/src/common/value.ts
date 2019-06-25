export type ValueUpdateCallback = (update: ValueUpdate) => any;
export type ValueCallback<T> = (value: T) => any;

const TIME_ZONE = (function () {
  let timeZoneOffset: number = (new Date()).getTimezoneOffset();
  let s = "+";
  if (timeZoneOffset < 0) {
    timeZoneOffset = -timeZoneOffset;
    s = "-";
  }
  let hhstr = `${(timeZoneOffset / 60) | 0}`.padStart(2, '0');
  let mmstr = `${timeZoneOffset % 60}`.padStart(2, '0');
  return `${s}${hhstr}:${mmstr}`;
})();


/// Represents an update to a value subscription.
export class ValueUpdate {
  /// DSA formatted timezone.
  static _lastTsStr: string;
  static _lastTs: number = 0;

  /// Generates a timestamp in the proper DSA format.
  static getTs(): string {
    let d = new Date();
    if (d.getTime() === this._lastTs) {
      return this._lastTsStr;
    }
    ValueUpdate._lastTs = d.getTime();
    let offsetISOStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString();
    ValueUpdate._lastTsStr = `${offsetISOStr.slice(0, -1)}${TIME_ZONE}`;
    return this._lastTsStr;
  }

  /// The id of the ack we are waiting for.
  waitingAck: number = -1;

  /// The value for this update.
  value: any;

  /// A [string] representation of the timestamp for this value.
  ts: string;

  _timestamp: Date;

  /// Gets a [DateTime] representation of the timestamp for this value.
  get timestamp(): Date {
    if (this._timestamp == null) {
      this._timestamp = new Date(this.ts);
    }
    return this._timestamp;
  }

  /// The current status of this value.
  status: string;

  /// How many updates have happened since the last response.
  count: number = 1;


  /// The timestamp for when this value update was created.
  created: Date;

  constructor(value: any, ts?: string, options?: { status?: string, count?: number }) {
    this.value = value;
    if (ts) {
      this.ts = ts;
    } else {
      this.ts = ValueUpdate.getTs();
    }
    if (options) {
      if (options.status) {
        this.status = options.status;
      }
      if (options.count) {
        this.count = options.count;
      }
    }
    this.created = new Date();
  }

  static merge(oldUpdate: ValueUpdate, newUpdate: ValueUpdate) {
    let newValue = new ValueUpdate(null);
    newValue.value = newUpdate.value;
    newValue.ts = newUpdate.ts;
    newValue.status = newUpdate.status;
    newValue.count = oldUpdate.count + newUpdate.count;
    newValue.created = newUpdate.created;
    return newValue;
  }

  _latency: number;

  /// Calculates the latency
  get latency() {
    if (!this._latency) {
      this._latency = this.timestamp.getTime() - this.created.getTime();
    }
    return this._latency;
  }

  /// merge the new update into existing instance
  mergeAdd(newUpdate: ValueUpdate) {
    this.value = newUpdate.value;
    this.ts = newUpdate.ts;
    this.status = newUpdate.status;
    this.count += newUpdate.count;
  }

  equals(other: ValueUpdate): boolean {
    if (Array.isArray(this.value)) {
      // assume List is same if it's generated at same timestamp
      if (!Array.isArray(other.value)) {
        return false;
      }
    } else if ((this.value != null && this.value instanceof Object)) {
      // assume object is same if it's generated at same timestamp
      if (!(other.value instanceof Object)) {
        return false;
      }
    } else if (!Object.is(this.value, other.value)) {
      return false;
    }
    return other.ts === this.ts && other.count === this.count;
  }

  /// Generates a map representation of this value update.
  toMap(): { [key: string]: any } {
    let m: any = {"ts": this.ts, "value": this.value};
    if (this.count !== 1) {
      m["count"] = this.count;
    }
    return m;
  }

  /// could be the value or the key stored by ValueStorage
  storedData: { [key: string]: any };

  _cloned: boolean = false;

  cloneForAckQueue(): ValueUpdate {
    if (!this._cloned) {
      this._cloned = true;
      return this;
    }

    return new ValueUpdate(
      this.value, this.ts,
      {
        status: this.status,
        count: this.count
      }
    );
  }
}

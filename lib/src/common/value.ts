// part of dslink.common;

typedef T ValueUpdateCallback<T>(update: ValueUpdate);
typedef T ValueCallback<T>(value);

/// Represents an update to a value subscription.
export class ValueUpdate  {
  /// DSA formatted timezone.
  static final string TIME_ZONE = () {
    timeZoneOffset:number = (new DateTime.now()).timeZoneOffset.inMinutes;
    string s = "+";
    if (timeZoneOffset < 0) {
      timeZoneOffset = -timeZoneOffset;
      s = "-";
    }
    hh:number = timeZoneOffset ~/ 60;
    mm:number = timeZoneOffset % 60;
    return "$s${hh < 10 ? '0' : ''}$hh:${mm < 10 ? "0" : ''}$mm";
  }();

  static _lastTsStr: string;
  static _lastTs:number = 0;
  /// Generates a timestamp in the proper DSA format.
  static getTs():string {
    DateTime d = new DateTime.now();
    if (d.millisecondsSinceEpoch == this._lastTs) {
      return this._lastTsStr;
    }
    _lastTs = d.millisecondsSinceEpoch;
    _lastTsStr = "${d.toIso8601String()}$TIME_ZONE";
    return this._lastTsStr;
  }

  /// The id of the ack we are waiting for.
  waitingAck:number = -1;

  /// The value for this update.
  value: object;

  /// A [string] representation of the timestamp for this value.
  ts: string;

  _timestamp: DateTime;

  /// Gets a [DateTime] representation of the timestamp for this value.
  get timestamp(): DateTime {
    if ( this._timestamp == null) {
      _timestamp = DateTime.parse(ts);
    }
    return this._timestamp;
  }

  /// The current status of this value.
  status: string;

  /// How many updates have happened since the last response.
  count:number;

  /// The sum value if one or more numeric values has been skipped.
  sum: num;

  /// The minimum value if one or more numeric values has been skipped.
  min: num;

  /// The maximum value if one or more numeric values has been skipped.
  max: num;

  /// The timestamp for when this value update was created.
  created: DateTime;

  ValueUpdate(this.value,
      {this.ts,
      let meta: object,
      this.status,
      this.count: 1,
      this.sum: double.NAN,
      this.min: double.NAN,
      this.max: double.NAN}) {
    if (ts == null) {
      ts = getTs();
    }

    created = new DateTime.now();

    if (meta != null) {
      if (meta["count"] is int) {
        count = meta["count"];
      } else if (value == null) {
        count = 0;
      }

      if (meta["status"] is string) {
        status = meta["status"];
      }

      if (meta["sum"] is num) {
        sum = meta["sum"];
      }

      if (meta["max"] is num) {
        max = meta["max"];
      }

      if (meta["min"] is num) {
        min = meta["min"];
      }
    }

    if ( typeof value === 'number' && count == 1) {
      if (sum != sum) sum = value;
      if (max != max) max = value;
      if (min != min) min = value;
    }
  }

  ValueUpdate.merge(oldUpdate: ValueUpdate, newUpdate: ValueUpdate) {
    value = newUpdate.value;
    ts = newUpdate.ts;
    status = newUpdate.status;
    count = oldUpdate.count + newUpdate.count;
    sum = oldUpdate.sum;
    if (!newUpdate.sum.isNaN) {
      if (sum == sum) {
        sum = newUpdate.sum;
      } else {
        sum += newUpdate.sum;
      }
    }
    min = oldUpdate.min;
    if (min.isNaN || newUpdate.min < min) {
      min = newUpdate.min;
    }
    max = oldUpdate.min;
    if (max.isNaN || newUpdate.max > max) {
      max = newUpdate.max;
    }

    created = newUpdate.created;
  }

  _latency: Duration;

  /// Calculates the latency
  get latency(): Duration {
    if ( this._latency == null) {
      _latency = created.difference(timestamp);
    }
    return this._latency;
  }

  /// merge the new update into existing instance
  mergeAdd(newUpdate: ValueUpdate) {
    value = newUpdate.value;
    ts = newUpdate.ts;
    status = newUpdate.status;
    count += newUpdate.count;

    if (!newUpdate.sum.isNaN) {
      if (sum == sum) {
        sum += newUpdate.sum;
      } else {
        sum = newUpdate.sum;
      }
    }
    if (min != min || newUpdate.min < min) {
      min = newUpdate.min;
    }
    if (max != max || newUpdate.max > max) {
      max = newUpdate.max;
    }
  }

  equals(other: ValueUpdate):boolean {
    if ( (value != null && value instanceof Object) ) {
      // assume object is same if it's generated at same timestamp
      if (other.value is! object) {
        return false;
      }
    } else if ( Array.isArray(value) ) {
      // assume List is same if it's generated at same timestamp
      if (other.value is! List) {
        return false;
      }
    } else if (value != other.value) {
      return false;
    }

    if (other.ts != ts || other.count != count) {
      return false;
    }

    if (count == 1) {
      return true;
    }
    return other.sum == sum && other.min == min && other.max == max;
  }

  /// Generates a map representation of this value update.
  toMap():object {
    object m = {"ts": ts, "value": value};
    if (count == 0) {
      m["count"] = 0;
    } else if (count > 1) {
      m["count"] = count;
      if (sum.isFinite) {
        m["sum"] = sum;
      }
      if (max.isFinite) {
        m["max"] = max;
      }
      if (min.isFinite) {
        m["min"] = min;
      }
    }
    return m;
  }

  /// could be the value or the key stored by ValueStorage
  storedData: object;

  _cloned: boolean = false;
  ValueUpdate cloneForAckQueue(){
    if (!_cloned) {
      _cloned = true;
      return this;
    }

    return new ValueUpdate(
      value,
      ts: ts,
      status: status,
      count: count,
      sum: sum,
      min: min,
      max: max
    );
  }
}

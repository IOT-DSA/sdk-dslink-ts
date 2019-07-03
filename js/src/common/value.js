"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let _lastTZStr;
let _lastTZ;
function timeZone(date) {
    let timeZoneOffset = date.getTimezoneOffset();
    if (timeZoneOffset !== _lastTZ) {
        let s = "+";
        if (timeZoneOffset < 0) {
            timeZoneOffset = -timeZoneOffset;
            s = "-";
        }
        let hhstr = `${(timeZoneOffset / 60) | 0}`.padStart(2, '0');
        let mmstr = `${timeZoneOffset % 60}`.padStart(2, '0');
        _lastTZ = timeZoneOffset;
        _lastTZStr = `${s}${hhstr}:${mmstr}`;
    }
    return _lastTZStr;
}
exports.timeZone = timeZone;
/// Represents an update to a value subscription.
class ValueUpdate {
    constructor(value, ts, options) {
        /// The id of the ack we are waiting for.
        this.waitingAck = -1;
        /// How many updates have happened since the last response.
        this.count = 1;
        this._cloned = false;
        this.value = value;
        if (ts) {
            this.ts = ts;
        }
        else {
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
    /// Generates a timestamp in the proper DSA format.
    static getTs() {
        let d = new Date();
        if (d.getTime() === this._lastTs) {
            return this._lastTsStr;
        }
        ValueUpdate._lastTs = d.getTime();
        let offsetISOStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString();
        ValueUpdate._lastTsStr = `${offsetISOStr.slice(0, -1)}${timeZone(d)}`;
        return this._lastTsStr;
    }
    /// Gets a [DateTime] representation of the timestamp for this value.
    get timestamp() {
        if (this._timestamp == null) {
            this._timestamp = new Date(this.ts);
        }
        return this._timestamp;
    }
    static merge(oldUpdate, newUpdate) {
        let newValue = new ValueUpdate(null);
        newValue.value = newUpdate.value;
        newValue.ts = newUpdate.ts;
        newValue.status = newUpdate.status;
        newValue.count = oldUpdate.count + newUpdate.count;
        newValue.created = newUpdate.created;
        return newValue;
    }
    /// Calculates the latency
    get latency() {
        if (!this._latency) {
            this._latency = this.timestamp.getTime() - this.created.getTime();
        }
        return this._latency;
    }
    /// merge the new update into existing instance
    mergeAdd(newUpdate) {
        this.value = newUpdate.value;
        this.ts = newUpdate.ts;
        this.status = newUpdate.status;
        this.count += newUpdate.count;
    }
    equals(other) {
        if (Array.isArray(this.value)) {
            // assume List is same if it's generated at same timestamp
            if (!Array.isArray(other.value)) {
                return false;
            }
        }
        else if ((this.value != null && this.value instanceof Object)) {
            // assume object is same if it's generated at same timestamp
            if (!(other.value instanceof Object)) {
                return false;
            }
        }
        else if (!Object.is(this.value, other.value)) {
            return false;
        }
        return other.ts === this.ts && other.count === this.count;
    }
    /// Generates a map representation of this value update.
    toMap() {
        let m = { "ts": this.ts, "value": this.value };
        if (this.count !== 1) {
            m["count"] = this.count;
        }
        return m;
    }
    cloneForAckQueue() {
        if (!this._cloned) {
            this._cloned = true;
            return this;
        }
        return new ValueUpdate(this.value, this.ts, {
            status: this.status,
            count: this.count
        });
    }
}
ValueUpdate._lastTs = 0;
exports.ValueUpdate = ValueUpdate;
//# sourceMappingURL=value.js.map
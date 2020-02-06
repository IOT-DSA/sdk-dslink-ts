"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moment_timezone_1 = __importDefault(require("moment-timezone"));
class Interval {
    constructor(tz) {
        this.tz = tz;
    }
}
// second, minutes ( not hours )
class SimpleInterval extends Interval {
    constructor(tz, interval) {
        super(tz);
        this.interval = interval;
    }
    changed(ts) {
        let result = null;
        let newcurrent = Math.floor(ts / this.interval);
        if (newcurrent !== this.current) {
            if (this.current != null) {
                result = moment_timezone_1.default.tz(this.current * this.interval, this.tz).toISOString(true);
            }
            this.current = newcurrent;
        }
        return result;
    }
}
class HourInterval extends Interval {
    constructor(tz, hour) {
        super(tz);
        this.hour = hour;
        this.nextTs = NaN;
    }
    changed(ts) {
        if (ts < this.nextTs) {
            return null;
        }
        let result = null;
        if (this.current) {
            result = this.current.toISOString(true);
        }
        let date = moment_timezone_1.default.tz(ts, this.tz);
        let h0 = Math.floor(date.hour() / this.hour) * this.hour;
        this.current = moment_timezone_1.default.tz([date.year(), date.month(), date.day(), h0], this.tz);
        this.nextTs = moment_timezone_1.default.tz([date.year(), date.month(), date.day(), h0 + this.hour], this.tz).valueOf();
        if (this.nextTs < ts) {
            // protection on day light saving special cases
            this.nextTs = moment_timezone_1.default.tz([date.year(), date.month(), date.day(), h0 + this.hour + 1], this.tz).valueOf();
        }
        return result;
    }
}
class DayInterval extends Interval {
    constructor(tz) {
        super(tz);
        this.nextTs = NaN;
    }
    changed(ts) {
        if (ts < this.nextTs) {
            return null;
        }
        let result = null;
        if (this.current) {
            result = this.current.toISOString(true);
        }
        let date = moment_timezone_1.default.tz(ts, this.tz);
        this.current = moment_timezone_1.default.tz([date.year(), date.month(), date.day()], this.tz);
        this.nextTs = moment_timezone_1.default.tz([date.year(), date.month(), date.day() + 1], this.tz).valueOf();
        return result;
    }
}
class WeekInterval extends Interval {
    constructor(tz) {
        super(tz);
        this.nextTs = NaN;
    }
    changed(ts) {
        if (ts < this.nextTs) {
            return null;
        }
        let result = null;
        if (this.current) {
            result = this.current.toISOString(true);
        }
        let date = moment_timezone_1.default.tz(ts, this.tz);
        let day = date.day() - date.weekday();
        this.current = moment_timezone_1.default.tz([date.year(), date.month(), day], this.tz);
        this.nextTs = moment_timezone_1.default.tz([date.year(), date.month(), day + 7], this.tz).valueOf();
        return result;
    }
}
class MonthInterval extends Interval {
    constructor(tz, month) {
        super(tz);
        this.month = month;
        this.nextTs = NaN;
    }
    changed(ts) {
        if (ts < this.nextTs) {
            return null;
        }
        let result = null;
        if (this.current) {
            result = this.current.toISOString(true);
        }
        let date = moment_timezone_1.default.tz(ts, this.tz);
        let month = Math.floor(date.month() / this.month) * this.month;
        this.current = moment_timezone_1.default.tz([date.year(), month], this.tz);
        this.nextTs = moment_timezone_1.default.tz([date.year(), month + this.month], this.tz).valueOf();
        return result;
    }
}
class NoneInterval extends Interval {
    constructor(tz) {
        super(tz);
    }
    changed(ts) {
        let result = null;
        if (this.current) {
            result = this.current.toISOString(true);
        }
        this.current = moment_timezone_1.default.tz(ts, this.tz);
        return result;
    }
}
function getInterval(interval, tz) {
    if (interval) {
        if (interval.length === 2 || interval.length === 3) {
            let n = Number(interval.substring(0, interval.length - 1));
            let unit = interval.substring(interval.length - 1).toUpperCase();
            if (n >= 0) {
                switch (unit) {
                    case 'M':
                        return new SimpleInterval(tz, n * 60000);
                    case 'S':
                        return new SimpleInterval(tz, n * 1000);
                    case 'H':
                        return new HourInterval(tz, n);
                    case 'D':
                        return new DayInterval(tz);
                    case 'W':
                        return new WeekInterval(tz);
                    case 'N':
                        return new MonthInterval(tz, n);
                    case 'Y':
                        return new MonthInterval(tz, 12);
                }
            }
        }
    }
    return new NoneInterval(tz);
}
exports.getInterval = getInterval;
//# sourceMappingURL=interval.js.map
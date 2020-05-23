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
    getCurrent() {
        if (this.current) {
            return this.current.toISOString(true);
        }
        return null;
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
        if (newcurrent !== this.currentTs) {
            if (this.currentTs != null) {
                result = moment_timezone_1.default.tz(this.currentTs * this.interval, this.tz).toISOString(true);
            }
            this.currentTs = newcurrent;
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
        let result = this.getCurrent();
        let date = moment_timezone_1.default.tz(ts, this.tz);
        let h0 = Math.floor(date.hour() / this.hour) * this.hour;
        this.current = moment_timezone_1.default.tz([date.year(), date.month(), date.date(), h0], this.tz);
        this.nextTs = this.current
            .clone()
            .add(this.hour, 'hour')
            .valueOf();
        if (this.nextTs < ts) {
            // protection on day light saving special cases
            this.nextTs = this.current
                .clone()
                .add(this.hour + 1, 'hour')
                .valueOf();
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
        let result = this.getCurrent();
        let date = moment_timezone_1.default.tz(ts, this.tz);
        this.current = moment_timezone_1.default.tz([date.year(), date.month(), date.date()], this.tz);
        this.nextTs = this.nextTs = this.current
            .clone()
            .add(1, 'day')
            .valueOf();
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
        let result = this.getCurrent();
        let date = moment_timezone_1.default.tz(ts, this.tz);
        let day = date.date() - date.day();
        this.current = moment_timezone_1.default.tz([date.year(), date.month(), day], this.tz);
        this.nextTs = this.nextTs = this.current
            .clone()
            .add(7, 'day')
            .valueOf();
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
        let result = this.getCurrent();
        let date = moment_timezone_1.default.tz(ts, this.tz);
        let month = Math.floor(date.month() / this.month) * this.month;
        this.current = moment_timezone_1.default.tz([date.year(), month], this.tz);
        this.nextTs = this.nextTs = this.current
            .clone()
            .add(this.month, 'month')
            .valueOf();
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
    return null;
}
exports.getInterval = getInterval;
//# sourceMappingURL=interval.js.map
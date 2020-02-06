import moment from 'moment-timezone';
type Moment = moment.Moment;

abstract class Interval {
  constructor(public tz: string) {}
  // return the previous range if range changed
  abstract changed(ts: number): string;
}

// second, minutes ( not hours )
class SimpleInterval extends Interval {
  current: number;
  constructor(tz: string, public interval: number) {
    super(tz);
  }

  changed(ts: number) {
    let result: string = null;
    let newcurrent = Math.floor(ts / this.interval);
    if (newcurrent !== this.current) {
      if (this.current != null) {
        result = moment.tz(this.current * this.interval, this.tz).toISOString(true);
      }
      this.current = newcurrent;
    }
    return result;
  }
}

class HourInterval extends Interval {
  current: Moment;
  nextTs: number = NaN;
  constructor(tz: string, public hour: number) {
    super(tz);
  }

  changed(ts: number) {
    if (ts < this.nextTs) {
      return null;
    }
    let result: string = null;
    if (this.current) {
      result = this.current.toISOString(true);
    }
    let date = moment.tz(ts, this.tz);
    let h0 = Math.floor(date.hour() / this.hour) * this.hour;
    this.current = moment.tz([date.year(), date.month(), date.day(), h0], this.tz);
    this.nextTs = moment.tz([date.year(), date.month(), date.day(), h0 + this.hour], this.tz).valueOf();
    if (this.nextTs < ts) {
      // protection on day light saving special cases
      this.nextTs = moment.tz([date.year(), date.month(), date.day(), h0 + this.hour + 1], this.tz).valueOf();
    }
    return result;
  }
}

class DayInterval extends Interval {
  current: Moment;
  nextTs: number = NaN;
  constructor(tz: string) {
    super(tz);
  }

  changed(ts: number) {
    if (ts < this.nextTs) {
      return null;
    }
    let result: string = null;
    if (this.current) {
      result = this.current.toISOString(true);
    }
    let date = moment.tz(ts, this.tz);
    this.current = moment.tz([date.year(), date.month(), date.day()], this.tz);
    this.nextTs = moment.tz([date.year(), date.month(), date.day() + 1], this.tz).valueOf();
    return result;
  }
}

class WeekInterval extends Interval {
  current: Moment;
  nextTs: number = NaN;
  constructor(tz: string) {
    super(tz);
  }

  changed(ts: number) {
    if (ts < this.nextTs) {
      return null;
    }
    let result: string = null;
    if (this.current) {
      result = this.current.toISOString(true);
    }
    let date = moment.tz(ts, this.tz);
    let day = date.day() - date.weekday();
    this.current = moment.tz([date.year(), date.month(), day], this.tz);
    this.nextTs = moment.tz([date.year(), date.month(), day + 7], this.tz).valueOf();
    return result;
  }
}

class MonthInterval extends Interval {
  current: Moment;
  nextTs: number = NaN;
  constructor(tz: string, public month: number) {
    super(tz);
  }

  changed(ts: number) {
    if (ts < this.nextTs) {
      return null;
    }
    let result: string = null;
    if (this.current) {
      result = this.current.toISOString(true);
    }
    let date = moment.tz(ts, this.tz);
    let month = Math.floor(date.month() / this.month) * this.month;
    this.current = moment.tz([date.year(), month], this.tz);
    this.nextTs = moment.tz([date.year(), month + this.month], this.tz).valueOf();
    return result;
  }
}

class NoneInterval extends Interval {
  current: Moment;
  constructor(tz: string) {
    super(tz);
  }

  changed(ts: number) {
    let result: string = null;
    if (this.current) {
      result = this.current.toISOString(true);
    }
    this.current = moment.tz(ts, this.tz);
    return result;
  }
}
export function getInterval(interval: string, tz: string): Interval {
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

import moment from 'moment-timezone';
declare type Moment = moment.Moment;
declare abstract class Interval {
    tz: string;
    current: Moment;
    getCurrent(): string;
    constructor(tz: string);
    abstract changed(ts: number): string;
}
export declare function getInterval(interval: string, tz: string): Interval;
export {};

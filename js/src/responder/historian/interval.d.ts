declare abstract class Interval {
    tz: string;
    constructor(tz: string);
    abstract changed(ts: number): string;
}
export declare function getInterval(interval: string, tz: string): Interval;
export {};

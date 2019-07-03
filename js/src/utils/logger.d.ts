export declare function getTs(): string;
export declare class Logger {
    static readonly TRACE = 1;
    static readonly DEBUG = 2;
    static readonly INFO = 4;
    static readonly WARN = 8;
    static readonly ERROR = 16;
    _level: number;
    setLevel(level: number, coverHigherLevel?: boolean): void;
    formatter: (msg: string, level: number, tag?: string) => string;
    printer: (str: string, level: number) => void;
    private _log;
    trace(msg: string, tag?: string): void;
    debug(msg: string, tag?: string): void;
    info(msg: string, tag?: string): void;
    warn(msg: string, tag?: string): void;
    error(msg: string, tag?: string): void;
    tag(tag: string): TaggedLogger;
}
export declare class TaggedLogger {
    readonly logger: Logger;
    readonly tag: string;
    constructor(logger: Logger, tag: string);
    trace(msg: string): void;
    debug(msg: string): void;
    info(msg: string): void;
    warn(msg: string): void;
    error(msg: string): void;
}
export declare const logger: Logger;

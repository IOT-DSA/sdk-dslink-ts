export declare const TRACE = 1;
export declare const DEBUG = 2;
export declare const INFO = 4;
export declare const WARN = 8;
export declare const ERROR = 16;
export declare function getTs(): string;
export declare class Logger {
    level: number;
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

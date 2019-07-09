declare type MsgType = string | (() => string);
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
    trace(msg: MsgType, tag?: string): void;
    debug(msg: MsgType, tag?: string): void;
    info(msg: MsgType, tag?: string): void;
    warn(msg: MsgType, tag?: string): void;
    error(msg: MsgType, tag?: string): void;
    tag(tag: string): TaggedLogger;
}
export declare class TaggedLogger {
    readonly logger: Logger;
    readonly tag: string;
    constructor(logger: Logger, tag: string);
    trace(msg: MsgType): void;
    debug(msg: MsgType): void;
    info(msg: MsgType): void;
    warn(msg: MsgType): void;
    error(msg: MsgType): void;
}
export declare const logger: Logger;
export {};

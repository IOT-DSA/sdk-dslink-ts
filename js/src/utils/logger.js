"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TRACE = 1;
const DEBUG = 2;
const INFO = 4;
const WARN = 8;
const ERROR = 16;
function getTs() {
    let d = new Date();
    let offsetISOStr = d.toISOString(); // new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString();
    return `${offsetISOStr.substring(0, 10)} ${offsetISOStr.substring(11)}`;
}
exports.getTs = getTs;
function getLevelLabel(level) {
    if (level >= ERROR) {
        return 'ERROR';
    }
    else if (level >= WARN) {
        return 'WARN';
    }
    else if (level >= INFO) {
        return 'INFO';
    }
    else if (level >= DEBUG) {
        return 'DEBUG';
    }
    else if (level >= TRACE) {
        return 'TRACE';
    }
    else {
        return '';
    }
}
class Logger {
    constructor() {
        this._level = INFO | WARN | ERROR;
        this.formatter = (msg, level, tag) => {
            if (tag) {
                return `${getTs()} [${tag}] ${getLevelLabel(level)} ${msg}`;
            }
            else {
                return `${getTs()} ${getLevelLabel(level)} ${msg}`;
            }
        };
        this.printer = (str, level) => {
            if (level >= ERROR) {
                console.error(str);
            }
            else if (level >= WARN) {
                console.warn(str);
            }
            else if (level >= INFO) {
                console.info(str);
            }
            else {
                console.log(str);
            }
        };
    }
    setLevel(level, coverHigherLevel = true) {
        let mergedLevel = level;
        if (coverHigherLevel) {
            while (level < ERROR) {
                level <<= 1;
                mergedLevel |= level;
            }
        }
        this._level = mergedLevel;
    }
    _log(level, msg, tag) {
        if (level & this._level) {
            if (this.formatter) {
                let str = typeof msg === 'function' ? msg() : msg;
                this.printer(this.formatter(str, level, tag), level);
            }
        }
    }
    trace(msg, tag) {
        this._log(TRACE, msg, tag);
    }
    debug(msg, tag) {
        this._log(DEBUG, msg, tag);
    }
    info(msg, tag) {
        this._log(INFO, msg, tag);
    }
    warn(msg, tag) {
        this._log(WARN, msg, tag);
    }
    error(msg, tag) {
        this._log(ERROR, msg, tag);
    }
    tag(tag) {
        return new TaggedLogger(this, tag);
    }
}
Logger.TRACE = TRACE;
Logger.DEBUG = DEBUG;
Logger.INFO = INFO;
Logger.WARN = WARN;
Logger.ERROR = ERROR;
exports.Logger = Logger;
class TaggedLogger {
    constructor(logger, tag) {
        this.logger = logger;
        this.tag = tag;
    }
    trace(msg) {
        this.logger.trace(msg, this.tag);
    }
    debug(msg) {
        this.logger.debug(msg, this.tag);
    }
    info(msg) {
        this.logger.info(msg, this.tag);
    }
    warn(msg) {
        this.logger.warn(msg, this.tag);
    }
    error(msg) {
        this.logger.error(msg, this.tag);
    }
}
exports.TaggedLogger = TaggedLogger;
exports.logger = new Logger();
//# sourceMappingURL=logger.js.map
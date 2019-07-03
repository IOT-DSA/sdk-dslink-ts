"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRACE = 1;
exports.DEBUG = 2;
exports.INFO = 4;
exports.WARN = 8;
exports.ERROR = 16;
const _DEBUG = exports.TRACE | exports.DEBUG;
const _INFO = _DEBUG | exports.INFO;
const _WARN = _INFO | exports.WARN;
const _ERROR = _WARN | exports.ERROR;
function getTs() {
    let d = new Date();
    let offsetISOStr = d.toISOString(); // new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString();
    return `${offsetISOStr.substring(0, 10)} ${offsetISOStr.substring(11)}`;
}
exports.getTs = getTs;
function getLevelLabel(level) {
    if (level >= exports.ERROR) {
        return 'ERROR';
    }
    else if (level >= exports.WARN) {
        return 'WARN';
    }
    else if (level >= exports.INFO) {
        return 'INFO';
    }
    else if (level >= exports.DEBUG) {
        return 'DEBUG';
    }
    else if (level >= exports.TRACE) {
        return 'TRACE';
    }
    else {
        return '';
    }
}
class Logger {
    constructor() {
        this.level = exports.INFO;
        this.formatter = (msg, level, tag) => {
            if (tag) {
                return `${getTs} [${tag}] ${getLevelLabel(level)} ${msg}`;
            }
            else {
                return `${getTs} ${getLevelLabel(level)} ${msg}`;
            }
        };
        this.printer = (str, level) => {
            if (level >= exports.ERROR) {
                console.error(str);
            }
            else if (level >= exports.WARN) {
                console.warn(str);
            }
            else if (level >= exports.INFO) {
                console.info(str);
            }
            else {
                console.log(str);
            }
        };
    }
    _log(level, msg, tag) {
        if (level | this.level) {
            if (this.formatter) {
                this.printer(this.formatter(msg, level, tag), level);
            }
        }
    }
    trace(msg, tag) {
        this._log(exports.TRACE, msg, tag);
    }
    debug(msg, tag) {
        this._log(_DEBUG, msg, tag);
    }
    info(msg, tag) {
        this._log(_INFO, msg, tag);
    }
    warn(msg, tag) {
        this._log(_WARN, msg, tag);
    }
    error(msg, tag) {
        this._log(_ERROR, msg, tag);
    }
    tag(tag) {
        return new TaggedLogger(this, tag);
    }
}
exports.Logger = Logger;
class TaggedLogger {
    constructor(logger, tag) {
        this.logger = logger;
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
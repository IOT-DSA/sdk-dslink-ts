const TRACE = 1;
const DEBUG = 2;
const INFO = 4;
const WARN = 8;
const ERROR = 16;

type MsgType = string | (() => string);

export function getTs(): string {
  let d = new Date();
  let offsetISOStr = d.toISOString(); // new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString();
  return `${offsetISOStr.substring(0, 10)} ${offsetISOStr.substring(11)}`;
}

function getLevelLabel(level: number): string {
  if (level >= ERROR) {
    return 'ERROR';
  } else if (level >= WARN) {
    return 'WARN';
  } else if (level >= INFO) {
    return 'INFO';
  } else if (level >= DEBUG) {
    return 'DEBUG';
  } else if (level >= TRACE) {
    return 'TRACE';
  } else {
    return '';
  }
}

export class Logger {
  static readonly TRACE = TRACE;
  static readonly DEBUG = DEBUG;
  static readonly INFO = INFO;
  static readonly WARN = WARN;
  static readonly ERROR = ERROR;


  _level: number = INFO | WARN | ERROR;

  setLevel(level: number, coverHigherLevel = true) {
    let mergedLevel = level;
    if (coverHigherLevel) {
      while (level < ERROR) {
        level <<= 1;
        mergedLevel |= level;
      }
    }
    this._level = mergedLevel;
  }

  formatter = (msg: string, level: number, tag?: string) => {
    if (tag) {
      return `${getTs()} [${tag}] ${getLevelLabel(level)} ${msg}`;
    } else {
      return `${getTs()} ${getLevelLabel(level)} ${msg}`;
    }
  };

  printer = (str: string, level: number) => {
    if (level >= ERROR) {
      console.error(str);
    } else if (level >= WARN) {
      console.warn(str);
    } else if (level >= INFO) {
      console.info(str);
    } else {
      console.log(str);
    }
  };

  private _log(level: number, msg: MsgType, tag?: string) {
    if (level & this._level) {
      if (this.formatter) {
        let str = typeof msg === 'function' ? msg() : msg;
        this.printer(
          this.formatter(str, level, tag), level
        );
      }
    }
  }

  trace(msg: MsgType, tag?: string) {
    this._log(TRACE, msg, tag);
  }

  debug(msg: MsgType, tag?: string) {
    this._log(DEBUG, msg, tag);
  }

  info(msg: MsgType, tag?: string) {
    this._log(INFO, msg, tag);
  }

  warn(msg: MsgType, tag?: string) {
    this._log(WARN, msg, tag);
  }

  error(msg: MsgType, tag?: string) {
    this._log(ERROR, msg, tag);
  }

  tag(tag: string) {
    return new TaggedLogger(this, tag);
  }
}

export class TaggedLogger {
  readonly logger: Logger;
  readonly tag: string;

  constructor(logger: Logger, tag: string) {
    this.logger = logger;
    this.tag = tag;
  }


  trace(msg: MsgType) {
    this.logger.trace(msg, this.tag);
  }

  debug(msg: MsgType) {
    this.logger.debug(msg, this.tag);
  }

  info(msg: MsgType) {
    this.logger.info(msg, this.tag);
  }

  warn(msg: MsgType) {
    this.logger.warn(msg, this.tag);
  }

  error(msg: MsgType) {
    this.logger.error(msg, this.tag);
  }
}


export const logger = new Logger();

const TRACE = 1;
const DEBUG = 2;
const INFO = 4;
const WARN = 8;
const ERROR = 16;


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

  private _log(level: number, msg: string, tag?: string) {
    if (level & this._level) {
      if (this.formatter) {
        this.printer(
          this.formatter(msg, level, tag), level
        );
      }
    }
  }

  trace(msg: string, tag?: string) {
    this._log(TRACE, msg, tag);
  }

  debug(msg: string, tag?: string) {
    this._log(DEBUG, msg, tag);
  }

  info(msg: string, tag?: string) {
    this._log(INFO, msg, tag);
  }

  warn(msg: string, tag?: string) {
    this._log(WARN, msg, tag);
  }

  error(msg: string, tag?: string) {
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
  }


  trace(msg: string) {
    this.logger.trace(msg, this.tag);
  }

  debug(msg: string) {
    this.logger.debug(msg, this.tag);
  }

  info(msg: string) {
    this.logger.info(msg, this.tag);
  }

  warn(msg: string) {
    this.logger.warn(msg, this.tag);
  }

  error(msg: string) {
    this.logger.error(msg, this.tag);
  }
}


export const logger = new Logger();

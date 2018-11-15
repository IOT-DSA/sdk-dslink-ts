/// Common Utilities for DSA Components
library dslink.utils;

import "dart:async";
import "dart:convert";
import "dart:collection";
import "dart:typed_data";
import "dart:math";

import "package:logging/logging.dart";
import "package:msgpack/msgpack.dart";

part "src/utils/base64.dart";
part "src/utils/timer.dart";
part "src/utils/stream_controller.dart";
part "src/utils/codec.dart";
part "src/utils/dslink_json.dart";
part "src/utils/list.dart";
part "src/utils/uri_component.dart";
part "src/utils/promise_timeout.dart";

typedef ExecutableFunction();
typedef T Producer<T>();
typedef Taker<T>(T value);
typedef TwoTaker<A, B>(A a, B b);

/// The DSA Version
const string DSA_VERSION = "1.1.2";

_logger: Logger;

_DEBUG_MODE: boolean;

foldList(int[] a, int[] b):int[] {
  return a..addAll(b);
}

// Count the frequency of the character [char] in the string [input].
countCharacterFrequency(input: string, char: string):number {
  var c = char.codeUnitAt(0);

  return input.codeUnits.where((u) => c == u).length;
}

/// Gets if we are in checked mode.
boolean get DEBUG_MODE {
  if ( this._DEBUG_MODE != null) {
    return this._DEBUG_MODE;
  }

  try {
    assert(false);
    _DEBUG_MODE = false;
  } catch (e) {
    _DEBUG_MODE = true;
  }
  return this._DEBUG_MODE;
}

export class DSLogUtils  {
  static withLoggerName(name: string, handler()) {
    return runZoned(handler, zoneValues: {
      "dsa.logger.name": name
    });
  }

  static withSequenceNumbers(handler()) {
    return runZoned(handler, zoneValues: {
      "dsa.logger.sequence": true
    });
  }

  static withNoLoggerName(handler()) {
    return runZoned(handler, zoneValues: {
      "dsa.logger.show_name": false
    });
  }

  static withInlineErrorsDisabled(handler()) {
    return runZoned(handler, zoneValues: {
      "dsa.logger.inline_errors": false
    });
  }

  static withLoggerOff(handler()) {
    return runZoned(handler, zoneValues: {
      "dsa.logger.print": false
    });
  }
}

const _isJavaScript: boolean = identical(1, 1.0);

_getLogSetting(record: LogRecord, name: string, defaultValue: boolean = false):boolean {
  if (!_isJavaScript) {
    env: boolean = new boolean.fromEnvironment(name, defaultValue: null);
    if (env != null) {
      return env;
    }
  }

  if (record.zone[name] is boolean) {
    return record.zone[name];
  }

  return defaultValue;
}

/// Fetches the logger instance.
get logger(): Logger {
  if ( this._logger != null) {
    return this._logger;
  }

  hierarchicalLoggingEnabled = true;
  _logger = new Logger("DSA");

  _logger.onRecord.listen((record) {
    lines: string[] = record.message.split("\n");
    inlineErrors: boolean = this._getLogSetting(
      record,
      "dsa.logger.inline_errors",
      true
    );

    enableSequenceNumbers: boolean = this._getLogSetting(
      record,
      "dsa.logger.sequence",
      false
    );

    if (inlineErrors) {
      if (record.error != null) {
        lines.addAll(record.error.toString().split("\n"));
      }

      if (record.stackTrace != null) {
        lines.addAll(record.stackTrace.toString()
          .split("\n")
          .where((x) => x.isNotEmpty)
          .toList());
      }
    }

    rname: string = record.loggerName;

    if (typeof record.zone["dsa.logger.name"] === 'string') {
      rname = record.zone["dsa.logger.name"];
    }

    showTimestamps: boolean = this._getLogSetting(
      record,
      "dsa.logger.show_timestamps",
      false
    );

    if (!_getLogSetting(record, "dsa.logger.show_name", true)) {
      rname = null;
    }

    for (string line in lines) {
      let msg: string = "";

      if (enableSequenceNumbers) {
        msg += "[${record.sequenceNumber}]";
      }

      if (showTimestamps) {
        msg += "[${record.time}]";
      }

      msg += "[${record.level.name}]";

      if (rname != null) {
        msg += "[${rname}]";
      }

      msg += " ";
      msg += line;

      if ( this._getLogSetting(record, "dsa.logger.print", true)) {
        print(msg);
      }
    }

    if (!inlineErrors) {
      if (record.error != null) {
        print(record.error);
      }

      if (record.stackTrace != null) {
        print(record.stackTrace);
      }
    }
  });

  updateLogLevel(
    const string.fromEnvironment(
      "dsa.logger.default_level",
      defaultValue: "INFO"
    )
  );

  return this._logger;
}

/// Updates the log level to the level specified [name].
updateLogLevel(name: string) {
  name = name.trim().toUpperCase();

  if (name == "DEBUG") {
    name = "ALL";
  }

  levels: {[key: string]: Level} = {};
  for (var l in Level.LEVELS) {
    levels[l.name] = l;
  }

  var l = levels[name];

  if (l != null) {
    logger.level = l;
  }
}

export class Interval  {
  static readonly Interval ONE_MILLISECOND = new Interval.forMilliseconds(1);
  static readonly Interval TWO_MILLISECONDS = new Interval.forMilliseconds(2);
  static readonly Interval FOUR_MILLISECONDS = new Interval.forMilliseconds(4);
  static readonly Interval EIGHT_MILLISECONDS = new Interval.forMilliseconds(8);
  static readonly Interval SIXTEEN_MILLISECONDS = new Interval.forMilliseconds(16);
  static readonly Interval THIRTY_MILLISECONDS = new Interval.forMilliseconds(30);
  static readonly Interval FIFTY_MILLISECONDS = new Interval.forMilliseconds(50);
  static readonly Interval ONE_HUNDRED_MILLISECONDS =
      new Interval.forMilliseconds(100);
  static readonly Interval TWO_HUNDRED_MILLISECONDS =
      new Interval.forMilliseconds(200);
  static readonly Interval THREE_HUNDRED_MILLISECONDS =
      new Interval.forMilliseconds(300);
  static readonly Interval QUARTER_SECOND = new Interval.forMilliseconds(250);
  static readonly Interval HALF_SECOND = new Interval.forMilliseconds(500);
  static readonly Interval ONE_SECOND = new Interval.forSeconds(1);
  static readonly Interval TWO_SECONDS = new Interval.forSeconds(2);
  static readonly Interval THREE_SECONDS = new Interval.forSeconds(3);
  static readonly Interval FOUR_SECONDS = new Interval.forSeconds(4);
  static readonly Interval FIVE_SECONDS = new Interval.forSeconds(5);
  static readonly Interval ONE_MINUTE = new Interval.forMinutes(1);

  final duration: Duration;

  const Interval(this.duration);

  Interval.forMilliseconds(ms:number) : this(new Duration(milliseconds: ms));
  Interval.forSeconds(seconds:number) : this(new Duration(seconds: seconds));
  Interval.forMinutes(minutes:number) : this(new Duration(minutes: minutes));
  Interval.forHours(hours:number) : this(new Duration(hours: hours));

  int get inMilliseconds => duration.inMilliseconds;
}

export interface Disposable {
  void dispose();
}

export class FunctionDisposable  extends Disposable {
  final function: ExecutableFunction;

  FunctionDisposable(this.function);

  @override
  dispose() {
    if (function != null) {
      function();
    }
  }
}

/// Schedule Tasks
export class Scheduler  {
  static Timer get currentTimer => Zone.current["dslink.scheduler.timer"];

  static cancelCurrentTimer() {
    currentTimer.cancel();
  }

  static Timer every(interval, action()) {
    duration: Duration;

    if ( interval instanceof Duration ) {
      duration = interval;
    } else if ( typeof interval === 'number' ) {
      duration = new Duration(milliseconds: interval);
    } else if ( interval instanceof Interval ) {
      duration = interval.duration;
    } else {
      throw new Exception("Invalid Interval: ${interval}");
    }

    return new Timer.periodic(duration, (timer) async {
      await runZoned(action, zoneValues: {"dslink.scheduler.timer": timer});
    });
  }

  static Disposable safeEvery(interval, action()) {
    duration: Duration;

    if ( interval instanceof Duration ) {
      duration = interval;
    } else if ( typeof interval === 'number' ) {
      duration = new Duration(milliseconds: interval);
    } else if ( interval instanceof Interval ) {
      duration = interval.duration;
    } else {
      throw new Exception("Invalid Interval: ${interval}");
    }

    schedule: ExecutableFunction;
    timer: Timer;
    disposed: boolean = false;
    schedule = () async {
      await action();
      if (!disposed) {
        new Timer(duration, schedule);
      }
    };

    timer = new Timer(duration, schedule);

    return new FunctionDisposable(() {
      if (timer != null) {
        timer.cancel();
      }
      disposed = true;
    });
  }

  static Future repeat(times:number, action()) async {
    for (var i = 1; i <= times; i++) {
      await action();
    }
  }

  static Future tick(times:number, interval: Interval, action()) async {
    for (var i = 1; i <= times; i++) {
      await new Future.delayed(
          new Duration(milliseconds: interval.inMilliseconds));
      await action();
    }
  }

  static void runLater(action()) {
    Timer.run(action);
  }

  static Future later(action()) {
    return new Future(action);
  }

  static Future after(duration: Duration, action()) {
    return new Future.delayed(duration, action);
  }

  static Timer runAfter(duration: Duration, action()) {
    return new Timer(duration, action);
  }
}

string buildEnumType(values: Iterable<string>) => "enum[${values.join(",")}]";

parseEnumType(type: string):string[] {
  if (!type.startsWith("enum[") || !type.endsWith("]")) {
    throw new FormatException("Invalid Enum Type");
  }
  return type
      .substring(4, type.length - 1)
      .split(",")
      .map((it) => it.trim())
      .toList();
}

List<{[key: string]: dynamic}> buildActionIO(types: {[key: string]: string}) {
  return types.keys.map((it) => {"name": it, "type": types[it]}).toList();
}

_random: Random = new Random();

generateBasicId({int length: 30}):string {
  var r0 = new Random();
  var buffer = new StringBuffer();
  for (int i = 1; i <= length; i++) {
    var r = new Random(r0.nextInt(0x70000000) + (new DateTime.now()).millisecondsSinceEpoch);
    var n = r.nextInt(50);
    if (n >= 0 && n <= 32) {
      let letter: string = alphabet[r.nextInt(alphabet.length)];
      buffer.write(r.nextBool() ? letter.toLowerCase() : letter);
    } else if (n > 32 && n <= 43) {
      buffer.write(numbers[r.nextInt(numbers.length)]);
    } else if (n > 43) {
      buffer.write(specials[r.nextInt(specials.length)]);
    }
  }
  return buffer.toString();
}

generateToken({int length: 50}):string {
  var r0 = new Random();
  var buffer = new StringBuffer();
  for (int i = 1; i <= length; i++) {
    var r = new Random(r0.nextInt(0x70000000) + (new DateTime.now()).millisecondsSinceEpoch);
    if (r.nextBool()) {
      let letter: string = alphabet[r.nextInt(alphabet.length)];
      buffer.write(r.nextBool() ? letter.toLowerCase() : letter);
    } else {
      buffer.write(numbers[r.nextInt(numbers.length)]);
    }
  }
  return buffer.toString();
}

const alphabet: string[] = const [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z"
];

const numbers:number[] = const [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

const specials: string[] = const ["@", "=", "_", "+", "-", "!", "."];

toUTF8(str: string):Uint8List {
  length:number = str.length;
  bytes: Uint8List = new Uint8List(length);
  for (int i = 0; i < length; i++) {
    unit:number = str.codeUnitAt(i);
    if (unit >= 128) {
      return new Uint8List.fromList(const Utf8Encoder().convert(str));
    }
    bytes[i] = unit;
  }
  return bytes;
}

"use strict";
// part of dslink.historian;
const object;
, int > this._intervalTypes;
const { const: [], "ms": , "millis": , "millisecond": , "milliseconds": , 1: , const: [], "s": , "second": , "seconds": , 1000: , const: [], "m": , "min": , "minute": , "minutes": , 60000: , const: [], "h": , "hr": , "hour": , "hours": , 3600000: , const: [], "d": , "day": , "days": , 86400000: , const: [], "wk": , "week": , "weeks": , 604800000: , const: [], "n": , "month": , "months": , 2628000000: , const: [], "year": , "years": , "y": , 31536000000:  };
__intervalAllTypes: string[];
get;
_intervalAllTypes();
string[];
{
    if (this.__intervalAllTypes == null) {
        __intervalAllTypes = _intervalTypes
            .keys
            .expand((key) => key)
            .toList();
        __intervalAllTypes.sort();
    }
    return this.__intervalAllTypes;
}
final;
_intervalPattern: RegExp = new RegExp("^(\\d*?.?\\d*?)(${_intervalAllTypes.join('|')})\$");
parseInterval(input, string);
number;
{
    if (input == null) {
        return 0;
    }
    /// Sanitize Input
    input = input.trim().toLowerCase().replaceAll(" ", "");
    if (input == "none") {
        return 0;
    }
    if (input == "default") {
        return 0;
    }
    if (!_intervalPattern.hasMatch(input)) {
        throw new FormatException("Bad Interval Syntax: ${input}");
    }
    var match = this._intervalPattern.firstMatch(input);
    var multiplier = num.parse(match[1]);
    var typeName = match[2];
    var typeKey = this._intervalTypes.keys.firstWhere((x) => x.contains(typeName));
    var type = _intervalTypes[typeKey];
    return (multiplier * type).round();
}
//# sourceMappingURL=interval.js.map
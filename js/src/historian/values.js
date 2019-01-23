"use strict";
// part of dslink.historian;
Object.defineProperty(exports, "__esModule", { value: true });
class HistorySummary {
}
exports.HistorySummary = HistorySummary;
class ValuePair {
    get time() { }
    toRow() {
        return [timestamp, value];
    }
}
exports.ValuePair = ValuePair;
class TimeRange {
    get duration() { }
    isWithin(time) {
        valid: boolean = (time.isAfter(start) || time.isAtSameMomentAs(start));
        if (end != null) {
            valid = valid && (time.isBefore(end) || time.isAtSameMomentAs(end));
        }
        return valid;
    }
}
exports.TimeRange = TimeRange;
class ValueEntry {
    asPair() {
        return new ValuePair(timestamp, value);
    }
    get time() { }
}
exports.ValueEntry = ValueEntry;
parseTimeRange(input, string);
TimeRange;
{
    tr: TimeRange;
    if (input != null) {
        string[];
        l = input.split("/");
        start: DateTime = DateTime.parse(l[0]);
        end: DateTime = DateTime.parse(l[1]);
        tr = new TimeRange(start, end);
    }
    return tr;
}
//# sourceMappingURL=values.js.map
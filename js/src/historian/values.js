// part of dslink.historian;
export class HistorySummary {
}
export class ValuePair {
    get time() { }
    toRow() {
        return [timestamp, value];
    }
}
export class TimeRange {
    get duration() { }
    isWithin(time) {
        valid: boolean = (time.isAfter(start) || time.isAtSameMomentAs(start));
        if (end != null) {
            valid = valid && (time.isBefore(end) || time.isAtSameMomentAs(end));
        }
        return valid;
    }
}
export class ValueEntry {
    asPair() {
        return new ValuePair(timestamp, value);
    }
    get time() { }
}
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
// part of dslink.historian;

export class HistorySummary  {
  final first: ValuePair;
  final last: ValuePair;

  HistorySummary(this.first, this.last);
}

export class ValuePair  {
  final timestamp: string;
  final dynamic value;

  DateTime get time => DateTime.parse(timestamp);

  ValuePair(this.timestamp, this.value);

  toRow():List {
    return [timestamp, value];
  }
}

export class TimeRange  {
  final start: DateTime;
  final end: DateTime;

  TimeRange(this.start, this.end);

  Duration get duration => end.difference(start);

  isWithin(time: DateTime):boolean {
    valid: boolean = (time.isAfter(start) || time.isAtSameMomentAs(start));
    if (end != null) {
      valid = valid && (time.isBefore(end) || time.isAtSameMomentAs(end));
    }
    return valid;
  }
}

export class ValueEntry  {
  final group: string;
  final path: string;
  final timestamp: string;
  final dynamic value;

  ValueEntry(this.group, this.path, this.timestamp, this.value);

  asPair():ValuePair {
    return new ValuePair(timestamp, value);
  }

  DateTime get time => DateTime.parse(timestamp);
}

parseTimeRange(input: string):TimeRange {
  tr: TimeRange;
  if (input != null) {
    string[] l = input.split("/");
    start: DateTime = DateTime.parse(l[0]);
    end: DateTime = DateTime.parse(l[1]);

    tr = new TimeRange(start, end);
  }
  return tr;
}

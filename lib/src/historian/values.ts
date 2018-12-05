// part of dslink.historian;

export class HistorySummary  {
  readonly first: ValuePair;
  readonly last: ValuePair;

  HistorySummary(this.first, this.last);
}

export class ValuePair  {
  readonly timestamp: string;
  readonly dynamic value;

  DateTime get time => DateTime.parse(timestamp);

  ValuePair(this.timestamp, this.value);

  toRow():List {
    return [timestamp, value];
  }
}

export class TimeRange  {
  readonly start: DateTime;
  readonly end: DateTime;

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
  readonly group: string;
  readonly path: string;
  readonly timestamp: string;
  readonly dynamic value;

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

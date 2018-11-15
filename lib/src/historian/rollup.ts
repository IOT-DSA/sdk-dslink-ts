// part of dslink.historian;

export interface Rollup {
  value:dynamic;

  void add(dynamic input);

  void reset();
}

export class FirstRollup  extends Rollup {
  @override
  add(input) {
    if (set) {
      return;
    }
    value = input;
    set = true;
  }

  @override
  reset() {
    set = false;
  }

  dynamic value;
  set: boolean = false;
}

export class LastRollup  extends Rollup {
  @override
  add(input) {
    value = input;
  }

  @override
  reset() {
  }

  dynamic value;
}

export class AvgRollup  extends Rollup {
  @override
  add(input) {
    if ( typeof input === 'string' ) {
      input = num.parse(input, (e) => input.length);
    }

    if ( typeof input !== 'number' ) {
      return;
    }

    total += input;
    count++;
  }

  @override
  reset() {
    total = 0.0;
    count = 0;
  }

  dynamic total = 0.0;

  dynamic get value => total / count;
  count:number = 0;
}

export class SumRollup  extends Rollup {
  @override
  add(input) {
    if ( typeof input === 'string' ) {
      input = num.parse(input, (e) => input.length);
    }

    if ( typeof input !== 'number' ) {
      return;
    }

    value += input;
  }

  @override
  reset() {
    value = 0.0;
  }

  dynamic value = 0.0;
}

export class CountRollup  extends Rollup {
  @override
  add(input) {
    value++;
  }

  @override
  reset() {
    value = 0;
  }

  dynamic value = 0;
}

export class MaxRollup  extends Rollup {
  @override
  add(input) {
    if ( typeof input === 'string' ) {
      input = num.parse(input, (e) => null);
    }

    if ( typeof input !== 'number' ) {
      return;
    }

    value = max(value == null ? double.NEGATIVE_INFINITY : value, input);
  }

  @override
  reset() {
    value = null;
  }

  dynamic value;
}

export class MinRollup  extends Rollup {
  @override
  add(input) {
    if ( typeof input === 'string' ) {
      input = num.parse(input, (e) => null);
    }

    if ( typeof input !== 'number' ) {
      return;
    }

    value = min(value == null ? double.INFINITY : value, input);
  }

  @override
  reset() {
    value = null;
  }

  dynamic value;
}

typedef Rollup RollupFactory();

final _rollups: {[key: string]: RollupFactory} = {
  "none": () => null,
  "delta": () => new FirstRollup(),
  "first": () => new FirstRollup(),
  "last": () => new LastRollup(),
  "max": () => new MaxRollup(),
  "min": () => new MinRollup(),
  "count": () => new CountRollup(),
  "sum": () => new SumRollup(),
  "avg": () => new AvgRollup()
};

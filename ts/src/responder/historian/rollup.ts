export interface Rollup {
  update(value: any): void;
  reset(): void;
  getValue(): any;
}

// avg,min,max,sum,first,last,and,or,count,auto]

class AvgRollup implements Rollup {
  getValue(): any {
    return this.total / this.count;
  }

  total: number = 0;
  count: number = 0;
  reset() {
    this.total = 0;
    this.count = 0;
  }

  update(value: any): void {
    if (typeof value === 'number') {
      this.total += value;
      ++this.count;
    }
  }
}

class SumRollup extends AvgRollup {
  getValue(): any {
    return this.total;
  }
}

class MinRollup implements Rollup {
  getValue(): any {
    if (this.value === Infinity) {
      return null;
    }
    return this.value;
  }

  value: number = Infinity;
  reset() {
    this.value = Infinity;
  }
  update(value: any): void {
    if (typeof value === 'number' && value < this.value) {
      this.value = value;
    }
  }
}

class MaxRollup implements Rollup {
  getValue(): any {
    if (this.value === -Infinity) {
      return null;
    }
    return this.value;
  }

  value: number = -Infinity;
  reset() {
    this.value = -Infinity;
  }
  update(value: any): void {
    if (typeof value === 'number' && value > this.value) {
      this.value = value;
    }
  }
}

class FirstRollup implements Rollup {
  getValue(): any {
    return this.value;
  }

  first = false;
  value: any = null;
  reset() {
    this.first = false;
    this.value = null;
  }
  update(value: any): void {
    if (!this.first) {
      this.first = true;
      this.value = value;
    }
  }
}

class LastRollup implements Rollup {
  getValue(): any {
    return this.value;
  }

  value: any = null;
  reset() {
    this.value = null;
  }
  update(value: any): void {
    this.value = value;
  }
}

class AndRollup implements Rollup {
  getValue(): any {
    return this.value;
  }

  value: boolean = null;
  reset() {
    this.value = null;
  }
  update(value: any): void {
    if (value === undefined) {
      this.value = value;
    } else if (this.value && !value) {
      this.value = false;
    }
  }
}

class OrRollup implements Rollup {
  getValue(): any {
    return this.value;
  }

  value: boolean = null;
  reset() {
    this.value = null;
  }
  update(value: any): void {
    if (value === undefined) {
      this.value = value;
    } else if (!this.value && value) {
      this.value = true;
    }
  }
}

class CountRollup implements Rollup {
  getValue(): any {
    return this.count;
  }

  count = 0;
  reset() {
    this.count = 0;
  }
  update(value: any): void {
    if (value != null) {
      ++this.count;
    }
  }
}

export function getRollup(rollup: string): Rollup {
  switch (rollup) {
    case 'avg':
      return new AvgRollup();
    case 'min':
      return new MinRollup();
    case 'max':
      return new MaxRollup();
    case 'sum':
      return new SumRollup();
    case 'first':
      return new FirstRollup();
    case 'last':
      return new LastRollup();
    case 'and':
      return new AndRollup();
    case 'or':
      return new OrRollup();
    case 'count':
      return new CountRollup();
  }
  // default to avg
  return new AvgRollup();
}

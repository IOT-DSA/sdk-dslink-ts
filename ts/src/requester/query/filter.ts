import {FilterStructure, ValueFilterStructure} from './query-structure';
import {Requester} from '../requester';
import {ValueUpdate} from '../../common/value';
import {Closable} from '../../utils/async';
import {RequesterListUpdate} from '../request/list';

type Operation = 'all' | 'any' | '=' | '!=' | '>' | '<' | '>=' | '<=';
const operationMap: {[key: string]: (filter: FilterStructure) => QueryFilter} = {
  '=': (filter: ValueFilterStructure) => new EqualsFilter(filter),
  '!=': (filter: ValueFilterStructure) => new NotEqualsFilter(filter),
  '>': (filter: ValueFilterStructure) => new GreaterFilter(filter),
  '<': (filter: ValueFilterStructure) => new LessFilter(filter),
  '>=': (filter: ValueFilterStructure) => new GreaterEqualFilter(filter),
  '<=': (filter: ValueFilterStructure) => new LessEqualFilter(filter)
};

export abstract class QueryFilter {
  static create(requester: Requester, path: string, onChange: () => void, filter: FilterStructure): QueryFilter {
    let result: QueryFilter;
    for (let op in operationMap) {
      if (op in filter) {
        result = operationMap[op](filter);
        break;
      }
    }
    if (result) {
      result.requester = requester;
      result.path = path;
      result.onChange = onChange;
    }
    return result;
  }
  requester: Requester;
  path: string;
  onChange: () => void;

  abstract start(): void;

  /**
   * @returns [matched, ready]
   */
  abstract check(): [boolean, boolean];

  abstract destroy(): void;
}

abstract class ValueFilter extends QueryFilter {
  path: string;
  field: string;
  value: any;
  target: any;
  live: boolean;
  _ready = false;
  _invalid = false;

  protected constructor(filter: ValueFilterStructure) {
    super();
    this.field = filter.field;
    this.live = filter.mode === 'live';
  }
  start() {
    if (!this.field) {
      this._invalid = true;
      this._ready = true;
      return;
    }
    if (!this.listener) {
      if (this.field === '?value') {
        this.listener = this.requester.subscribe(this.path, this.subscribeCallback);
      } else {
        this.listener = this.requester.list(this.path, this.listCallback);
      }
    }
  }

  check(): [boolean, boolean] {
    if (!this._ready) {
      return [false, false];
    }
    if (this._invalid) {
      return [false, true];
    }
    return [this.compare(), true];
  }

  abstract compare(): boolean;

  listener: Closable;
  subscribeCallback = (update: ValueUpdate) => {
    this.value = update.value;
    // TODO maintain list of error state
    if (!update.status) {
      this._ready = true;
    }
    this.onChange();
    if (!this.live && this.listener) {
      this.listener.close();
      this.listener = null;
    }
  };
  listCallback = (update: RequesterListUpdate) => {
    this.value = update.node.get(this.field);
    this._ready = true;
    this.onChange();
    if (!this.live && this.listener) {
      this.listener.close();
      this.listener = null;
    }
  };

  destroy(): void {
    if (this.listener) {
      this.listener.close();
      this.listener = null;
    }
  }
}

class EqualsFilter extends ValueFilter {
  constructor(filter: ValueFilterStructure) {
    super(filter);
    this.target = filter['='];
  }

  compare(): boolean {
    return this.value === this.target;
  }
}

class NotEqualsFilter extends ValueFilter {
  constructor(filter: ValueFilterStructure) {
    super(filter);
    this.target = filter['!='];
  }

  compare(): boolean {
    return this.value !== this.target;
  }
}

class GreaterFilter extends ValueFilter {
  constructor(filter: ValueFilterStructure) {
    super(filter);
    this.target = filter['>'];
  }

  compare(): boolean {
    return this.value > this.target;
  }
}

class LessFilter extends ValueFilter {
  constructor(filter: ValueFilterStructure) {
    super(filter);
    this.target = filter['<'];
  }

  compare(): boolean {
    return this.value < this.target;
  }
}

class GreaterEqualFilter extends ValueFilter {
  constructor(filter: ValueFilterStructure) {
    super(filter);
    this.target = filter['>='];
  }

  compare(): boolean {
    return this.value >= this.target;
  }
}

class LessEqualFilter extends ValueFilter {
  constructor(filter: ValueFilterStructure) {
    super(filter);
    this.target = filter['<='];
  }

  compare(): boolean {
    return this.value <= this.target;
  }
}

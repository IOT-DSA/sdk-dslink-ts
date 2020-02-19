import {FilterStructure} from './query-structure';
import {Requester} from '../requester';
import {ValueUpdate} from '../../common/value';
import {Closable} from '../../utils/async';
import {RequesterListUpdate} from '../request/list';

type Operation = 'all' | 'any' | '=' | '!=' | '>' | '<' | '>=' | '<=';
const operationMap: {[key: string]: (filter: FilterStructure) => QueryFilter} = {
  '=': (filter: FilterStructure) => new EqualsFilter(filter),
  'all': (filter: FilterStructure) => new AllFilter(filter),
  'any': (filter: FilterStructure) => new AnyFilter(filter),
  '!=': (filter: FilterStructure) => new NotEqualsFilter(filter),
  '>': (filter: FilterStructure) => new GreaterFilter(filter),
  '<': (filter: FilterStructure) => new LessFilter(filter),
  '>=': (filter: FilterStructure) => new GreaterEqualFilter(filter),
  '<=': (filter: FilterStructure) => new LessEqualFilter(filter)
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

  protected constructor(filter: FilterStructure) {
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
      } else if (this.field.startsWith('@') || this.field.startsWith('$')) {
        this.listener = this.requester.list(this.path, this.listCallback);
      } else if (!this.field.startsWith('?')) {
        this.listener = this.requester.subscribe(`${this.path}/${this.field}`, this.subscribeCallback);
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
    this._invalid = Boolean(update.status);
    this._ready = true;
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
  constructor(filter: FilterStructure) {
    super(filter);
    this.target = filter['='];
  }

  compare(): boolean {
    if (this.target == null) {
      // null and undefined should be treated as equal
      return this.value == null;
    } else {
      return this.value === this.target;
    }
  }
}

class NotEqualsFilter extends ValueFilter {
  constructor(filter: FilterStructure) {
    super(filter);
    this.target = filter['!='];
  }

  compare(): boolean {
    if (this.target == null) {
      // null and undefined should be treated as equal
      return this.value != null;
    } else {
      return this.value !== this.target;
    }
  }
}

class GreaterFilter extends ValueFilter {
  constructor(filter: FilterStructure) {
    super(filter);
    this.target = filter['>'];
  }

  compare(): boolean {
    return this.value > this.target;
  }
}

class LessFilter extends ValueFilter {
  constructor(filter: FilterStructure) {
    super(filter);
    this.target = filter['<'];
  }

  compare(): boolean {
    return this.value < this.target;
  }
}

class GreaterEqualFilter extends ValueFilter {
  constructor(filter: FilterStructure) {
    super(filter);
    this.target = filter['>='];
  }

  compare(): boolean {
    return this.value >= this.target;
  }
}

class LessEqualFilter extends ValueFilter {
  constructor(filter: FilterStructure) {
    super(filter);
    this.target = filter['<='];
  }

  compare(): boolean {
    return this.value <= this.target;
  }
}

abstract class MultiFilter extends QueryFilter {
  filterData: FilterStructure[] = [];
  filters: QueryFilter[] = [];

  initFilters() {
    if (this.filters.length === 0) {
      for (let filter of this.filterData) {
        this.filters.push(QueryFilter.create(this.requester, this.path, this.onChange, filter));
      }
    }
  }

  start(): void {
    this.initFilters();
    for (let filter of this.filters) {
      filter.start();
    }
  }
  destroy(): void {
    for (let filter of this.filters) {
      filter.destroy();
    }
  }
}

class AllFilter extends MultiFilter {
  constructor(filter: FilterStructure) {
    super();
    if (Array.isArray(filter.all)) {
      this.filterData = filter.all;
    }
  }
  check(): [boolean, boolean] {
    let matched = true;
    for (let filter of this.filters) {
      let [m, r] = filter.check();
      if (r) {
        if (!m) {
          matched = false;
        }
      } else {
        // not ready
        return [false, false];
      }
    }
    return [matched, true];
  }
}

class AnyFilter extends MultiFilter {
  constructor(filter: FilterStructure) {
    super();
    if (Array.isArray(filter.any)) {
      this.filterData = filter.any;
    }
  }
  check(): [boolean, boolean] {
    for (let filter of this.filters) {
      let [m, r] = filter.check();
      if (r) {
        if (m) {
          return [true, true];
        }
      } else {
        // not ready
        return [false, false];
      }
    }
    return [false, true];
  }
}

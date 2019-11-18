import {FilterStructure, ValueFilterStructure} from './query-structure';
import {Requester} from '../requester';
import {ValueUpdate} from '../../common/value';
import {Closable} from '../../utils/async';
import {RequesterListUpdate} from '../request/list';

type Operation = 'and' | 'or' | '=' | '!=' | '>' | '<' | '>=' | '<=';
const operationMap: {[key: string]: (filter: FilterStructure) => QueryFilter} = {
  '=': (filter: ValueFilterStructure) => new EqualsFilter(filter)
};

export abstract class QueryFilter {
  static create(path: string, onChange: () => void, filter: FilterStructure): QueryFilter {
    let result: QueryFilter;
    for (let op in operationMap) {
      if (op in filter) {
        result = operationMap[op](filter);
        break;
      }
    }
    if (result) {
      result.path = path;
      result.onChange = onChange;
      result.start();
    }
    return result;
  }
  requester: Requester;
  path: string;
  onChange: () => void;

  abstract start(): void;
  abstract match(): boolean;

  abstract ready(): boolean;

  abstract destroy(): void;
}

abstract class ValueFilter extends QueryFilter {
  path: string;
  field: string;
  value: any;
  target: any;
  live: true;
  _ready = false;

  protected constructor(filter: ValueFilterStructure) {
    super();
    this.field = filter.field;
  }
  start() {
    if (!this.field) {
      this._ready = true;
      return;
    }
    if (this.field === '$value') {
      this.listener = this.requester.subscribe(this.path, this.subscribeCallback);
    } else {
      this.listener = this.requester.list(this.path, this.listCallback);
    }
  }
  ready() {
    return this._ready;
  }
  match() {
    if (!this._ready) {
      return false;
    }
    return this.compare();
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

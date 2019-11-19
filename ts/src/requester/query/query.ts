import {NodeQueryStructure} from './query-structure';
import {QueryFilter} from './filter';
import {Closable, Stream} from '../../utils/async';
import {ValueUpdate} from '../../common/value';
import {RequesterListUpdate} from '../request/list';
import {Requester} from '../requester';
import {RemoteNode} from '../node_cache';
import {NodeResult} from './result';

function copyMapWithFilter(m: Map<string, any>, filter: string[]) {
  if (!filter) {
    return new Map();
  }
  if (filter[0] === '*') {
    return new Map(m[Symbol.iterator]());
  }
  const result = new Map<string, any>();
  for (let [key, value] of m) {
    if (filter.includes(key)) {
      result.set(key, value);
    }
  }
  return result;
}

interface AbstractQuery {
  requester: Requester;
  scheduleOutput: () => void;
}

class Query extends Stream<NodeResult> {
  parent: AbstractQuery;
  requester: Requester;
  path: string;
  filter: QueryFilter;

  valueMode?: 'live' | 'snapshot';
  childrenMode?: 'live' | 'snapshot';
  // fixed children will stay in memory even when parent node is filtered out
  // once fixed children is started, they will keep running until parent is destroyed
  fixedChildren: Map<string, Query> = new Map();
  dynamicQuery: NodeQueryStructure;
  dynamicChildren: Map<string, Query>;
  // null means all configs are required
  configFilter: string[];
  // null means all attributes are required
  attributeFilter: string[];

  onChildReady: () => void;

  constructor(parent: AbstractQuery, path: string, query: NodeQueryStructure, onChildReady?: () => void) {
    super(null, null, null, true);
    this.parent = parent;
    this.requester = parent.requester;
    this.path = path;
    this.onChildReady = onChildReady;
    this.valueMode = query.$value;
    this.childrenMode = query.$children;
    if (Array.isArray(query.$configs)) {
      this.configFilter = query.$configs;
    } else if (query.$configs === '*') {
      this.configFilter = ['*'];
    }
    if (Array.isArray(query.$attributes)) {
      this.attributeFilter = query.$attributes;
    } else if (query.$attributes === '*') {
      this.attributeFilter = ['*'];
    }
    for (let key in query) {
      if (!(key.startsWith('$') || key.startsWith('@')) && query[key] instanceof Object) {
        if (key === '*') {
          this.dynamicQuery = query[key];
          this.dynamicChildren = new Map();
        } else {
          this.fixedChildren.set(key, new Query(this, `${this.path}/${key}`, query[key], this.onChildReady));
        }
      }
    }
    if (!this.childrenMode && (this.configFilter || this.attributeFilter || this.dynamicQuery)) {
      this.childrenMode = 'snapshot';
    }
    if (query.$filter) {
      this.filter = QueryFilter.create(this.requester, path, this.onFilterUpdate, query.$filter);
    }
  }

  isNodeReady() {
    if (!this._filterReady) {
      return false;
    }
    if (!this._filterMatched) {
      // not matched, so no need for children subscription,
      return true;
    }
    if (!this._subscribeReady || !this._listReady) {
      return false;
    }

    for (let [key, query] of this.fixedChildren) {
      if (!query._filterReady || (!query._value && query._filterMatched)) {
        return false;
      }
    }
    if (this.dynamicChildren) {
      for (let [key, query] of this.dynamicChildren) {
        if (!query._filterReady || (!query._value && query._filterMatched)) {
          return false;
        }
      }
    }
    return true;
  }

  _scheduleOutputTimeout: any;
  scheduleOutput() {
    if (!this._scheduleOutputTimeout) {
      this._scheduleOutputTimeout = setTimeout(this.checkGenerateOutput, 0);
    }
  }
  checkGenerateOutput() {
    if (!this._scheduleOutputTimeout) {
      return;
    }
    this._scheduleOutputTimeout = null;
    if (this.isNodeReady()) {
      let configs: Map<string, any> = copyMapWithFilter(this.listResult.configs, this.configFilter);
      let attributes: Map<string, any> = copyMapWithFilter(this.listResult.attributes, this.attributeFilter);
      let children: Map<string, NodeResult> = new Map<string, NodeResult>();
      for (let [key, query] of this.fixedChildren) {
        if (query._filterMatched && query._value) {
          children.set(key, query._value);
        }
      }
      if (this.dynamicChildren) {
        for (let [key, query] of this.dynamicChildren) {
          if (query._filterMatched && query._value) {
            children.set(key, query._value);
          }
        }
      }
      let newNode = new NodeResult(this, this.subscribeResult, configs, attributes, children);
      if (this._value) {
        if (this._value.isSame(newNode)) {
          return;
        }
        this._value.updateNode(newNode);
        this.add(this._value);
      } else {
        this.add(newNode);
        this.parent.scheduleOutput();
      }
    } else {
      if (this._value != null) {
        this.add(null);
        this.parent.scheduleOutput();
      }
    }
  }

  _started = false;
  start() {
    this._started = true;
    if (this.filter) {
      this.filter.start();
      this.checkFilter();
    } else {
      this.setFilterMatched(true);
      this.setFilterReady(true);
    }
  }
  pause() {
    this._started = false;
    if (this.subscribeListener) {
      this.subscribeListener.close();
      this.subscribeListener = null;
      this.setSubscribeReady(false);
    }
    if (this.listListener) {
      this.listListener.close();
      this.listListener = null;
      this.setListReady(false);
    }
    for (let [key, query] of this.fixedChildren) {
      query.pause();
    }
    if (this.dynamicChildren) {
      for (let [key, query] of this.dynamicChildren) {
        query.destroy();
      }
      this.dynamicChildren.clear();
    }
  }
  checkFilterTimer: any;
  onFilterUpdate = () => {
    if (this.filter && !this.checkFilterTimer) {
      this.checkFilterTimer = setTimeout(this.checkFilter, 0);
    }
  };

  _filterReady = false;
  setFilterReady(val: boolean) {
    if (val !== this._filterReady) {
      this._filterReady = val;
    }
  }

  checkFilter = () => {
    if (!this.checkFilterTimer) {
      return;
    }
    this.checkFilterTimer = null;
    if (this.filter) {
      let [matched, ready] = this.filter.check();
      this.setFilterMatched(matched);
      this.setFilterReady(ready);
    }
  };
  _filterMatched = false;
  setFilterMatched(val: boolean) {
    if (this._started) {
      if (val !== this._filterMatched) {
        this._filterMatched = val;
        if (val) {
          this.startSubscription();
        } else {
          this.pause();
        }
      }
    }
  }

  startSubscription() {
    for (let [key, query] of this.fixedChildren) {
      query.start();
    }
    if (this.valueMode) {
      if (!this.subscribeListener) {
        this.setSubscribeReady(false);
        this.subscribeListener = this.requester.subscribe(this.path, this.subscribeCallback);
      }
    } else {
      this.setSubscribeReady(true);
    }
    if (this.childrenMode) {
      if (!this.listListener) {
        this.setListReady(false);
        this.listListener = this.requester.list(this.path, this.listCallback);
      }
    } else {
      this.setListReady(true);
    }
  }

  _subscribeReady = false;
  setSubscribeReady(val: boolean) {
    if (val !== this._subscribeReady) {
      this._subscribeReady = val;
      this.scheduleOutput();
    }
  }
  subscribeListener: Closable;
  subscribeResult: any;
  subscribeCallback = (update: ValueUpdate) => {
    if (this.valueMode === 'snapshot') {
      this.subscribeListener.close();
      this.subscribeListener = null;
    }
    this.subscribeResult = update.value;
    this.setSubscribeReady(true);
  };

  _listReady = false;
  setListReady(val: boolean) {
    if (val !== this._listReady) {
      this._listReady = val;
      this.scheduleOutput();
    }
  }
  listListener: Closable;
  listResult: RemoteNode;
  listCallback = (update: RequesterListUpdate) => {
    if (this.childrenMode === 'snapshot') {
      this.listListener.close();
      this.listListener = null;
    }
    this.listResult = update.node;
    this.setListReady(true);
  };

  destroy() {
    if (this.checkFilterTimer) {
      clearTimeout(this.checkFilterTimer);
    }
    if (this._scheduleOutputTimeout) {
      clearTimeout(this._scheduleOutputTimeout);
    }
    if (this.filter) {
      this.filter.destroy();
    }
    this.pause();
    for (let [key, query] of this.fixedChildren) {
      query.destroy();
    }
  }
}

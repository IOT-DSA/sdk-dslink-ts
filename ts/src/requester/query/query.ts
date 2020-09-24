import {NodeQueryStructure} from './query-structure';
import {QueryFilter} from './filter';
import {Closable, Stream} from '../../utils/async';
import {ValueUpdate} from '../../common/value';
import {RequesterListUpdate} from '../request/list';
import {Requester} from '../requester';
import {RemoteNode} from '../node_cache';
import {NodeQueryResult} from './result';
import {Path} from '../../common/node';

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
  timeoutMs?: number;
}

export class Query extends Stream<NodeQueryResult> {
  requester: Requester;
  filter: QueryFilter;

  // used on named child query. parent should know if children node exist or not
  exists = true;

  valueMode?: 'live' | 'snapshot';
  childrenMode?: 'live' | 'snapshot';
  // fixed children will stay in memory even when parent node is filtered out
  // once fixed children is started, they will keep running until parent is destroyed
  fixedChildren: Map<string, Query> = new Map();
  dynamicQuery: NodeQueryStructure;
  dynamicChildren: Map<string, Query>;
  // null means no config required
  configFilter: string[];
  // null means no attribute required
  attributeFilter: string[];
  // null means no action required
  actionFilter: string[];

  constructor(
    public parent: AbstractQuery,
    public path: string,
    public query: NodeQueryStructure,
    public summary?: RemoteNode,
    public timeoutMs?: number
  ) {
    super(null, null, null, true);
    this.requester = parent.requester;
    if (this.timeoutMs == null) {
      this.timeoutMs = parent.timeoutMs;
    }
    this.valueMode = query['?value'];
    this.childrenMode = query['?children'];
    if (Array.isArray(query['?configs'])) {
      this.configFilter = query['?configs'];
    } else if (query['?configs'] === '*') {
      this.configFilter = ['*'];
    }
    if (Array.isArray(query['?attributes'])) {
      this.attributeFilter = query['?attributes'];
    } else if (query['?attributes'] === '*') {
      this.attributeFilter = ['*'];
    }
    if (Array.isArray(query['?actions'])) {
      this.actionFilter = query['?actions'];
    } else if (query['?actions'] === '*') {
      this.actionFilter = ['*'];
    }
    for (let key in query) {
      if (!(key.startsWith('$') || key.startsWith('@') || key.startsWith('?')) && query[key] instanceof Object) {
        if (key === '*') {
          this.dynamicQuery = query[key];
          this.dynamicChildren = new Map();
        } else {
          this.fixedChildren.set(key, new Query(this, Path.concat(this.path, key), query[key]));
        }
      }
    }
    if (!this.childrenMode && (this.configFilter || this.attributeFilter || this.dynamicQuery)) {
      this.childrenMode = 'snapshot';
    }
    if (query['?filter']) {
      this.filter = QueryFilter.create(
        this.requester,
        path,
        this.onFilterUpdate,
        query['?filter'],
        this.summary,
        this.timeoutMs
      );
    }
  }

  isQueryReadyAsChild() {
    return this._filterReady && (this._value || !this._filterMatched);
  }

  isNodeReady() {
    if (!this._filterReady || !this._filterMatched) {
      return false;
    }
    if (!this._subscribeReady || !this._listReady) {
      return false;
    }

    for (let [key, query] of this.fixedChildren) {
      if (!query.isQueryReadyAsChild()) {
        return false;
      }
    }
    if (this.dynamicChildren) {
      for (let [key, query] of this.dynamicChildren) {
        if (!query.isQueryReadyAsChild()) {
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

  checkGenerateOutput = () => {
    if (!this._scheduleOutputTimeout) {
      return;
    }
    this._scheduleOutputTimeout = null;
    if (this.isNodeReady()) {
      let configs: Map<string, any>;
      let attributes: Map<string, any>;
      if (this.listResult) {
        configs = copyMapWithFilter(this.listResult.configs, this.configFilter);
        attributes = copyMapWithFilter(this.listResult.attributes, this.attributeFilter);
      } else {
        configs = new Map();
        attributes = new Map();
      }

      let children: Map<string, NodeQueryResult> = new Map<string, NodeQueryResult>();
      for (let [key, query] of this.fixedChildren) {
        if (query.exists && query._filterMatched && query._value && !query.disconnected) {
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
      let newNode = new NodeQueryResult(this.path, this, this.subscribeResult, configs, attributes, children);
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
      if (!this._filterMatched && this._value != null) {
        this._listeners.clear(); // ignore all previous listeners when node is filtered out
        this.add(null);
      }
      if (this._filterReady) {
        this.parent.scheduleOutput();
      }
    }
  };

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

  pause(destroyed: boolean = false) {
    this._started = false;
    this.pauseSubscription(destroyed);
  }

  pauseSubscription(destroyed: boolean = false) {
    if (this.subscribeListener) {
      this.subscribeListener.close();
      this.subscribeListener = null;
      if (!destroyed) {
        this.setSubscribeReady(false);
      }
    }
    if (this.listListener) {
      this.listListener.close();
      this.listListener = null;
      if (!destroyed) {
        this.setListReady(false);
      }
    }
    for (let [key, query] of this.fixedChildren) {
      if (destroyed) {
        query.destroy();
      } else {
        query.pause();
      }
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
      this.scheduleOutput();
    }
  }

  checkFilter = () => {
    if (!this.checkFilterTimer) {
      return;
    }
    this.checkFilterTimer = null;
    if (this.filter) {
      let [matched, ready] = this.filter.check();
      this.setFilterMatched(matched && this._started);
      this.setFilterReady(ready);
    }
  };
  _filterMatched = false;

  setFilterMatched(val: boolean) {
    if (val !== this._filterMatched) {
      this._filterMatched = val;
      if (val) {
        this.startSubscription();
      } else {
        this.pauseSubscription();
      }
      this.scheduleOutput();
    }
  }

  startSubscription() {
    for (let [key, query] of this.fixedChildren) {
      query.start();
    }
    if (this.valueMode) {
      if (!this.subscribeListener) {
        this.setSubscribeReady(false);
        this.subscribeListener = this.requester.subscribe(this.path, this.subscribeCallback, 0, this.timeoutMs);
      }
    } else {
      this.setSubscribeReady(true);
    }
    if (this.childrenMode) {
      if (!this.listListener) {
        this.setListReady(false);
        this.listListener = this.requester.list(this.path, this.listCallback, this.timeoutMs);
      }
    } else {
      this.setListReady(true);
    }
  }

  _subscribeReady = false;

  setSubscribeReady(val: boolean) {
    if (val !== this._subscribeReady) {
      this._subscribeReady = val;
    }
    this.scheduleOutput();
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
    }
    this.scheduleOutput();
  }

  listListener: Closable;
  listResult: RemoteNode;
  disconnected: boolean;
  listCallback = (update: RequesterListUpdate) => {
    if (this.childrenMode === 'snapshot') {
      this.listListener.close();
      this.listListener = null;
    }
    this.listResult = update.node;
    this.disconnected = Boolean(this.listResult.getConfig('$disconnectedTs'));
    if (this.dynamicChildren) {
      for (let [key, child] of this.dynamicChildren) {
        if (!update.node.children.has(key)) {
          child.destroy();
          this.dynamicChildren.delete(key);
          this.scheduleOutput();
        }
      }
      for (let [key, child] of update.node.children) {
        if (!this.fixedChildren.has(key) && !this.dynamicChildren.has(key)) {
          if (child.configs.has('$invokable')) {
            if (!this.actionFilter || (!this.actionFilter.includes(key) && this.actionFilter[0] !== '*')) {
              continue;
            }
          }
          let childQuery = new Query(this, Path.concat(this.path, key), this.dynamicQuery, child as RemoteNode);
          this.dynamicChildren.set(key, childQuery);
          childQuery.start();
        }
      }
    }
    for (let [name, child] of this.fixedChildren) {
      let exists = update.node.children.has(name);
      if (exists !== child.exists) {
        child.exists = exists;
        this.scheduleOutput();
      }
    }
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
    this.pause(true);
  }
}

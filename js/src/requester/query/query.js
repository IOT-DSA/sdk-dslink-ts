"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const filter_1 = require("./filter");
const async_1 = require("../../utils/async");
const result_1 = require("./result");
function copyMapWithFilter(m, filter) {
    if (!filter) {
        return new Map();
    }
    if (filter[0] === '*') {
        return new Map(m[Symbol.iterator]());
    }
    const result = new Map();
    for (let [key, value] of m) {
        if (filter.includes(key)) {
            result.set(key, value);
        }
    }
    return result;
}
class Query extends async_1.Stream {
    constructor(parent, path, query) {
        super(null, parent.onAllCancel, null, true);
        // fixed children will stay in memory even when parent node is filtered out
        // once fixed children is started, they will keep running until parent is destroyed
        this.fixedChildren = new Map();
        this._started = false;
        this.onFilterUpdate = () => {
            if (this.filter && !this.checkFilterTimer) {
                this.checkFilterTimer = setTimeout(this.checkFilter, 0);
            }
        };
        this._filterReady = false;
        this.checkFilter = () => {
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
        this._filterMatched = false;
        this._subscribeReady = false;
        this.subscribeCallback = (update) => {
            if (this.valueMode === 'snapshot') {
                this.subscribeListener.close();
                this.subscribeListener = null;
            }
            this.subscribeResult = update.value;
            this.setSubscribeReady(true);
        };
        this._listReady = false;
        this.listCallback = (update) => {
            if (this.childrenMode === 'snapshot') {
                this.listListener.close();
                this.listListener = null;
            }
            this.listResult = update.node;
            if (this.dynamicChildren) {
                for (let [key, child] of this.dynamicChildren) {
                    if (!update.node.children.has(key)) {
                        child.destroy();
                        this.dynamicChildren.delete(key);
                        this.scheduleOutput();
                    }
                }
                for (let [key, child] of update.node.children) {
                    if (!child.configs.has('$invokable') && !this.fixedChildren.has(key) && !this.dynamicChildren.has(key)) {
                        this.dynamicChildren.set(key, new Query(this, `${this.path}/${key}`, this.dynamicQuery));
                        this.scheduleOutput();
                    }
                }
            }
            this.setListReady(true);
        };
        this.parent = parent;
        this.requester = parent.requester;
        this.path = path;
        this.valueMode = query.$value;
        this.childrenMode = query.$children;
        if (Array.isArray(query.$configs)) {
            this.configFilter = query.$configs;
        }
        else if (query.$configs === '*') {
            this.configFilter = ['*'];
        }
        if (Array.isArray(query.$attributes)) {
            this.attributeFilter = query.$attributes;
        }
        else if (query.$attributes === '*') {
            this.attributeFilter = ['*'];
        }
        for (let key in query) {
            if (!(key.startsWith('$') || key.startsWith('@')) && query[key] instanceof Object) {
                if (key === '*') {
                    this.dynamicQuery = query[key];
                    this.dynamicChildren = new Map();
                }
                else {
                    this.fixedChildren.set(key, new Query(this, `${this.path}/${key}`, query[key]));
                }
            }
        }
        if (!this.childrenMode && (this.configFilter || this.attributeFilter || this.dynamicQuery)) {
            this.childrenMode = 'snapshot';
        }
        if (query.$filter) {
            this.filter = filter_1.QueryFilter.create(this.requester, path, this.onFilterUpdate, query.$filter);
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
            let configs = copyMapWithFilter(this.listResult.configs, this.configFilter);
            let attributes = copyMapWithFilter(this.listResult.attributes, this.attributeFilter);
            let children = new Map();
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
            let newNode = new result_1.NodeQueryResult(this, this.subscribeResult, configs, attributes, children);
            if (this._value) {
                if (this._value.isSame(newNode)) {
                    return;
                }
                this._value.updateNode(newNode);
                this.add(this._value);
            }
            else {
                this.add(newNode);
                this.parent.scheduleOutput();
            }
        }
        else {
            if (this._value != null) {
                this.add(null);
                this.parent.scheduleOutput();
            }
        }
    }
    start() {
        this._started = true;
        if (this.filter) {
            this.filter.start();
            this.checkFilter();
        }
        else {
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
    setFilterReady(val) {
        if (val !== this._filterReady) {
            this._filterReady = val;
        }
    }
    setFilterMatched(val) {
        if (this._started) {
            if (val !== this._filterMatched) {
                this._filterMatched = val;
                if (val) {
                    this.startSubscription();
                }
                else {
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
        }
        else {
            this.setSubscribeReady(true);
        }
        if (this.childrenMode) {
            if (!this.listListener) {
                this.setListReady(false);
                this.listListener = this.requester.list(this.path, this.listCallback);
            }
        }
        else {
            this.setListReady(true);
        }
    }
    setSubscribeReady(val) {
        if (val !== this._subscribeReady) {
            this._subscribeReady = val;
            this.scheduleOutput();
        }
    }
    setListReady(val) {
        if (val !== this._listReady) {
            this._listReady = val;
            this.scheduleOutput();
        }
    }
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
exports.Query = Query;
//# sourceMappingURL=query.js.map
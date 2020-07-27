"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryFilter = void 0;
const operationMap = {
    '=': (filter) => new EqualsFilter(filter),
    'all': (filter) => new AllFilter(filter),
    'any': (filter) => new AnyFilter(filter),
    '!=': (filter) => new NotEqualsFilter(filter),
    '>': (filter) => new GreaterFilter(filter),
    '<': (filter) => new LessFilter(filter),
    '>=': (filter) => new GreaterEqualFilter(filter),
    '<=': (filter) => new LessEqualFilter(filter),
};
const summaryConfigs = ['$is', '$type', '$invokable', '$writable', '$params', '$columns', '$result'];
class QueryFilter {
    static create(requester, path, onChange, filter, summary, timeoutMs) {
        let result;
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
            result.summary = summary;
            result.timeoutMs = timeoutMs;
        }
        return result;
    }
}
exports.QueryFilter = QueryFilter;
class ValueFilter extends QueryFilter {
    constructor(filter) {
        super();
        this._ready = false;
        this._invalid = false;
        this.subscribeCallback = (update) => {
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
        this.listCallback = (update) => {
            this.value = update.node.get(this.field);
            this._ready = true;
            this.onChange();
            if (!this.live && this.listener) {
                this.listener.close();
                this.listener = null;
            }
        };
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
                this.listener = this.requester.subscribe(this.path, this.subscribeCallback, 0, this.timeoutMs);
            }
            else if (this.field.startsWith('@') || this.field.startsWith('$')) {
                if (this.summary && summaryConfigs.includes(this.field)) {
                    this.value = this.summary.getConfig(this.field);
                    this._ready = true;
                    this.onChange();
                }
                else {
                    this.listener = this.requester.list(this.path, this.listCallback, this.timeoutMs);
                }
            }
            else if (!this.field.startsWith('?')) {
                this.listener = this.requester.subscribe(`${this.path}/${this.field}`, this.subscribeCallback, 0, this.timeoutMs);
            }
        }
    }
    check() {
        if (!this._ready) {
            return [false, false];
        }
        if (this._invalid) {
            return [false, true];
        }
        return [this.compare(), true];
    }
    destroy() {
        if (this.listener) {
            this.listener.close();
            this.listener = null;
        }
    }
}
class EqualsFilter extends ValueFilter {
    constructor(filter) {
        super(filter);
        this.target = filter['='];
    }
    compare() {
        if (this.target == null) {
            // null and undefined should be treated as equal
            return this.value == null;
        }
        else {
            return this.value === this.target;
        }
    }
}
class NotEqualsFilter extends ValueFilter {
    constructor(filter) {
        super(filter);
        this.target = filter['!='];
    }
    compare() {
        if (this.target == null) {
            // null and undefined should be treated as equal
            return this.value != null;
        }
        else {
            return this.value !== this.target;
        }
    }
}
class GreaterFilter extends ValueFilter {
    constructor(filter) {
        super(filter);
        this.target = filter['>'];
    }
    compare() {
        return this.value > this.target;
    }
}
class LessFilter extends ValueFilter {
    constructor(filter) {
        super(filter);
        this.target = filter['<'];
    }
    compare() {
        return this.value < this.target;
    }
}
class GreaterEqualFilter extends ValueFilter {
    constructor(filter) {
        super(filter);
        this.target = filter['>='];
    }
    compare() {
        return this.value >= this.target;
    }
}
class LessEqualFilter extends ValueFilter {
    constructor(filter) {
        super(filter);
        this.target = filter['<='];
    }
    compare() {
        return this.value <= this.target;
    }
}
class MultiFilter extends QueryFilter {
    constructor() {
        super(...arguments);
        this.filterData = [];
        this.filters = [];
    }
    initFilters() {
        if (this.filters.length === 0) {
            for (let filter of this.filterData) {
                this.filters.push(QueryFilter.create(this.requester, this.path, this.onChange, filter, null, this.timeoutMs));
            }
        }
    }
    start() {
        this.initFilters();
        for (let filter of this.filters) {
            filter.start();
        }
    }
    destroy() {
        for (let filter of this.filters) {
            filter.destroy();
        }
    }
}
class AllFilter extends MultiFilter {
    constructor(filter) {
        super();
        if (Array.isArray(filter.all)) {
            this.filterData = filter.all;
        }
    }
    check() {
        let matched = true;
        for (let filter of this.filters) {
            let [m, r] = filter.check();
            if (r) {
                if (!m) {
                    matched = false;
                }
            }
            else {
                // not ready
                return [false, false];
            }
        }
        return [matched, true];
    }
}
class AnyFilter extends MultiFilter {
    constructor(filter) {
        super();
        if (Array.isArray(filter.any)) {
            this.filterData = filter.any;
        }
    }
    check() {
        for (let filter of this.filters) {
            let [m, r] = filter.check();
            if (r) {
                if (m) {
                    return [true, true];
                }
            }
            else {
                // not ready
                return [false, false];
            }
        }
        return [false, true];
    }
}
//# sourceMappingURL=filter.js.map
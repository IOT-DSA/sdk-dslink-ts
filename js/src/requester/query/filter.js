"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const operationMap = {
    '=': (filter) => new EqualsFilter(filter),
    '!=': (filter) => new NotEqualsFilter(filter),
    '>': (filter) => new GreaterFilter(filter),
    '<': (filter) => new LessFilter(filter),
    '>=': (filter) => new GreaterEqualFilter(filter),
    '<=': (filter) => new LessEqualFilter(filter)
};
class QueryFilter {
    static create(requester, path, onChange, filter) {
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
            if (!update.status) {
                this._ready = true;
            }
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
                this.listener = this.requester.subscribe(this.path, this.subscribeCallback);
            }
            else {
                this.listener = this.requester.list(this.path, this.listCallback);
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
        return this.value === this.target;
    }
}
class NotEqualsFilter extends ValueFilter {
    constructor(filter) {
        super(filter);
        this.target = filter['!='];
    }
    compare() {
        return this.value !== this.target;
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
//# sourceMappingURL=filter.js.map
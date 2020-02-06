"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// avg,min,max,sum,first,last,and,or,count,auto]
class AvgRollup {
    constructor() {
        this.total = 0;
        this.count = 0;
    }
    getValue() {
        return this.total / this.count;
    }
    reset() {
        this.total = 0;
        this.count = 0;
    }
    update(value) {
        if (typeof value === 'number') {
            this.total += value;
            ++this.count;
        }
    }
}
class SumRollup extends AvgRollup {
    getValue() {
        return this.total;
    }
}
class MinRollup {
    constructor() {
        this.value = Infinity;
    }
    getValue() {
        if (this.value === Infinity) {
            return null;
        }
        return this.value;
    }
    reset() {
        this.value = Infinity;
    }
    update(value) {
        if (typeof value === 'number' && value < this.value) {
            this.value = value;
        }
    }
}
class MaxRollup {
    constructor() {
        this.value = -Infinity;
    }
    getValue() {
        if (this.value === -Infinity) {
            return null;
        }
        return this.value;
    }
    reset() {
        this.value = -Infinity;
    }
    update(value) {
        if (typeof value === 'number' && value > this.value) {
            this.value = value;
        }
    }
}
class FirstRollup {
    constructor() {
        this.first = false;
        this.value = null;
    }
    getValue() {
        return this.value;
    }
    reset() {
        this.first = false;
        this.value = null;
    }
    update(value) {
        if (!this.first) {
            this.first = true;
            this.value = value;
        }
    }
}
class LastRollup {
    constructor() {
        this.value = null;
    }
    getValue() {
        return this.value;
    }
    reset() {
        this.value = null;
    }
    update(value) {
        this.value = value;
    }
}
class AndRollup {
    constructor() {
        this.value = null;
    }
    getValue() {
        return this.value;
    }
    reset() {
        this.value = null;
    }
    update(value) {
        if (value === undefined) {
            this.value = value;
        }
        else if (this.value && !value) {
            this.value = false;
        }
    }
}
class OrRollup {
    constructor() {
        this.value = null;
    }
    getValue() {
        return this.value;
    }
    reset() {
        this.value = null;
    }
    update(value) {
        if (value === undefined) {
            this.value = value;
        }
        else if (!this.value && value) {
            this.value = true;
        }
    }
}
class CountRollup {
    constructor() {
        this.count = 0;
    }
    getValue() {
        return this.count;
    }
    reset() {
        this.count = 0;
    }
    update(value) {
        if (value != null) {
            ++this.count;
        }
    }
}
function getRollup(rollup) {
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
exports.getRollup = getRollup;
//# sourceMappingURL=rollup.js.map
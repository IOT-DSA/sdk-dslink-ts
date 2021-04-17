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
        value = Number(value);
        if (value === value) {
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
        value = Number(value);
        if (value === value && value < this.value) {
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
        value = Number(value);
        if (value === value && value > this.value) {
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
    checkBool(val) {
        val = String(val).toLowerCase();
        switch (val) {
            case 'true':
                return true;
            case 'false':
                return false;
            case '1':
            case 'yes':
            case 'on':
            case 'active':
            case 'enabled':
            case 'occupied':
                return true;
            case '0':
            case 'no':
            case 'off':
            case 'inactive':
            case 'disabled':
            case 'unoccupied':
                return false;
            default:
                return null;
        }
    }
    getValue() {
        return this.value;
    }
    reset() {
        this.value = undefined;
        this.bool = undefined;
    }
    update(value) {
        let bool = this.checkBool(value);
        if (bool == null) {
            return;
        }
        if (this.bool === undefined) {
            this.value = value;
            this.bool = bool;
        }
        else if (this.bool && !bool) {
            this.value = value;
            this.bool = false;
        }
    }
}
class OrRollup extends AndRollup {
    update(value) {
        let bool = this.checkBool(value);
        if (bool == null) {
            return;
        }
        if (this.bool === undefined) {
            this.value = value;
            this.bool = bool;
        }
        else if (!this.bool && bool) {
            this.value = value;
            this.bool = true;
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
export function getRollup(rollup) {
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
//# sourceMappingURL=rollup.js.map
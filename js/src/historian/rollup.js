"use strict";
// part of dslink.historian;
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
class FirstRollup extends Rollup {
    constructor() {
        super(...arguments);
        this.set = false;
    }
    add(input) {
        if (set) {
            return;
        }
        value = input;
        set = true;
    }
    reset() {
        set = false;
    }
}
__decorate([
    override
], FirstRollup.prototype, "add", null);
__decorate([
    override
], FirstRollup.prototype, "reset", null);
exports.FirstRollup = FirstRollup;
class LastRollup extends Rollup {
    add(input) {
        value = input;
    }
    reset() {
    }
}
__decorate([
    override
], LastRollup.prototype, "add", null);
__decorate([
    override
], LastRollup.prototype, "reset", null);
exports.LastRollup = LastRollup;
class AvgRollup extends Rollup {
    constructor() {
        super(...arguments);
        this.total = 0.0;
    }
    add(input) {
        if (typeof input === 'string') {
            input = num.parse(input, (e) => input.length);
        }
        if (typeof input !== 'number') {
            return;
        }
        total += input;
        count++;
    }
    reset() {
        total = 0.0;
        count = 0;
    }
    get value() { }
}
__decorate([
    override
], AvgRollup.prototype, "add", null);
__decorate([
    override
], AvgRollup.prototype, "reset", null);
exports.AvgRollup = AvgRollup;
/ count;;
count: number = 0;
class SumRollup extends Rollup {
    constructor() {
        super(...arguments);
        this.value = 0.0;
    }
    add(input) {
        if (typeof input === 'string') {
            input = num.parse(input, (e) => input.length);
        }
        if (typeof input !== 'number') {
            return;
        }
        value += input;
    }
    reset() {
        value = 0.0;
    }
}
__decorate([
    override
], SumRollup.prototype, "add", null);
__decorate([
    override
], SumRollup.prototype, "reset", null);
exports.SumRollup = SumRollup;
class CountRollup extends Rollup {
    constructor() {
        super(...arguments);
        this.value = 0;
    }
    add(input) {
        value++;
    }
    reset() {
        value = 0;
    }
}
__decorate([
    override
], CountRollup.prototype, "add", null);
__decorate([
    override
], CountRollup.prototype, "reset", null);
exports.CountRollup = CountRollup;
class MaxRollup extends Rollup {
    add(input) {
        if (typeof input === 'string') {
            input = num.parse(input, (e) => null);
        }
        if (typeof input !== 'number') {
            return;
        }
        value = max(value == null ? double.NEGATIVE_INFINITY : value, input);
    }
    reset() {
        value = null;
    }
}
__decorate([
    override
], MaxRollup.prototype, "add", null);
__decorate([
    override
], MaxRollup.prototype, "reset", null);
exports.MaxRollup = MaxRollup;
class MinRollup extends Rollup {
    add(input) {
        if (typeof input === 'string') {
            input = num.parse(input, (e) => null);
        }
        if (typeof input !== 'number') {
            return;
        }
        value = min(value == null ? double.INFINITY : value, input);
    }
    reset() {
        value = null;
    }
}
__decorate([
    override
], MinRollup.prototype, "add", null);
__decorate([
    override
], MinRollup.prototype, "reset", null);
exports.MinRollup = MinRollup;
typedef;
Rollup;
RollupFactory();
final;
_rollups: {
    [key, string];
    RollupFactory;
}
{
    "none";
    () => null,
        "delta";
    () => new FirstRollup(),
        "first";
    () => new FirstRollup(),
        "last";
    () => new LastRollup(),
        "max";
    () => new MaxRollup(),
        "min";
    () => new MinRollup(),
        "count";
    () => new CountRollup(),
        "sum";
    () => new SumRollup(),
        "avg";
    () => new AvgRollup();
}
;
//# sourceMappingURL=rollup.js.map
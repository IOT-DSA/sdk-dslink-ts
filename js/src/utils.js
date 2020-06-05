"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSA_VERSION = exports.buildEnumType = void 0;
function buildEnumType(values) {
    return `enum[${values.join(',')}]`;
}
exports.buildEnumType = buildEnumType;
exports.DSA_VERSION = '1.1.2';
//# sourceMappingURL=utils.js.map
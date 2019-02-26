"use strict";
// part of dslink.common;
Object.defineProperty(exports, "__esModule", { value: true });
class Permission {
    static parse(obj, defaultVal = Permission.NEVER) {
        if (typeof obj === 'string' && Permission.nameParser.hasOwnProperty(obj)) {
            return Permission.nameParser[obj];
        }
        return defaultVal;
    }
}
/// now allowed to do anything
Permission.NONE = 0;
/// list node
Permission.LIST = 1;
/// read node
Permission.READ = 2;
/// write attribute and value
Permission.WRITE = 3;
/// config the node
Permission.CONFIG = 4;
/// something that can never happen
Permission.NEVER = 5;
Permission.names = [
    'none',
    'list',
    'read',
    'write',
    'config',
    'never'
];
Permission.nameParser = {
    'none': Permission.NONE,
    'list': Permission.LIST,
    'read': Permission.READ,
    'write': Permission.WRITE,
    'config': Permission.CONFIG,
    'never': Permission.NEVER
};
exports.Permission = Permission;
//# sourceMappingURL=permission.js.map
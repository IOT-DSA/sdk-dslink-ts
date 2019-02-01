// part of dslink.common;
export class Permission {
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
export class PermissionList {
    constructor() {
        this.idMatchs = {};
        this.groupMatchs = {};
        this.defaultPermission = Permission.NONE;
        this._FORCE_CONFIG = true;
    }
    updatePermissions(data) {
        idMatchs.clear();
        groupMatchs.clear();
        defaultPermission = Permission.NONE;
        for (object; obj; of)
            data;
        {
            if ((obj != null && obj instanceof Object)) {
                if (typeof obj['id'] === 'string') {
                    idMatchs[obj['id']] = Permission.nameParser[obj['permission']];
                }
                else if (typeof obj['group'] === 'string') {
                    if (obj['group'] == 'default') {
                        defaultPermission = Permission.nameParser[obj['permission']];
                    }
                    else {
                        groupMatchs[obj['group']] =
                            Permission.nameParser[obj['permission']];
                    }
                }
            }
        }
    }
    getPermission(responder) {
        // TODO Permission temp workaround before user permission is implemented
        if (this._FORCE_CONFIG) {
            return Permission.CONFIG;
        }
        if (idMatchs.hasOwnProperty(responder.reqId)) {
            return idMatchs[responder.reqId];
        }
        rslt: number = Permission.NEVER;
        for (string; group; of)
            responder.groups;
        {
            if (groupMatchs.hasOwnProperty(group)) {
                let v = groupMatchs[group];
                if (v < rslt) {
                    // choose the lowest permission from all matched group
                    rslt = v;
                }
            }
        }
        if (rslt == Permission.NEVER) {
            return defaultPermission;
        }
        return rslt;
    }
}
//# sourceMappingURL=permission.js.map
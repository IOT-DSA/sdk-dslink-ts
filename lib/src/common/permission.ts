// part of dslink.common;

export class Permission  {
  /// now allowed to do anything
  static const int NONE = 0;

  /// list node
  static const int LIST = 1;

  /// read node
  static const int READ = 2;

  /// write attribute and value
  static const int WRITE = 3;

  /// config the node
  static const int CONFIG = 4;

  /// something that can never happen
  static const int NEVER = 5;

  static const names: string[] = const [
    'none',
    'list',
    'read',
    'write',
    'config',
    'never'
  ];

  static const nameParser: {[key: string]: int} = const {
    'none': NONE,
    'list': LIST,
    'read': READ,
    'write': WRITE,
    'config': CONFIG,
    'never': NEVER
  };

  static parse(obj: object, defaultVal: int = NEVER):number {
    if ( typeof obj === 'string' && nameParser.containsKey(obj)) {
      return nameParser[obj];
    }
    return defaultVal;
  }
}

export class PermissionList  {
  idMatchs: {[key: string]: int} = {};
  groupMatchs: {[key: string]: int} = {};
  defaultPermission: int = Permission.NONE;

  updatePermissions(data: List) {
    idMatchs.clear();
    groupMatchs.clear();
    defaultPermission = Permission.NONE;
    for (object obj in data) {
      if ( (obj != null && obj instanceof Object) ) {
        if (obj['id'] is string) {
          idMatchs[obj['id']] = Permission.nameParser[obj['permission']];
        } else if (obj['group'] is string) {
          if (obj['group'] == 'default') {
            defaultPermission = Permission.nameParser[obj['permission']];
          } else {
            groupMatchs[obj['group']] =
                Permission.nameParser[obj['permission']];
          }
        }
      }
    }
  }

  _FORCE_CONFIG: boolean = true;

  getPermission(responder: Responder):number {
    // TODO Permission temp workaround before user permission is implemented
    if ( this._FORCE_CONFIG) {
      return Permission.CONFIG;
    }
    if (idMatchs.containsKey(responder.reqId)) {
      return idMatchs[responder.reqId];
    }

    rslt: int = Permission.NEVER;
    for (string group in responder.groups) {
      if (groupMatchs.containsKey(group)) {
        int v = groupMatchs[group];
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

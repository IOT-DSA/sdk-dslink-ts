// part of dslink.common;

export class Permission  {
  /// now allowed to do anything
  static readonly  NONE = 0;

  /// list node
  static readonly  LIST = 1;

  /// read node
  static readonly  READ = 2;

  /// write attribute and value
  static readonly  WRITE = 3;

  /// config the node
  static readonly  CONFIG = 4;

  /// something that can never happen
  static readonly  NEVER = 5;

  static readonly names: string[] =  [
    'none',
    'list',
    'read',
    'write',
    'config',
    'never'
  ];

  static readonly nameParser: {[key: string]:number} =  {
    'none': Permission.NONE,
    'list': Permission.LIST,
    'read': Permission.READ,
    'write': Permission.WRITE,
    'config': Permission.CONFIG,
    'never': Permission.NEVER
  };

  static parse(obj: any, defaultVal:number = Permission.NEVER):number {
    if ( typeof obj === 'string' && Permission.nameParser.hasOwnProperty(obj)) {
      return Permission.nameParser[obj];
    }
    return defaultVal;
  }
}

export class PermissionList  {
  idMatchs: {[key: string]:number} = {};
  groupMatchs: {[key: string]:number} = {};
  defaultPermission:number = Permission.NONE;

  updatePermissions(data: List) {
    idMatchs.clear();
    groupMatchs.clear();
    defaultPermission = Permission.NONE;
    for (object obj of data) {
      if ( (obj != null && obj instanceof Object) ) {
        if (typeof obj['id'] === 'string') {
          idMatchs[obj['id']] = Permission.nameParser[obj['permission']];
        } else if (typeof obj['group'] === 'string') {
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

    rslt:number = Permission.NEVER;
    for (string group of responder.groups) {
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

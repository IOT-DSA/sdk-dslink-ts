// part of dslink.common;

export class Permission {
  /// now allowed to do anything
  static readonly NONE = 0;

  /// list node
  static readonly LIST = 1;

  /// read node
  static readonly READ = 2;

  /// write attribute and value
  static readonly WRITE = 3;

  /// config the node
  static readonly CONFIG = 4;

  /// something that can never happen
  static readonly NEVER = 5;

  static readonly names: string[] = ['none', 'list', 'read', 'write', 'config', 'never'];

  static readonly nameParser: {[key: string]: number} = {
    none: Permission.NONE,
    list: Permission.LIST,
    read: Permission.READ,
    write: Permission.WRITE,
    config: Permission.CONFIG,
    never: Permission.NEVER
  };

  static parse(obj: any, defaultVal: number = Permission.NEVER): number {
    if (typeof obj === 'string' && Permission.nameParser.hasOwnProperty(obj)) {
      return Permission.nameParser[obj];
    }
    return defaultVal;
  }
}

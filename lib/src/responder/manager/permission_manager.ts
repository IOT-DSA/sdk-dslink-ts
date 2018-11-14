// part of dslink.responder;

export interface IPermissionManager {
  int getPermission(path: string, resp: Responder);
}

export class DummyPermissionManager  implements IPermissionManager {
  getPermission(path: string, resp: Responder):number {
    return Permission.CONFIG;
  }
}

// part of dslink.responder;

export class DummyPermissionManager  implements IPermissionManager {
  getPermission(path: string, resp: Responder):number {
    return Permission.CONFIG;
  }
}

// part of dslink.responder;

export type InvokeCallback = (params: object, responder: Responder,
    response: InvokeResponse, parentNode: LocalNode) => InvokeResponse;

/// definition nodes are serializable node that won"t change
/// the only change will be a global upgrade
export class DefinitionNode  extends LocalNodeImpl {
  readonly provider: NodeProvider;

  DefinitionNode(path: string, this.provider) : super(path) {
    this.configs[r"$is"] = "static";
  }

  _invokeCallback: InvokeCallback;

  setInvokeCallback(callback: InvokeCallback) {
    _invokeCallback = callback;
  }

  @override
  invoke(
    params: {[key: string]: dynamic},
    responder: Responder,
    response: InvokeResponse,
    parentNode: Node,
    maxPermission:number = Permission.CONFIG):InvokeResponse {
    if ( this._invokeCallback == null) {
      return response..close(DSError.NOT_IMPLEMENTED);
    }

    parentPath: string = parentNode is LocalNode ? parentNode.path : null;

    permission:number = responder.nodeProvider.permissions.getPermission(
      parentPath,
      responder
    );

    if (maxPermission < permission) {
      permission = maxPermission;
    }

    if (getInvokePermission() <= permission) {
      _invokeCallback(params, responder, response, parentNode);
      return response;
    } else {
      return response..close(DSError.PERMISSION_DENIED);
    }
  }
}

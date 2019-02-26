"use strict";
// part of dslink.responder;
Object.defineProperty(exports, "__esModule", { value: true });
/// definition nodes are serializable node that won"t change
/// the only change will be a global upgrade
class DefinitionNode extends LocalNodeImpl {
}
exports.DefinitionNode = DefinitionNode;
(path) => {
    this.configs[r];
    "$is";
    "static";
};
_invokeCallback: InvokeCallback;
setInvokeCallback(callback, InvokeCallback);
{
    _invokeCallback = callback;
}
invoke(params, { [key]: string, dynamic }, responder, Responder, response, InvokeResponse, parentNode, Node, maxPermission, number = Permission.CONFIG);
InvokeResponse;
{
    if (this._invokeCallback == null) {
        return response..close(DSError.NOT_IMPLEMENTED);
    }
    parentPath: string = parentNode;
    is;
    LocalNode ? parentNode.path : null;
    permission: number = responder.nodeProvider.permissions.getPermission(parentPath, responder);
    if (maxPermission < permission) {
        permission = maxPermission;
    }
    if (getInvokePermission() <= permission) {
        _invokeCallback(params, responder, response, parentNode);
        return response;
    }
    else {
        return response..close(DSError.PERMISSION_DENIED);
    }
}
//# sourceMappingURL=def_node.js.map
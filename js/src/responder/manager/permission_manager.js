"use strict";
// part of dslink.responder;
Object.defineProperty(exports, "__esModule", { value: true });
class DummyPermissionManager {
    getPermission(path, resp) {
        return Permission.CONFIG;
    }
}
exports.DummyPermissionManager = DummyPermissionManager;
//# sourceMappingURL=permission_manager.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encodeNodeName = void 0;
function escapeNodeName(match) {
    let code = match.charCodeAt(0);
    if (code < 16) {
        return `%0${code.toString(16)}`;
    }
    return `%${code.toString(16)}`;
}
function encodeNodeName(name) {
    return name.replace(/[\u0000-\u001f/\\?*:|"<>%]/g, escapeNodeName);
}
exports.encodeNodeName = encodeNodeName;
//# sourceMappingURL=node-name.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeNodeName = exports.encodeNodeName = void 0;
// need this table to encode string in upper case
const ENCODE_TABLE = '0123456789ABCDEF'.split('');
function escapeNodeName(match) {
    let code = match.charCodeAt(0);
    return `%${ENCODE_TABLE[(code / 16) >> 0]}${ENCODE_TABLE[code % 16]}`;
}
function encodeNodeName(name) {
    return name.replace(/[\u0000-\u001f/\\?*:|"<>%]/g, escapeNodeName);
}
exports.encodeNodeName = encodeNodeName;
function decodeNodeName(name) {
    return decodeURIComponent(name);
}
exports.decodeNodeName = decodeNodeName;
//# sourceMappingURL=node-name.js.map
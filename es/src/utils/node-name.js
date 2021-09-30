// need this table to encode string in upper case
const ENCODE_TABLE = '0123456789ABCDEF'.split('');
function escapeNodeName(match) {
    let code = match.charCodeAt(0);
    return `%${ENCODE_TABLE[(code / 16) >> 0]}${ENCODE_TABLE[code % 16]}`;
}
export function encodeNodeName(name) {
    return name.replace(/[\u0000-\u001f/\\?*:|"<>%]/g, escapeNodeName);
}
export function decodeNodeName(name) {
    return decodeURIComponent(name);
}
//# sourceMappingURL=node-name.js.map
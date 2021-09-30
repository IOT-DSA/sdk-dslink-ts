function escapeNodeName(match) {
    let code = match.charCodeAt(0);
    if (code < 16) {
        return `%0${code.toString(16)}`;
    }
    return `%${code.toString(16)}`;
}
export function encodeNodeName(name) {
    return name.replace(/[\u0000-\u001f/\\?*:|"<>%]/g, escapeNodeName);
}
//# sourceMappingURL=node-name.js.map
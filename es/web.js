import { BrowserUserLink } from './src/browser/browser-user-link';
export { encodeNodeName, decodeNodeName } from './src/utils/node-name';
if (Object.isExtensible(window)) {
    window.DSLink = BrowserUserLink;
}
export const DSLink = BrowserUserLink;
//# sourceMappingURL=web.js.map
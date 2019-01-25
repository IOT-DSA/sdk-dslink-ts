import { BrowserUserLink } from "./src/browser/browser_user_link";
if (Object.isExtensible(window)) {
    window.DSLink = BrowserUserLink;
}
export const DSLink = BrowserUserLink;
//# sourceMappingURL=web.js.map
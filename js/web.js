"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSLink = void 0;
const browser_user_link_1 = require("./src/browser/browser-user-link");
if (Object.isExtensible(window)) {
    window.DSLink = browser_user_link_1.BrowserUserLink;
}
exports.DSLink = browser_user_link_1.BrowserUserLink;
//# sourceMappingURL=web.js.map
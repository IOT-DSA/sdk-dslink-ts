"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DSLink = void 0;
const browser_user_link_1 = require("./src/browser/browser-user-link");
var node_name_1 = require("./src/utils/node-name");
Object.defineProperty(exports, "encodeNodeName", { enumerable: true, get: function () { return node_name_1.encodeNodeName; } });
Object.defineProperty(exports, "decodeNodeName", { enumerable: true, get: function () { return node_name_1.decodeNodeName; } });
if (Object.isExtensible(window)) {
    window.DSLink = browser_user_link_1.BrowserUserLink;
}
exports.DSLink = browser_user_link_1.BrowserUserLink;
//# sourceMappingURL=web.js.map
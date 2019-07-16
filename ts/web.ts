import {BrowserUserLink} from "./src/browser/browser-user-link";

if (Object.isExtensible(window)) {
  (window as any).DSLink = BrowserUserLink;
}

export const DSLink = BrowserUserLink;

import {BrowserUserLink} from "./src/browser/browser_user_link";

if (Object.isExtensible(window)) {
  (window as any).DSLink = BrowserUserLink;
}

export const DSLink = BrowserUserLink;

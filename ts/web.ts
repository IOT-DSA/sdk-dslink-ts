import {BrowserUserLink} from './src/browser/browser-user-link';
export {encodeNodeName} from './src/utils/node-name';

if (Object.isExtensible(window)) {
  (window as any).DSLink = BrowserUserLink;
}

export const DSLink = BrowserUserLink;


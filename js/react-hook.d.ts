import { BrowserUserLink } from './src/browser/browser-user-link';
import { NodeQueryStructure } from './src/requester/query/query-structure';
import { Listener } from './src/utils/async';
import { NodeQueryResult } from './src/requester/query/result';
export declare function useDsaQuery(link: BrowserUserLink, path: string, query: NodeQueryStructure, callback?: Listener<NodeQueryResult>): void;

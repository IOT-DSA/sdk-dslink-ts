import { BrowserUserLink } from './src/browser/browser-user-link';
import { NodeQueryStructure } from './src/requester/query/query-structure';
import { Listener } from './src/utils/async';
import { NodeQueryResult } from './src/requester/query/result';
/**
 * Query a node and its children
 * @param link
 * @param path The node path to be queried.
 * @param query
 * @param callback The callback will be called only when
 *  - node value changed if ?value is defined
 *  - value of config that matches ?configs is changed
 *  - value of attribute that matches ?attributes is changed
 *  - child is removed or new child is added when wildcard children match * is defined
 *  - a child has updated internally (same as the above condition), and the child is defined in watchChildren
 * @param watchChildren defines the children nodes that will trigger the callback on its internal change
 */
export declare function useDsaQuery(link: BrowserUserLink, path: string, query: NodeQueryStructure, callback?: Listener<NodeQueryResult>, watchChildren?: '*' | string[]): void;
/**
 * Query a child node and its children
 * @param node The node from a result of a parent query.
 * @param callback The callback will be called only when
 *  - node value changed if ?value is defined
 *  - value of config that matches ?configs is changed
 *  - value of attribute that matches ?attributes is changed
 *  - child is removed or new child is added when wildcard children match * is defined
 *  - a child has updated internally (same as the above condition), and the child is defined in watchChildren
 * @param watchChildren defines the children nodes that will trigger the callback on its internal change
 */
export declare function useDsaChildQuery(node: NodeQueryResult, callback?: Listener<NodeQueryResult>, watchChildren?: '*' | string[]): void;

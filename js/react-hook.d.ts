import { BrowserUserLink } from './src/browser/browser-user-link';
import { NodeQueryStructure } from './src/requester/query/query-structure';
import { NodeQueryResult } from './src/requester/query/result';
declare type QueryCallback = (value: NodeQueryResult, json?: any) => void;
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
 * @param delay Delay the callback to merge changes into less update, in milliseconds.
 * @param timeout Timeout on requests that might stuck because node doesn't exist or permission denied, in milliseconds.
 */
export declare function useDsaQuery(link: BrowserUserLink, path: string, query: NodeQueryStructure, callback?: QueryCallback, delay?: number, timeout?: number): NodeQueryResult;
/**
 * @deprecated
 * Query a child node and its children
 * @param node The node from a result of a parent query.
 * @param callback The callback will be called only when
 *  - node value changed if ?value is defined
 *  - value of config that matches ?configs is changed
 *  - value of attribute that matches ?attributes is changed
 *  - child is removed or new child is added when wildcard children match * is defined
 *  - a child has updated internally (same as the above condition), and the child is defined in watchChildren
 */
export declare function useDsaChildQuery(node: NodeQueryResult, callback?: QueryCallback): NodeQueryResult;
/**
 * Listen the DSA connection and returns the status.
 * (connected=undefined means no connection was  attempted.)
 * @param link link
 * @param checkNextReconnect Set true to check next reconnect. (default = true)
 */
export declare function useDsaConnectionStatus(link: BrowserUserLink, checkNextReconnect?: boolean): {
    connected?: boolean;
    nextReconnectTS: number;
};
export {};

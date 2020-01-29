import {BrowserUserLink} from './src/browser/browser-user-link';
import {NodeQueryStructure} from './src/requester/query/query-structure';
import {Closable, Listener} from './src/utils/async';
import {NodeQueryResult} from './src/requester/query/result';
import {useCallback, useEffect, useRef, useState} from 'react';

/** @ignore */
function useRawDsaQuery(
  link: BrowserUserLink,
  pathOrNode: string | NodeQueryResult,
  query: NodeQueryStructure,
  callback?: Listener<NodeQueryResult>,
  delay = 0
): NodeQueryResult {
  const callbackRef = useRef<Listener<NodeQueryResult>>();
  callbackRef.current = callback;
  const delayRef = useRef<number>();
  delayRef.current = Math.max(delay, 0); // delay must >= 0

  const callbackTimerRef = useRef<any>(false);
  const rootNodeCache = useRef<NodeQueryResult>();
  const [, forceUpdate] = useState(1);
  const watchingNodes = useRef(new WeakSet<NodeQueryResult>());

  const executeCallback = useCallback(() => {
    if (callbackRef.current) {
      callbackRef.current(rootNodeCache.current);
    } else {
      // force a state change to render
      forceUpdate((v) => -v);
    }
    callbackTimerRef.current = null;
  }, []);

  const delayedCallback = useCallback(() => {
    if (callbackTimerRef.current) {
      return;
    }
    if (callbackTimerRef.current === false && rootNodeCache.current) {
      executeCallback();
    } else {
      callbackTimerRef.current = setTimeout(executeCallback, delayRef.current);
    }
  }, []);

  const childCallback = useCallback((node: NodeQueryResult) => {
    for (let [name, child] of node.children) {
      if (!watchingNodes.current.has(child)) {
        watchingNodes.current.add(child);
        child.listen(childCallback, false);
        childCallback(child);
      }
    }
    delayedCallback();
  }, []);
  const rootCallback = useCallback((node: NodeQueryResult) => {
    rootNodeCache.current = node;
    for (let [name, child] of node.children) {
      if (!watchingNodes.current.has(child)) {
        watchingNodes.current.add(child);
        child.listen(childCallback, false);
        childCallback(child);
      }
    }
    delayedCallback();
  }, []);
  useEffect(() => {
    let subscription: Closable;
    if (typeof pathOrNode === 'string') {
      subscription = link.requester.query(pathOrNode, query, rootCallback);
    } else if (pathOrNode instanceof NodeQueryResult) {
      pathOrNode.listen(rootCallback);
    }
    return () => {
      if (subscription) {
        subscription.close();
      }
    };
  }, [link, pathOrNode]);

  return rootNodeCache.current;
}

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
 */
export function useDsaQuery(
  link: BrowserUserLink,
  path: string,
  query: NodeQueryStructure,
  callback?: Listener<NodeQueryResult>,
  delay?: number
) {
  return useRawDsaQuery(link, path, query, callback, delay);
}

/**
 * Query a child node and its children
 * @param node The node from a result of a parent query.
 * @param callback The callback will be called only when
 *  - node value changed if ?value is defined
 *  - value of config that matches ?configs is changed
 *  - value of attribute that matches ?attributes is changed
 *  - child is removed or new child is added when wildcard children match * is defined
 *  - a child has updated internally (same as the above condition), and the child is defined in watchChildren
 */
export function useDsaChildQuery(node: NodeQueryResult, callback?: Listener<NodeQueryResult>) {
  return useRawDsaQuery(null, node, null, callback);
}

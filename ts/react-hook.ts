import {useCallback, useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom';
import {BrowserUserLink} from './src/browser/browser-user-link';
import {NodeQueryStructure} from './src/requester/query/query-structure';
import {Closable, Listener, StreamSubscription} from './src/utils/async';
import {NodeQueryResult} from './src/requester/query/result';
import {addBatchUpdateCallback, isBatchUpdating} from './src/browser/batch-update';

type QueryCallback = (value: NodeQueryResult, json?: any) => void;

/** @ignore */
function useRawDsaQuery(
  link: BrowserUserLink,
  pathOrNode: string | NodeQueryResult,
  query: NodeQueryStructure,
  callback?: QueryCallback,
  delay: number = 0,
  timeout: number = 5000
): NodeQueryResult {
  const callbackRef = useRef<QueryCallback>();
  callbackRef.current = callback;
  const delayRef = useRef<number>();
  delayRef.current = Math.max(delay, 0); // delay must >= 0

  const callbackTimerRef = useRef<any>(false);
  const rootNodeCache = useRef<NodeQueryResult>();
  const [, forceUpdate] = useState(1);
  const watchingNodes = useRef(new WeakSet<NodeQueryResult>());

  const executeCallback = useCallback(() => {
    if (callbackRef.current) {
      if (callbackRef.current.length >= 2) {
        let obj = rootNodeCache.current?.toObject();
        callbackRef.current(rootNodeCache.current, obj);
      } else {
        callbackRef.current(rootNodeCache.current);
      }
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
      // when === false, it's the initial callback
      batchUpdate(executeCallback);
    } else {
      callbackTimerRef.current = setTimeout(batchUpdate, delayRef.current, executeCallback);
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
      subscription = link.requester.query(pathOrNode, query, rootCallback, timeout);
    } else if (pathOrNode instanceof NodeQueryResult) {
      pathOrNode.listen(rootCallback);
    }
    return () => {
      if (subscription) {
        subscription.close();
      }
    };
  }, [link, pathOrNode, query]);

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
 * @param delay Delay the callback to merge changes into less update, in milliseconds.
 * @param timeout Timeout on requests that might stuck because node doesn't exist or permission denied, in milliseconds.
 */
export function useDsaQuery(
  link: BrowserUserLink,
  path: string,
  query: NodeQueryStructure,
  callback?: QueryCallback,
  delay?: number,
  timeout: number = 5000
) {
  return useRawDsaQuery(link, path, query, callback, delay, timeout);
}

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
export function useDsaChildQuery(node: NodeQueryResult, callback?: QueryCallback) {
  return useRawDsaQuery(null, node, null, callback);
}

const callbacks = new Set<() => void>();
let mergedBatchUpdateTimeout: any;
function batchUpdate(callback: () => void) {
  callbacks.add(callback);
  if (!isBatchUpdating() && !mergedBatchUpdateTimeout) {
    // when query callback triggered without incoming dsa response, use a timer
    mergedBatchUpdateTimeout = setTimeout(mergedBatchUpdate, 0);
  }
}
function mergedBatchUpdate() {
  ReactDOM.unstable_batchedUpdates(() => {
    for (let callback of callbacks) {
      callback();
    }
    callbacks.clear();
  });
  mergedBatchUpdateTimeout = null;
}

addBatchUpdateCallback(mergedBatchUpdate);

/**
 * Listen the DSA connection and returns the status.
 * (connected=undefined means no connection was  attempted.)
 * @param link link
 * @param checkNextReconnect Set true to check next reconnect. (default = true)
 */
export function useDsaConnectionStatus(link: BrowserUserLink, checkNextReconnect: boolean = true) {
  // connected is initialized with undefined to indicate that no connection was attempted.
  const [result, setResult] = useState<{connected?: boolean; nextReconnectTS: number}>({
    connected: undefined,
    nextReconnectTS: null,
  });
  useEffect(() => {
    const connectListener = link.onConnect.listen(() => {
      setResult({connected: true, nextReconnectTS: null});
    });
    const disconnectListener = link.onDisconnect.listen(() => {
      setResult((result) => {
        return {...result, connected: false};
      });
    });
    let reconnectListener: StreamSubscription<number>;
    if (checkNextReconnect) {
      reconnectListener = link.onReconnect.listen((ts: number) => {
        setResult({connected: false, nextReconnectTS: ts});
      });
    }

    return () => {
      connectListener.close();
      disconnectListener.close();
      if (reconnectListener) {
        reconnectListener.close();
      }
    };
  }, [link]);
  return result;
}

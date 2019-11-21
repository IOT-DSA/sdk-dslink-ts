import {BrowserUserLink} from './src/browser/browser-user-link';
import {NodeQueryStructure} from './src/requester/query/query-structure';
import {Listener} from './src/utils/async';
import {NodeQueryResult} from './src/requester/query/result';
import {useCallback, useEffect, useRef, useState} from 'react';

export function useDsaQuery(
  link: BrowserUserLink,
  path: string,
  query: NodeQueryStructure,
  callback?: Listener<NodeQueryResult>
) {
  function parseUseChildren(input?: '*' | string[]) {
    if (Array.isArray(input)) {
      return input;
    }
    if (input === '*') {
      return ['*'];
    }
    return null;
  }
  const [useChildren] = useState<string[]>(parseUseChildren);
  const callbackRef = useRef<Listener<NodeQueryResult>>();
  const rootNodeCache = useRef<NodeQueryResult>();
  callbackRef.current = callback;
  let childCallback = useCallback((node: NodeQueryResult) => {
    if (rootNodeCache.current) {
      rootCallback(rootNodeCache.current);
    }
  }, []);
  const rootCallback = useCallback((node: NodeQueryResult) => {
    callbackRef.current(node);
    rootNodeCache.current = node;
    if (useChildren) {
      for (let [name, child] of node.children) {
        if (useChildren[0] === '*' || useChildren.includes(name)) {
          child.listen(childCallback);
        }
      }
    }
  }, []);
  useEffect(() => {
    const subscription = link.requester.query(path, query, rootCallback);
    return () => {
      subscription.close();
    };
  }, [link, path]);
}

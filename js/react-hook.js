"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const result_1 = require("./src/requester/query/result");
const react_1 = require("react");
/** @ignore */
function useRawDsaQuery(link, pathOrNode, query, callback, delay = 0) {
    const callbackRef = react_1.useRef();
    callbackRef.current = callback;
    const delayRef = react_1.useRef();
    delayRef.current = Math.max(delay, 0); // delay must >= 0
    const callbackTimerRef = react_1.useRef(false);
    const rootNodeCache = react_1.useRef();
    const [, forceUpdate] = react_1.useState(1);
    const watchingNodes = react_1.useRef(new WeakSet());
    const executeCallback = react_1.useCallback(() => {
        if (callbackRef.current) {
            callbackRef.current(rootNodeCache.current);
        }
        else {
            // force a state change to render
            forceUpdate((v) => -v);
        }
        callbackTimerRef.current = null;
    }, []);
    const delayedCallback = react_1.useCallback(() => {
        if (callbackTimerRef.current) {
            return;
        }
        if (callbackTimerRef.current === false && rootNodeCache.current) {
            executeCallback();
        }
        else {
            callbackTimerRef.current = setTimeout(executeCallback, delayRef.current);
        }
    }, []);
    const childCallback = react_1.useCallback((node) => {
        for (let [name, child] of node.children) {
            if (!watchingNodes.current.has(child)) {
                watchingNodes.current.add(child);
                child.listen(childCallback, false);
                childCallback(child);
            }
        }
        delayedCallback();
    }, []);
    const rootCallback = react_1.useCallback((node) => {
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
    react_1.useEffect(() => {
        let subscription;
        if (typeof pathOrNode === 'string') {
            subscription = link.requester.query(pathOrNode, query, rootCallback);
        }
        else if (pathOrNode instanceof result_1.NodeQueryResult) {
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
function useDsaQuery(link, path, query, callback, delay) {
    return useRawDsaQuery(link, path, query, callback, delay);
}
exports.useDsaQuery = useDsaQuery;
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
function useDsaChildQuery(node, callback) {
    return useRawDsaQuery(null, node, null, callback);
}
exports.useDsaChildQuery = useDsaChildQuery;
//# sourceMappingURL=react-hook.js.map
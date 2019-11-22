"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const result_1 = require("./src/requester/query/result");
const react_1 = require("react");
function useRawDsaQuery(link, pathOrNode, query, callback, useChildren) {
    const callbackRef = react_1.useRef();
    const rootNodeCache = react_1.useRef();
    const [, forceUpdate] = react_1.useState(1);
    callbackRef.current = callback;
    let childCallback = react_1.useCallback((node) => {
        if (rootNodeCache.current) {
            rootCallback(rootNodeCache.current);
        }
    }, []);
    const rootCallback = react_1.useCallback((node) => {
        rootNodeCache.current = node;
        if (useChildren) {
            for (let [name, child] of node.children) {
                if (useChildren[0] === '*' || useChildren.includes(name)) {
                    child.listen(childCallback);
                }
            }
        }
        if (callbackRef.current) {
            callbackRef.current(node);
        }
        // force render on node change
        forceUpdate((v) => -v);
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
 *  - an child has updated internally (same as the above condition), and the child is defined in useChildren
 * @param useChildren defines the children nodes that will trigger the callback on any change
 */
function useDsaQuery(link, path, query, callback, useChildren) {
    return useRawDsaQuery(link, path, query, callback, useChildren);
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
 *  - an child has updated internally (same as the above condition), and the child is defined in useChildren
 * @param useChildren defines the children nodes that will trigger the callback on any change
 */
function useDsaChildQuery(node, callback, useChildren) {
    return useRawDsaQuery(null, node, null, callback, useChildren);
}
exports.useDsaChildQuery = useDsaChildQuery;
//# sourceMappingURL=react-hook.js.map
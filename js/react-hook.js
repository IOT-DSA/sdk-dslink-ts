"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
function useDsaQuery(link, path, query, callback) {
    function parseUseChildren() {
        const input = query['?useChildren'];
        if (Array.isArray(input)) {
            return input;
        }
        if (input === '*') {
            return ['*'];
        }
        return null;
    }
    const [useChildren] = react_1.useState(parseUseChildren);
    const callbackRef = react_1.useRef();
    const rootNodeCache = react_1.useRef();
    callbackRef.current = callback;
    let childCallback = react_1.useCallback((node) => {
        if (rootNodeCache.current) {
            rootCallback(rootNodeCache.current);
        }
    }, []);
    const rootCallback = react_1.useCallback((node) => {
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
    react_1.useEffect(() => {
        const subscription = link.requester.query(path, query, rootCallback);
        return () => {
            subscription.close();
        };
    }, [link, path]);
}
exports.useDsaQuery = useDsaQuery;
function useDsaQueryNode(node, callback) {
    const callbackRef = react_1.useRef();
    callbackRef.current = callback;
    react_1.useEffect(() => {
        const subscription = node.listen((node) => {
            callbackRef.current(node);
        });
        return () => {
            subscription.close();
        };
    }, [node]);
}
exports.useDsaQueryNode = useDsaQueryNode;
//# sourceMappingURL=react-hook.js.map
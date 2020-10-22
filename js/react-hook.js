"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDsaConnectionStatus = exports.useDsaChildQuery = exports.useDsaQuery = void 0;
const react_1 = require("react");
const react_dom_1 = __importDefault(require("react-dom"));
const result_1 = require("./src/requester/query/result");
const batch_update_1 = require("./src/browser/batch-update");
/** @ignore */
function useRawDsaQuery(link, pathOrNode, query, callback, delay = 0, timeout = 5000) {
    const callbackRef = react_1.useRef();
    callbackRef.current = callback;
    const delayRef = react_1.useRef();
    delayRef.current = Math.max(delay, 0); // delay must >= 0
    const callbackTimerRef = react_1.useRef(false);
    const rootNodeCache = react_1.useRef();
    const [, forceUpdate] = react_1.useState(1);
    const watchingNodes = react_1.useRef(new WeakSet());
    const executeCallback = react_1.useCallback(() => {
        var _a;
        if (callbackRef.current) {
            if (callbackRef.current.length >= 2) {
                let obj = (_a = rootNodeCache.current) === null || _a === void 0 ? void 0 : _a.toObject();
                callbackRef.current(rootNodeCache.current, obj);
            }
            else {
                callbackRef.current(rootNodeCache.current);
            }
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
            // when === false, it's the initial callback
            batchUpdate(executeCallback);
        }
        else {
            callbackTimerRef.current = setTimeout(batchUpdate, delayRef.current, executeCallback);
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
            subscription = link.requester.query(pathOrNode, query, rootCallback, timeout);
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
 * @param delay Delay the callback to merge changes into less update, in milliseconds.
 * @param timeout Timeout on requests that might stuck because node doesn't exist or permission denied, in milliseconds.
 */
function useDsaQuery(link, path, query, callback, delay, timeout = 5000) {
    return useRawDsaQuery(link, path, query, callback, delay, timeout);
}
exports.useDsaQuery = useDsaQuery;
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
function useDsaChildQuery(node, callback) {
    return useRawDsaQuery(null, node, null, callback);
}
exports.useDsaChildQuery = useDsaChildQuery;
const callbacks = new Set();
let mergedBatchUpdateTimeout;
function batchUpdate(callback) {
    callbacks.add(callback);
    if (!batch_update_1.isBatchUpdating() && !mergedBatchUpdateTimeout) {
        // when query callback triggered without incoming dsa response, use a timer
        mergedBatchUpdateTimeout = setTimeout(mergedBatchUpdate, 0);
    }
}
function mergedBatchUpdate() {
    react_dom_1.default.unstable_batchedUpdates(() => {
        for (let callback of callbacks) {
            callback();
        }
        callbacks.clear();
    });
    mergedBatchUpdateTimeout = null;
}
batch_update_1.addBatchUpdateCallback(mergedBatchUpdate);
/**
 * Listen the DSA connection and returns the status.
 * (connected=undefined means no connection was  attempted.)
 * @param link link
 * @param checkNextReconnect Set true to check next reconnect. (default = true)
 */
function useDsaConnectionStatus(link, checkNextReconnect = true) {
    // connected is initialized with undefined to indicate that no connection was attempted.
    const [result, setResult] = react_1.useState({
        connected: undefined,
        nextReconnectTS: null,
    });
    react_1.useEffect(() => {
        const connectListener = link.onConnect.listen(() => {
            setResult({ connected: true, nextReconnectTS: null });
        });
        const disconnectListener = link.onDisconnect.listen(() => {
            setResult((result) => {
                return Object.assign(Object.assign({}, result), { connected: false });
            });
        });
        let reconnectListener;
        if (checkNextReconnect) {
            reconnectListener = link.onReconnect.listen((ts) => {
                setResult({ connected: false, nextReconnectTS: ts });
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
exports.useDsaConnectionStatus = useDsaConnectionStatus;
//# sourceMappingURL=react-hook.js.map
import { Node } from "../common/node";
import { ListController, RequesterListUpdate } from "./request/list";
import { ReqSubscribeController } from "./request/subscribe";
import { ValueUpdate } from "../common/value";
import { Requester } from "./requester";
import { Stream } from "../utils/async";
import { RequesterInvokeStream } from "./request/invoke";
/** @ignore */
export declare class RemoteNodeCache {
    _nodes: Map<string, RemoteNode>;
    RemoteNodeCache(): void;
    getRemoteNode(path: string): RemoteNode;
    cachedNodePaths(): () => IterableIterator<string>;
    isNodeCached(path: string): boolean;
    clearCachedNode(path: string): void;
    clear(): void;
    getDefNode(path: string, defName: string): Node;
    updateRemoteChildNode(parent: RemoteNode, name: string, m: any): RemoteNode;
}
export declare class RemoteNode extends Node {
    readonly remotePath: string;
    /** @ignore */
    listed: boolean;
    name: string;
    /** @ignore */
    _listController: ListController;
    /** @ignore */
    _subscribeController: ReqSubscribeController;
    /** @ignore */
    readonly subscribeController: ReqSubscribeController;
    readonly hasValueUpdate: boolean;
    readonly lastValueUpdate: ValueUpdate;
    constructor(remotePath: string);
    /** @ignore */
    _getRawName(): void;
    /** @ignore */
    isUpdated(): boolean;
    /** @ignore */
    isSelfUpdated(): boolean;
    /** @ignore */
    _list(requester: Requester): Stream<RequesterListUpdate>;
    /** @ignore */
    createListController(requester: Requester): ListController;
    /** @ignore */
    _subscribe(requester: Requester, callback: (update: ValueUpdate) => void, qos: number): void;
    /** @ignore */
    _unsubscribe(requester: Requester, callback: (update: ValueUpdate) => void): void;
    /** @ignore */
    _invoke(params: object, requester: Requester, maxPermission?: number): RequesterInvokeStream;
    /** @ignore */
    updateRemoteChildData(m: any, cache: RemoteNodeCache): void;
    /** @ignore */
    resetNodeCache(): void;
    /** @ignore */
    save(includeValue?: boolean): {
        [key: string]: any;
    };
}
/** @ignore */
export declare class RemoteDefNode extends RemoteNode {
    constructor(path: string);
}
/** @ignore */
export declare class DefaultDefNodes {
    static readonly _defaultDefs: {
        [key: string]: any;
    };
    static readonly nameMap: {
        [key: string]: Node;
    };
    static readonly pathMap: {
        [key: string]: Node;
    };
}

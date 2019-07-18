import { Requester } from "../requester";
import { Request } from "../request";
import { Stream, StreamSubscription } from "../../utils/async";
import { ConnectionProcessor, DsError, StreamStatus } from "../../common/interfaces";
import { RemoteNode } from "../node_cache";
import { RequesterUpdate, RequestUpdater } from "../interface";
export declare class RequesterListUpdate extends RequesterUpdate {
    /**
     * This is only a list of changed fields.
     * When changes is null, it means everything could have changed.
     */
    changes: string[];
    node: RemoteNode;
    /** @ignore */
    constructor(node: RemoteNode, changes: string[], streamStatus: StreamStatus);
}
/** @ignore */
export declare class ListDefListener {
    readonly node: RemoteNode;
    readonly requester: Requester;
    listener: StreamSubscription<any>;
    ready: boolean;
    constructor(node: RemoteNode, requester: Requester, callback: (update: RequesterListUpdate) => void);
    close(): void;
}
/** @ignore */
export declare class ListController implements RequestUpdater, ConnectionProcessor {
    readonly node: RemoteNode;
    readonly requester: Requester;
    stream: Stream<RequesterListUpdate>;
    request: Request;
    constructor(node: RemoteNode, requester: Requester);
    readonly initialized: boolean;
    disconnectTs: string;
    onDisconnect(): void;
    onReconnect(): void;
    changes: Set<string>;
    onUpdate(streamStatus: StreamStatus, updates: any[], columns: any[], meta: object, error: DsError): void;
    _profileLoader: ListDefListener;
    loadProfile(defName: string): void;
    static readonly _ignoreProfileProps: string[];
    _onProfileUpdate: (update: RequesterListUpdate) => void;
    _ready: boolean;
    onProfileUpdated(): void;
    _pendingRemoveDef: boolean;
    _checkRemoveDef(): void;
    onStartListen: () => void;
    waitToSend: boolean;
    startSendingData(currentTime: number, waitingAckId: number): void;
    ackReceived(receiveAckId: number, startTime: number, currentTime: number): void;
    _onListen: (callback: (update: RequesterListUpdate) => void) => void;
    _onAllCancel: () => void;
    _destroy(): void;
}

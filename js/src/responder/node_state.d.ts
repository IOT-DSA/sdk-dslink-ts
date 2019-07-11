import { Listener, Stream } from "../utils/async";
import { Node } from "../common/node";
import { InvokeResponse } from "./response/invoke";
import { Responder } from "./responder";
import { Response } from "./response";
import { ValueUpdate, ValueUpdateCallback } from "../common/value";
export declare class LocalNode extends Node<LocalNode> {
    provider: NodeProvider;
    readonly path: string;
    _state: NodeState;
    constructor(path: string, provider: NodeProvider, profileName?: string);
    initialize(): void;
    addChild(name: string, node: LocalNode): void;
    removeChild(nameOrNode: string | LocalNode): void;
    _connectState(): void;
    getInvokePermission(): number;
    getSetPermission(): number;
    invoke(params: {
        [key: string]: any;
    }, responder: Responder, response: InvokeResponse, parentNode: LocalNode, maxPermission?: number): void;
    setConfig(name: string, value: any): void;
    setAttribute(name: string, value: any, responder?: Responder, response?: Response): void;
    removeAttribute(name: string, responder?: Responder, response?: Response): void;
    _value: any;
    _valueReady: boolean;
    setValue(value: any, responder?: Responder, response?: Response, maxPermission?: number): void;
    save(): {
        [key: string]: any;
    };
    destroy(): void;
}
interface ProviderOptions {
    saveFunction?: (data: any) => void;
    saveIntervalMs?: number;
}
export declare class NodeProvider {
    _states: Map<string, NodeState>;
    getNode(path: string): LocalNode;
    createState(path: string): NodeState;
    _root: LocalNode;
    _saveFunction: (data: any) => void;
    constructor(options?: ProviderOptions);
    setRoot(node: LocalNode): void;
    _saveTimer: any;
    _saveIntervalMs: number;
    save(): void;
    onSaveTimer: () => void;
}
interface Subscriber {
    addValue: ValueUpdateCallback;
}
export declare class NodeState {
    _node: LocalNode;
    _subscriber: Subscriber;
    readonly provider: NodeProvider;
    readonly path: string;
    _disconnectedTs: string;
    constructor(path: string, provider: NodeProvider);
    onList: (listener: Listener<string>) => void;
    listStream: Stream<string>;
    initListUpdate(): void;
    _lastValueUpdate: ValueUpdate;
    updateValue(value: any): void;
    setNode(node: LocalNode): void;
    setSubscriber(s: Subscriber): void;
    checkDestroy(): void;
    destroy(): void;
}
export {};

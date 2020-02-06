import { Listener, Stream } from '../utils/async';
import { Node } from '../common/node';
import { InvokeResponse } from './response/invoke';
import { Responder } from './responder';
import { Response } from './response';
import { ValueUpdate, ValueUpdateCallback } from '../common/value';
import { NodeStore } from '../common/interfaces';
export declare class LocalNode extends Node<LocalNode> {
    provider: NodeProvider;
    readonly path: string;
    /** @ignore */
    _state: NodeState;
    constructor(path: string, provider: NodeProvider);
    initialize(): void;
    addChild(name: string, node: LocalNode): void;
    removeChild(nameOrNode: string | LocalNode): void;
    /** @ignore */
    _connectState(): void;
    getInvokePermission(): number;
    getSetPermission(): number;
    invoke(params: {
        [key: string]: any;
    }, response: InvokeResponse, parentNode: LocalNode, maxPermission?: number): void;
    setConfig(name: string, value: any): void;
    setAttribute(name: string, value: any, responder?: Responder, response?: Response): void;
    removeAttribute(name: string, responder?: Responder, response?: Response): void;
    /** @ignore
     *  initial value must be undefined
     */
    _value: any;
    onSubscribe(subscriber: Subscriber): void;
    setValue(value: any, responder?: Responder, response?: Response, maxPermission?: number): void;
    /**
     * @return true when the change is valid
     */
    onValueChange(newVal: any): boolean;
    useVirtualList: boolean;
    virtualList(updates: any[]): void;
    save(): {
        [key: string]: any;
    };
    load(data: {
        [key: string]: any;
    }): void;
    destroy(): void;
}
interface ProviderOptions {
    saveFunction?: (data: any) => void;
    saveIntervalMs?: number;
}
export declare class NodeProvider implements NodeStore {
    /** @ignore */
    _states: Map<string, NodeState>;
    getVirtualNode(path: string): LocalNode;
    getNode(path: string): LocalNode;
    createState(path: string): NodeState;
    removeNode(path: string): void;
    /** @ignore */
    _root: LocalNode;
    /** @ignore */
    _saveFunction: (data: any) => void;
    constructor(options?: ProviderOptions);
    /** @ignore */
    setRoot(node: LocalNode): void;
    /** @ignore */
    _saveTimer: any;
    /** @ignore */
    _saveIntervalMs: number;
    save(): void;
    /** @ignore */
    onSaveTimer: () => void;
    finishSaveTimer(): void;
    addDef(node: LocalNode): void;
}
export interface Subscriber {
    addValue: ValueUpdateCallback;
}
export declare class NodeState {
    /** @ignore */
    _node: LocalNode;
    /** @ignore */
    _subscriber: Subscriber;
    readonly provider: NodeProvider;
    readonly path: string;
    /** @ignore */
    _disconnectedTs: string;
    constructor(path: string, provider: NodeProvider);
    /** @ignore */
    onList: (listener: Listener<string>) => void;
    /** @ignore */
    listStream: Stream<string>;
    /** @ignore */
    initListUpdate(): void;
    /** @ignore */
    _lastValueUpdate: ValueUpdate;
    /** @ignore */
    updateValue(value: any): void;
    /** @ignore */
    setNode(node: LocalNode): void;
    /** @ignore */
    setSubscriber(s: Subscriber): void;
    /** @ignore */
    checkDestroy(): void;
    /** @ignore */
    destroy(): void;
}
export {};

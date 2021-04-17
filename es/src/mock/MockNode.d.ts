import { BaseLocalNode } from '../responder/base-local-node';
export declare class MockNode extends BaseLocalNode {
    static profileName: string;
    static interval: number;
    setValueTimer: any;
    numRepeat: number;
    repeat: any;
    shouldSaveConfig(key: string): boolean;
    load(data: {
        [p: string]: any;
    }): void;
    addRepeatNode(): void;
    reduceRepeatNode(): void;
    loadChild(name: string, data: {
        [key: string]: any;
    }): void;
    destroy(): void;
}
export declare class RootMockNode extends MockNode {
    constructor(data?: {
        [key: string]: any;
    });
}

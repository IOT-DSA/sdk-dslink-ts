import { LocalNode } from "./node_state";
export declare class BaseLocalNode extends LocalNode {
    createChild(name: string, cls: typeof LocalNode, ...args: any[]): void;
    save(): {
        [key: string]: any;
    };
    saveChildren(data: {
        [key: string]: any;
    }): void;
    saveAttributes(data: {
        [key: string]: any;
    }): void;
    shouldSaveConfig(key: string): boolean;
    saveConfigs(data: {
        [key: string]: any;
    }): void;
    load(data: {
        [key: string]: any;
    }): void;
    loadChild(key: string, data: {
        [key: string]: any;
    }): LocalNode;
}

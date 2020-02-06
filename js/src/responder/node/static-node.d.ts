import { BaseLocalNode } from '../base-local-node';
export declare class StaticNode extends BaseLocalNode {
    profileName: string;
    loadChild(key: string, data: {
        [p: string]: any;
    }): void;
    shouldSaveConfig(key: string): boolean;
    save(): {
        [key: string]: any;
    };
}

import { PrivateKey } from "../crypto/pk";
export declare function getKeyFromFile(path: string): PrivateKey;
export declare class NodeSerializer {
    lastSavedStr: string;
    path: string;
    constructor(path: string);
    saveNodesToFile: (data: any) => void;
    loadNodesFromFile: () => any;
}

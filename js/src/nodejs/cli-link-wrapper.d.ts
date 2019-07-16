import { HttpClientLink } from "./client-link";
import { LocalNode } from "../responder/node_state";
import { PrivateKey } from "../crypto/pk";
interface DSLinkOption {
    rootNode?: LocalNode;
    privateKey?: PrivateKey;
    isRequester?: boolean;
    saveNodes?: boolean | string | ((data: any) => void);
    token?: string;
    linkData?: {
        [key: string]: any;
    };
    format?: string[] | string;
}
export declare class DSLink extends HttpClientLink {
    constructor(name: string, options: DSLinkOption, args?: string[]);
}
export {};

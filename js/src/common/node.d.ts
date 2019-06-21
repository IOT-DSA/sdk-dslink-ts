export declare class Node {
    static getDisplayName(nameOrPath: string): string;
    profile: Node;
    attributes: Map<string, any>;
    getAttribute(name: string): any;
    configs: Map<string, any>;
    constructor(profileName?: string);
    getConfig(name: string): object;
    children: Map<string, Node>;
    /** @ignore */
    addChild(name: string, node: Node): void;
    /** @ignore */
    removeChild(input: string): void;
    getChild(name: string): Node;
    get(name: string): object;
    /** @ignore */
    forEachChild(callback: (name: string, node: Node) => void): void;
    /** @ignore */
    forEachConfig(callback: (name: string, val: any) => void): void;
    /** @ignore */
    forEachAttribute(callback: (name: string, val: any) => void): void;
    /** @ignore */
    getSimpleMap(): {
        [key: string]: any;
    };
}
export declare class Path {
    /** @ignore */
    static readonly invalidChar: RegExp;
    /** @ignore */
    static readonly invalidNameChar: RegExp;
    /** @ignore */
    static escapeName(str: string): string;
    static getValidPath(path: any, basePath?: string): Path;
    static getValidNodePath(path: any, basePath?: string): Path;
    static getValidAttributePath(path: any, basePath?: string): Path;
    static getValidConfigPath(path: any, basePath?: string): Path;
    path: string;
    parentPath: string;
    /**  Get the parent of this path. */
    readonly parent: Path;
    /** Get a child of this path. */
    child(name: string): Path;
    name: string;
    valid: boolean;
    constructor(path: string);
    /** @ignore */
    _parse(): void;
    readonly isAbsolute: boolean;
    readonly isRoot: boolean;
    readonly isConfig: boolean;
    readonly isAttribute: boolean;
    readonly isNode: boolean;
    /** @ignore */
    mergeBasePath(base: string, force?: boolean): void;
}

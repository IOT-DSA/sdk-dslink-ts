export declare class Node<ChildType extends Node<any> = Node<any>> {
    static getDisplayName(nameOrPath: string): string;
    profile: Node<any>;
    attributes: Map<string, any>;
    getAttribute(name: string): any;
    configs: Map<string, any>;
    constructor(profileName?: string);
    getConfig(name: string): any;
    children: Map<string, ChildType>;
    getChild(name: string): ChildType;
    get(name: string): object;
    /** @ignore */
    forEachChild(callback: (name: string, node: ChildType) => void): void;
    /** @ignore */
    forEachConfig(callback: (name: string, val: any) => void): void;
    /** @ignore */
    forEachAttribute(callback: (name: string, val: any) => void): void;
    /** @ignore */
    getSimpleMap(): {
        [key: string]: any;
    };
    destroy(): void;
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
    /**
     * concat parent path with child name without validation
     */
    static concat(parentPath: string, name: string): string;
    path: string;
    parentPath: string;
    /**  Get the parent of this path. */
    get parent(): Path;
    /** Get a child of this path. */
    child(name: string): Path;
    name: string;
    valid: boolean;
    constructor(path: string);
    /** @ignore */
    _parse(): void;
    get isAbsolute(): boolean;
    get isRoot(): boolean;
    get isConfig(): boolean;
    get isAttribute(): boolean;
    get isNode(): boolean;
    /** @ignore */
    mergeBasePath(base: string, force?: boolean): void;
}

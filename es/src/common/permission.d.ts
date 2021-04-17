export declare class Permission {
    static readonly NONE = 0;
    static readonly LIST = 1;
    static readonly READ = 2;
    static readonly WRITE = 3;
    static readonly CONFIG = 4;
    static readonly NEVER = 5;
    static readonly names: string[];
    static readonly nameParser: {
        [key: string]: number;
    };
    static parse(obj: any, defaultVal?: number): number;
}

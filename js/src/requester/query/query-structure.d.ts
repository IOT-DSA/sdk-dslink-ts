export interface ValueFilterStructure {
    'field': string;
    'mode'?: 'live' | 'snapshot';
    '='?: any;
    '!='?: any;
    '>'?: number | string;
    '<'?: number | string;
    '>='?: number | string;
    '<='?: number | string;
}
export interface LogicFilterStructure {
    and?: FilterStructure[];
    or?: FilterStructure[];
}
export declare type FilterStructure = ValueFilterStructure | LogicFilterStructure;
interface NodeQueryOptions {
    '?filter'?: FilterStructure;
    '?value'?: 'live' | 'snapshot';
    '?children'?: 'live' | 'snapshot';
    '?configs'?: '*' | string[];
    '?attributes'?: '*' | string[];
}
interface ChildrenNodeQueryStructure {
    '*'?: NodeQueryStructure;
    [key: string]: NodeQueryStructure;
}
export declare type NodeQueryStructure = NodeQueryOptions & ChildrenNodeQueryStructure;
export {};

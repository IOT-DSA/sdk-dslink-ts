export interface FilterStructure {
    'field'?: string;
    'mode'?: 'live' | 'snapshot';
    '='?: any;
    '!='?: any;
    '>'?: number | string;
    '<'?: number | string;
    '>='?: number | string;
    '<='?: number | string;
    'and'?: FilterStructure[];
    'or'?: FilterStructure[];
}
export interface NodeQueryStructure {
    '?filter'?: FilterStructure;
    '?value'?: 'live' | 'snapshot';
    '?children'?: 'live' | 'snapshot';
    '?configs'?: '*' | string[];
    '?attributes'?: '*' | string[];
    /**
     * ?useChildren is a client side feature that only used by react hook
     */
    '?useChildren'?: '*' | string[];
    '*'?: NodeQueryStructure;
    [key: string]: NodeQueryStructure | any;
}

export interface ValueFilterStructure {
  'field': string;
  'mode'?: 'live' | 'snapshot'; // default is snapshot
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

export type FilterStructure = ValueFilterStructure | LogicFilterStructure;

interface NodeQueryOptions {
  '?filter'?: FilterStructure;
  '?value'?: 'live' | 'snapshot'; // ignore value if not specified
  '?children'?: 'live' | 'snapshot'; // default is snapshot
  '?configs'?: '*' | string[];
  '?attributes'?: '*' | string[];
}

interface ChildrenNodeQueryStructure {
  '*'?: NodeQueryStructure;
  [key: string]: NodeQueryStructure;
}

export type NodeQueryStructure = NodeQueryOptions & ChildrenNodeQueryStructure;

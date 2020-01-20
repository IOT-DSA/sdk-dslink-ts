export interface FilterStructure {
  'field'?: string;
  'mode'?: 'live' | 'snapshot'; // default is snapshot
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
  /**
   * filter children nodes, has no effect on the root query
   */
  '?filter'?: FilterStructure;
  /**
   * subscribe to node's value
   */
  '?value'?: 'live' | 'snapshot'; // ignore value if not specified
  /**
   * defined whether children value are monitored with subscription
   * if any of ?configs ?attributes and * is used but ?children is not defined, it use 'snapshot' as default
   */
  '?children'?: 'live' | 'snapshot'; // default is snapshot when any of ?configs ?attributes or * is defined
  /**
   * filter the configs to be queried, if not specified then no config will be returned
   */
  '?configs'?: '*' | string[];
  /**
   * filter the attributes to be queried, if not specified then no attribute will be returned
   */
  '?attributes'?: '*' | string[];
  /**
   * filter the action nodes to be queried, if not specified then no action node will be returned
   */
  '?actions'?: '*' | string[];

  /**
   * nested query for all children nodes, except action nodes or any node that already has explicit nested query with its node name
   */
  '*'?: NodeQueryStructure;

  /**
   * nested query for a specific child node
   */
  [key: string]: NodeQueryStructure | any;
}

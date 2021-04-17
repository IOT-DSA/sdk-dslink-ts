export declare class TableColumn {
    type: string;
    name: string;
    defaultValue: any;
    constructor(name: string, type: string, defaultValue?: any);
    getData(): {
        [key: string]: any;
    };
    static serializeColumns(list: any[]): {
        [key: string]: any;
    }[];
    static parseColumns(list: any[]): TableColumn[];
}
export declare class Table {
    columns: TableColumn[];
    rows: any[][];
    meta: {
        [key: string]: any;
    };
    constructor(columns: TableColumn[], rows: any[][], meta: {
        [key: string]: any;
    });
    static parse(columns: any[], rows: any[][], meta?: {
        [key: string]: any;
    }): Table;
}
export declare class TableColumns {
    readonly columns: TableColumn[];
    constructor(columns: TableColumn[]);
}
export declare class TableMetadata {
    readonly meta: {
        [key: string]: any;
    };
    constructor(meta: {
        [key: string]: any;
    });
}

export class TableColumn {
  type: string;
  name: string;
  defaultValue: any;

  constructor(name: string, type: string, defaultValue?: any) {
    this.name = name;
    this.type = type;
    this.defaultValue = defaultValue;
  }

  getData(): {[key: string]: any} {
    let rslt: any = {
      "type": this.type,
      "name": this.name
    };

    if (this.defaultValue != null) {
      rslt["default"] = this.defaultValue;
    }
    return rslt;
  }

  /// convert tableColumns into List of object
  static serializeColumns(list: any[]): {[key: string]: any}[] {
    let rslts: {[key: string]: any}[] = [];
    for (let m of list) {
      if (m instanceof Object) {
        if (m instanceof TableColumn) {
          rslts.push(m.getData());
        } else {
          rslts.push(m);
        }
      }
    }
    return rslts;
  }

  /// parse List of object into TableColumn
  static parseColumns(list: any[]): TableColumn[] {
    let rslt: TableColumn[] = [];
    for (let m of list) {
      if ((m != null && m instanceof Object) && typeof m["name"] === 'string') {
        let type = "string";
        if (typeof m["type"] === 'string') {
          type = m["type"];
        }
        rslt.push(new TableColumn(m["name"], type, m["default"]));
      } else if (m instanceof TableColumn) {
        rslt.push(m);
      } else {
        // invalid column data
        return null;
      }
    }
    return rslt;
  }
}

export class Table {
  columns: TableColumn[];
  rows: any[][];
  meta: {[key: string]: any};

  constructor(columns: TableColumn[], rows: any[][], meta: {[key: string]: any}) {
    this.columns = columns;
    this.rows = rows;
    this.meta = meta;
  }

  static parse(columns: any[], rows: any[][], meta?: {[key: string]: any}) {
    return new Table(TableColumn.parseColumns(columns), rows, meta);
  }
}

export class TableColumns {
  readonly columns: TableColumn[];

  constructor(columns: TableColumn[]) {
    this.columns = columns;
  }
}

export class TableMetadata {
  readonly meta: {[key: string]: any};

  constructor(meta: {[key: string]: any}) {
    this.meta = meta;
  }
}

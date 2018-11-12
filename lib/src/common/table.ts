// part of dslink.common;

export class TableColumn  {
  type: string;
  name: string;
  defaultValue: object;

  TableColumn(this.name, this.type, [this.defaultValue]);

  getData():{[key: string]: dynamic} {
    var rslt = <string, dynamic>{
      "type": type,
      "name": name
    };

    if (defaultValue != null) {
      rslt["default"] = defaultValue;
    }
    return rslt;
  }

  /// convert tableColumns into List of object
  static List<{[key: string]: dynamic}> serializeColumns(list: List) {
    var rslts = <{[key: string]: dynamic}>[];
    for (object m in list) {
      if (m is {[key: string]: dynamic}) {
        rslts.add(m);
      } else if ( m instanceof TableColumn ) {
        rslts.add(m.getData());
      }
    }
    return rslts;
  }

  /// parse List of object into TableColumn
  static parseColumns(list: List):TableColumn[] {
    rslt: TableColumn[] = <TableColumn>[];
    for (object m in list) {
      if ( (m != null && m instanceof Object) && m["name"] is string) {
        let type: string = "string";
        if (m["type"] is string) {
          type = m["type"];
        }
        rslt.add(new TableColumn(m["name"], type, m["default"]));
      } else if ( m instanceof TableColumn ) {
        rslt.add(m);
      } else {
        // invalid column data
        return null;
      }
    }
    return rslt;
  }
}

export class Table  {
  columns: TableColumn[];
  rows: List[];
  meta: object;

  Table(this.columns, this.rows, {this.meta});
}

export class TableColumns  {
  final columns: TableColumn[];

  TableColumns(this.columns);
}

export class TableMetadata  {
  final meta: object;

  TableMetadata(this.meta);
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableMetadata = exports.TableColumns = exports.Table = exports.TableColumn = void 0;
class TableColumn {
    constructor(name, type, defaultValue) {
        this.name = name;
        this.type = type;
        this.defaultValue = defaultValue;
    }
    getData() {
        let rslt = {
            type: this.type,
            name: this.name
        };
        if (this.defaultValue != null) {
            rslt['default'] = this.defaultValue;
        }
        return rslt;
    }
    /// convert tableColumns into List of object
    static serializeColumns(list) {
        let rslts = [];
        for (let m of list) {
            if (m instanceof Object) {
                if (m instanceof TableColumn) {
                    rslts.push(m.getData());
                }
                else {
                    rslts.push(m);
                }
            }
        }
        return rslts;
    }
    /// parse List of object into TableColumn
    static parseColumns(list) {
        let rslt = [];
        for (let m of list) {
            if (m != null && m instanceof Object && typeof m['name'] === 'string') {
                let type = 'string';
                if (typeof m['type'] === 'string') {
                    type = m['type'];
                }
                rslt.push(new TableColumn(m['name'], type, m['default']));
            }
            else if (m instanceof TableColumn) {
                rslt.push(m);
            }
            else {
                // invalid column data
                return null;
            }
        }
        return rslt;
    }
}
exports.TableColumn = TableColumn;
class Table {
    constructor(columns, rows, meta) {
        this.columns = columns;
        this.rows = rows;
        this.meta = meta;
    }
    static parse(columns, rows, meta) {
        return new Table(TableColumn.parseColumns(columns), rows, meta);
    }
}
exports.Table = Table;
class TableColumns {
    constructor(columns) {
        this.columns = columns;
    }
}
exports.TableColumns = TableColumns;
class TableMetadata {
    constructor(meta) {
        this.meta = meta;
    }
}
exports.TableMetadata = TableMetadata;
//# sourceMappingURL=table.js.map
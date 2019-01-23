"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
library;
dslink.historian;
require("dart:async");
require("dart:math");
require("package:dslink/dslink.dart");
require("package:dslink/nodes.dart");
require("package:dslink/utils.dart");
part;
"src/historian/interval.dart";
part;
"src/historian/rollup.dart";
part;
"src/historian/get_history.dart";
part;
"src/historian/manage.dart";
part;
"src/historian/values.dart";
part;
"src/historian/adapter.dart";
part;
"src/historian/container.dart";
part;
"src/historian/publish.dart";
part;
"src/historian/main.dart";
_link: LinkProvider;
_historian: HistorianAdapter;
get;
historian();
HistorianAdapter;
{
    return this._historian;
}
get;
link();
LinkProvider;
{
    return this._link;
}
//# sourceMappingURL=historian.js.map
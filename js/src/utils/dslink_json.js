"use strict";
// part of dslink.utils;
Object.defineProperty(exports, "__esModule", { value: true });
class DSLinkJSON {
    constructor() {
        this.engines = {};
    }
    get json() { return this._json; }
    object() { [key, string]; dynamic; }
}
exports.DSLinkJSON = DSLinkJSON;
 > configs;
{ }
;
getDependencies: string[] = [];
DSLinkJSON();
factory;
DSLinkJSON.from(map, { [key]: string, dynamic });
{
    var j = new DSLinkJSON();
    j._json = map;
    j.name = map["name"];
    j.version = map["version"];
    j.description = map["description"];
    j.main = map["main"];
    j.engines = map["engines"];
    j.configs = map["configs"] < string, { [key]: string, dynamic } > ;
    j.getDependencies = map["getDependencies"];
    return j;
}
verify();
{
    if (name == null) {
        throw new Exception("DSLink Name is required.");
    }
    if (main == null) {
        throw new Exception("DSLink Main Script is required.");
    }
}
save();
object;
{
    verify();
    var map = new { [key]: string, dynamic }.from(this._json != null ? _json : {});
    map["name"] = name;
    map["version"] = version;
    map["description"] = description;
    map["main"] = main;
    map["engines"] = engines;
    map["configs"] = configs;
    map["getDependencies"] = getDependencies;
    for (var key of map.keys.toList()) {
        if (map[key] == null) {
            map.remove(key);
        }
    }
    return map;
}
//# sourceMappingURL=dslink_json.js.map
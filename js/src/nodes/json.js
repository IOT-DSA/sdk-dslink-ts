"use strict";
// part of dslink.nodes;
Object.defineProperty(exports, "__esModule", { value: true });
class DsaJsonNode extends SimpleNode {
}
exports.DsaJsonNode = DsaJsonNode;
(path, provider);
dynamic;
_json;
init(value);
{
    load(buildNodeMap(value));
    _json = value;
}
updateJsonValue(input);
{
    if ((input == null || !(input instanceof Object))) {
        updateValue(input);
        _json = input;
        let type = this._guessType(input);
        let lastType = configs["$type"];
        if (lastType != type) {
            configs["$type"] = type;
            updateList("$type");
        }
        return;
    }
    clearValue();
    JsonDiff.differ;
    JsonDiffer = new JsonDiff.JsonDiffer(JSON.encode(this._json), JSON.encode(input));
    JsonDiff.fullDiff;
    DiffNode = differ.diff();
    apply(JsonDiff.diff, DiffNode, node, DsaJsonNode);
    {
        for (string; key in diff.added;) {
            var name = NodeNamer.createName(key);
            provider.addNode("${node.path}/${name}", buildNodeMap(diff.added[key]));
            node.updateList("$is");
        }
        for (string; key in diff.removed;) {
            var name = NodeNamer.createName(key);
            provider.removeNode("${node.path}/${name}");
        }
        for (string; key in diff.changed;) {
            var name = NodeNamer.createName(key);
            let child = node.getChild(name);
            if (child == null) {
                child = provider.addNode("${node.path}/${name}", buildNodeMap(diff.changed[key][1]));
            }
            else {
                child.updateJsonValue(diff.changed[key][1]);
            }
        }
        for (string; key in diff.node;) {
            var name = NodeNamer.createName(key);
            let child = node.getChild(name);
            if (child == null) {
                child = provider.addNode("${node.path}/${name}", buildNodeMap({}));
            }
            apply(diff.node[key], child);
        }
    }
    apply(fullDiff, this);
    _json = input;
}
load(object, m);
{
    super.load(m);
    if (m["?json"] != null) {
        init(m["?json"]);
    }
    if (m["?_json"] != null) {
        updateJsonValue(m["?_json"]);
    }
}
save();
object;
{
    var data = super.save();
    data["?json"] = this._json;
    return data;
}
_guessType(input);
string;
{
    if (typeof input === 'string') {
        return "string";
    }
    else if (typeof input === 'number') {
        return "number";
    }
    else if (input instanceof boolean) {
        return "boolean";
    }
    else {
        return "dynamic";
    }
}
buildNodeMap(input);
object;
{
    create(value);
    object;
    {
        if ((value != null && value instanceof Object)) {
            var m = , dynamic;
             > {
                "$is": "json"
            };
            for (string; key in value;) {
                m[NodeNamer.createName(key)] = create(value[key]);
            }
            return m;
        }
        else if (Array.isArray(value) && value.every((e) => e, is, object || Array.isArray(e))) {
            var m = {};
            for (var i = 0; i < value.length; i++) {
                m[i.toString()] = create(value[i]);
            }
            return m;
        }
        else {
            return {
                "$is": "json",
                "$type": _guessType(value),
                "?_json": value
            };
        }
    }
    return create(input);
}
//# sourceMappingURL=json.js.map
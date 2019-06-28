"use strict";
// part of dslink.historian;
Object.defineProperty(exports, "__esModule", { value: true });
class PublishValueAction extends SimpleNode {
}
exports.PublishValueAction = PublishValueAction;
(path);
onInvoke(params, { [key]: string, dynamic });
{
    var inputPath = params["Path"];
    dynamic;
    val = params["Value"];
    ts: string = params["Timestamp"];
    if (ts == null) {
        ts = ValueUpdate.getTs();
    }
    if (typeof inputPath !== 'string') {
        throw "Path not provided.";
    }
    Path;
    p = new Path(path);
    tp: string = p
        .parent
        .child(NodeNamer.createName(inputPath))
        .path;
    node: SimpleNode = _link[tp];
    pn: WatchPathNode;
    if (!(node instanceof WatchPathNode)) {
        pn = this._link.addNode(tp, {
            "$name": inputPath,
            "$is": "watchPath",
            "$publish": true,
            "$type": "dynamic",
            "$path": inputPath
        });
        _link.save();
    }
    else {
        pn = node;
    }
    pn.doUpdate(new ValueUpdate(val, ts, ts));
}
//# sourceMappingURL=publish.js.map
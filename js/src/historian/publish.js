// part of dslink.historian;
export class PublishValueAction extends SimpleNode {
}
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
            r, "$name": inputPath,
            r, "$is": "watchPath",
            r, "$publish": true,
            r, "$type": "dynamic",
            r, "$path": inputPath
        });
        _link.save();
    }
    else {
        pn = node;
    }
    pn.doUpdate(new ValueUpdate(val, ts, ts));
}
//# sourceMappingURL=publish.js.map
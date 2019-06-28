"use strict";
// part of dslink.historian;
Object.defineProperty(exports, "__esModule", { value: true });
class CreateWatchGroupNode extends SimpleNode {
}
exports.CreateWatchGroupNode = CreateWatchGroupNode;
(path, this._link.provider);
onInvoke(params, { [key]: string, dynamic });
async;
{
    name: string = params["Name"];
    realName: string = NodeNamer.createName(name);
    var p = new Path(path);
    _link.addNode("${p.parentPath}/${realName}", {
        "$is": "watchGroup",
        "$name": name
    });
    _link.save();
}
class AddDatabaseNode extends SimpleNode {
}
exports.AddDatabaseNode = AddDatabaseNode;
(path, this._link.provider);
onInvoke(params, { [key]: string, dynamic });
async;
{
    name: string = params["Name"];
    realName: string = NodeNamer.createName(name);
    _link.addNode("/${realName}", {
        "$is": "database",
        "$name": name,
        "$$db_config": params
    });
    _link.save();
}
class AddWatchPathNode extends SimpleNode {
}
exports.AddWatchPathNode = AddWatchPathNode;
(path);
onInvoke(params, { [key]: string, dynamic });
async;
{
    wp: string = params["Path"];
    rp: string = NodeNamer.createName(wp);
    var p = new Path(path);
    var targetPath = "${p.parentPath}/${rp}";
    var node = await _link.requester.getRemoteNode(wp);
    _link.addNode(targetPath, {
        "$name": wp,
        "$path": wp,
        "$is": "watchPath",
        "$type": node.configs["$type"]
    });
    _link.save();
}
class PurgePathNode extends SimpleNode {
}
exports.PurgePathNode = PurgePathNode;
(path);
onInvoke(params, { [key]: string, dynamic });
async;
{
    tr: TimeRange = parseTimeRange(params["timeRange"]);
    if (tr == null) {
        return;
    }
    watchPathNode: WatchPathNode = _link[new Path(path).parentPath];
    await watchPathNode.group.db.database.purgePath(watchPathNode.group._watchName, watchPathNode.valuePath, tr);
}
class PurgeGroupNode extends SimpleNode {
}
exports.PurgeGroupNode = PurgeGroupNode;
(path);
onInvoke(params, { [key]: string, dynamic });
async;
{
    tr: TimeRange = parseTimeRange(params["timeRange"]);
    if (tr == null) {
        return;
    }
    watchGroupNode: WatchGroupNode = _link[new Path(path).parentPath];
    await watchGroupNode.db.database.purgeGroup(watchGroupNode._watchName, tr);
}
//# sourceMappingURL=manage.js.map
// part of dslink.historian;

export class CreateWatchGroupNode  extends SimpleNode {
  CreateWatchGroupNode(path: string) : super(path, this._link.provider);

  @override
  onInvoke(params: {[key: string]: dynamic}) async {
    name: string = params["Name"];
    realName: string = NodeNamer.createName(name);

    var p = new Path(path);

    _link.addNode("${p.parentPath}/${realName}", {
      r"$is": "watchGroup",
      r"$name": name
    });
    _link.save();
  }
}

export class AddDatabaseNode  extends SimpleNode {
  AddDatabaseNode(path: string) : super(path, this._link.provider);

  @override
  onInvoke(params: {[key: string]: dynamic}) async {
    name: string = params["Name"];
    realName: string = NodeNamer.createName(name);

    _link.addNode("/${realName}", {
      r"$is": "database",
      r"$name": name,
      r"$$db_config": params
    });
    _link.save();
  }
}

export class AddWatchPathNode  extends SimpleNode {
  AddWatchPathNode(path: string) : super(path);

  @override
  onInvoke(params: {[key: string]: dynamic}) async {
    wp: string = params["Path"];
    rp: string = NodeNamer.createName(wp);
    var p = new Path(path);
    var targetPath = "${p.parentPath}/${rp}";
    var node = await _link.requester.getRemoteNode(wp);
    _link.addNode(targetPath, {
      r"$name": wp,
      r"$path": wp,
      r"$is": "watchPath",
      r"$type": node.configs[r"$type"]
    });

    _link.save();
  }
}

export class PurgePathNode  extends SimpleNode {
  PurgePathNode(path: string) : super(path);

  @override
  onInvoke(params: {[key: string]: dynamic}) async {
    tr: TimeRange = parseTimeRange(params["timeRange"]);
    if (tr == null) {
      return;
    }

    watchPathNode: WatchPathNode = _link[new Path(path).parentPath];
    await watchPathNode.group.db.database.purgePath(
      watchPathNode.group._watchName,
      watchPathNode.valuePath,
      tr
    );
  }
}

export class PurgeGroupNode  extends SimpleNode {
  PurgeGroupNode(path: string) : super(path);

  @override
  onInvoke(params: {[key: string]: dynamic}) async {
    tr: TimeRange = parseTimeRange(params["timeRange"]);
    if (tr == null) {
      return;
    }

    watchGroupNode: WatchGroupNode = _link[new Path(path).parentPath];
    await watchGroupNode.db.database.purgeGroup(
      watchGroupNode._watchName,
      tr
    );
  }
}

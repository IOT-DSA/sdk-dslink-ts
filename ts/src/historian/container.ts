// part of dslink.historian;

export class DatabaseNode  extends SimpleNode {
  config: object;
  database: HistorianDatabaseAdapter;
  onDatabaseReady: Function[] = [];

  DatabaseNode(path: string) : super(path);

  @override
  onCreated() {
    new Future(() async {
      config = configs[r"$$db_config"];
      while (removed != true) {
        try {
          database = await _historian.getDatabase(config);
          while (onDatabaseReady.isNotEmpty) {
            onDatabaseReady.removeAt(0)();
          }
          break;
        } catch (e, stack) {
          console.error(
            `Failed to connect to database for ${path}`,
            e,
            stack
          );
          await new Future.delayed(const Duration(seconds: 5));
        }
      }

      if (removed == true) {
        try {
          await database.close();
        } catch (e) {}
        return;
      }

      _link.addNode("${path}/createWatchGroup", {
        r"$name": "Add Watch Group",
        r"$is": "createWatchGroup",
        r"$invokable": "write",
        r"$params": [
          {
            "name": "Name",
            "type": "string"
          }
        ]
      });

      _link.addNode("${path}/delete", {
        r"$name": "Delete",
        r"$invokable": "write",
        r"$is": "delete"
      });
    });
  }

  @override
  onRemoving() {
    if (database != null) {
      database.close();
    }
  }
}

export class WatchPathNode  extends SimpleNode {
  valuePath: string;
  group: WatchGroupNode;
  isPublishOnly: boolean = false;

  WatchPathNode(path: string) : super(path);

  @override
  onCreated() async {
    rp: string = configs[r"$path"];

    if (rp == null) {
      rp = configs[r"$value_path"];
    }

    if (configs[r"$publish"] == true) {
      isPublishOnly = true;
    }

    valuePath = rp;
    group = _link[new Path(path).parentPath];

    groupName: string = group._watchName;

    _link.addNode("${path}/lwv", {
      r"$name": "Last Written Value",
      r"$type": "dynamic"
    });

    _link.addNode("${path}/startDate", {
      r"$name": "Start Date",
      r"$type": "string"
    });

    _link.addNode("${path}/endDate", {
      r"$name": "End Date",
      r"$type": "string"
    });

    if (children["enabled"] == null) {
      _link.addNode("${path}/enabled", {
        r"$name": "Enabled",
        r"$type": "boolean",
        "?value": true,
        r"$writable": "write"
      });
    }

    if (group.db.database == null) {
      Completer c = new Completer();
      group.db.onDatabaseReady.add(c.complete);
      await c.future;
    }

    summary: HistorySummary = await group.db.database.getSummary(
      groupName,
      valuePath
    );

    if (summary.first != null) {
      _link.updateValue("${path}/startDate", summary.first.timestamp);
      isStartDateFilled = true;
    }

    if (summary.last != null) {
      let update: ValueUpdate = new ValueUpdate(
        summary.last.value,
        ts: summary.last.timestamp
      );
      _link.updateValue("${path}/lwv", update);
      updateValue(update);
    }

    timer = Scheduler.safeEvery(const Duration(seconds: 1), () async {
      await storeBuffer();
    });

    var ghn = new GetHistoryNode("${path}/getHistory");
    addChild("getHistory", ghn);
    ( this._link.provider as SimpleNodeProvider).setNode(ghn.path, ghn);
    updateList("getHistory");

    _link.addNode("${path}/purge", {
      r"$name": "Purge",
      r"$invokable": "write",
      r"$params": [
        {
          "name": "timeRange",
          "type": "string",
          "editor": "daterange"
        }
      ],
      r"$is": "purgePath"
    });

    _link.addNode("${path}/delete", {
      r"$name": "Delete",
      r"$invokable": "write",
      r"$is": "delete"
    });

    _link.onValueChange("${path}/enabled").listen((update: ValueUpdate) {
      if (update.value == true) {
        sub();
      } else {
        if (valueSub != null) {
          valueSub.close();
          valueSub = null;
        }
      }
    });

    if ( this._link.val("${path}/enabled") == true) {
      sub();
    }

    group.db.database.addWatchPathExtensions(this);
  }

  valueSub: ReqSubscribeListener;

  sub() {
    if (!isPublishOnly) {
      if (valueSub != null) {
        valueSub.close();
        valueSub = null;
      }

      valueSub = this._link.requester.subscribe(valuePath, (update: ValueUpdate) {
        doUpdate(update);
      });
    }
  }

  doUpdate(update: ValueUpdate) {
    updateValue(update);
    buffer.add(update);
  }

  asValueEntry(update: ValueUpdate):ValueEntry {
    return new ValueEntry(group._watchName, valuePath, update.ts, update.value);
  }

  isStartDateFilled: boolean = false;

  storeBuffer() async {
    entries: ValueEntry[] = buffer.map(asValueEntry).toList();

    if (entries.isNotEmpty) {
      try {
        if (!isStartDateFilled) {
          _link.updateValue("${path}/startDate", entries.first.timestamp);
        }

        _link.updateValue("${path}/lwv", entries.last.value);
        _link.updateValue("${path}/endDate", entries.last.timestamp);
      } catch (e) {
      }
    }
    buffer.clear();
    await group.storeValues(entries);
  }

  @override
  onRemoving() {
    if (timer != null) {
      timer.dispose();
    }

    storeBuffer();

    while (onRemoveCallbacks.isNotEmpty) {
      onRemoveCallbacks.removeAt(0)();
    }
  }

  @override
  save():object {
    var out = super.save();
    out.remove("lwv");
    out.remove("startDate");
    out.remove("endDate");
    out.remove("getHistory");
    out.remove("publish");

    while (onSaveCallbacks.isNotEmpty) {
      onSaveCallbacks.removeAt(0)(out);
    }

    return out;
  }

  onSaveCallbacks: Function[] = [];
  onRemoveCallbacks: Function[] = [];

  buffer: ValueUpdate[] = [];
  timer: Disposable;

  fetchHistory(range: TimeRange):Stream<ValuePair> {
    return group.fetchHistory(valuePath, range);
  }
}

export class WatchGroupNode  extends SimpleNode {
  db: DatabaseNode;
  _watchName: string;

  WatchGroupNode(path: string) : super(path, this._link.provider);

  @override
  onCreated() {
    var p = new Path(path);
    db = _link[p.parentPath];
    _watchName = configs[r"$name"];

    if ( this._watchName == null) {
      _watchName = NodeNamer.decodeName(p.name);
    }

    _link.addNode("${path}/addWatchPath", {
      r"$name": "Add Watch Path",
      r"$invokable": "write",
      r"$is": "addWatchPath",
      r"$params": [
        {
          "name": "Path",
          "type": "string"
        }
      ]
    });

    _link.addNode("${path}/publish", {
      r"$name": "Publish",
      r"$invokable": "write",
      r"$is": "publishValue",
      r"$params": [
        {
          "name": "Path",
          "type": "string"
        },
        {
          "name": "Value",
          "type": "dynamic"
        },
        {
          "name": "Timestamp",
          "type": "string"
        }
      ]
    });

    _link.addNode("${path}/delete", {
      r"$name": "Delete",
      r"$invokable": "write",
      r"$is": "delete"
    });

    _link.addNode("${path}/purge", {
      r"$name": "Purge",
      r"$invokable": "write",
      r"$params": [
        {
          "name": "timeRange",
          "type": "string",
          "editor": "daterange"
        }
      ],
      r"$is": "purgeGroup"
    });

    new Future(() async {
      if (db.database == null) {
        Completer c = new Completer();
        db.onDatabaseReady.add(c.complete);
        await c.future;
      }

      db.database.addWatchGroupExtensions(this);
    });
  }

  @override
  onRemoving() {
    while (onRemoveCallbacks.isNotEmpty) {
      onRemoveCallbacks.removeAt(0)();
    }
    super.onRemoving();
  }

  fetchHistory(path: string, range: TimeRange):Stream<ValuePair> {
    return db.database.fetchHistory(name, path, range);
  }

  storeValues(entries: ValueEntry[]):Future {
    return db.database.store(entries);
  }

  onRemoveCallbacks: Function[] = [];
}


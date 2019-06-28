"use strict";
// part of dslink.historian;
Object.defineProperty(exports, "__esModule", { value: true });
class DatabaseNode extends SimpleNode {
    constructor() {
        super(...arguments);
        this.onDatabaseReady = [];
    }
}
exports.DatabaseNode = DatabaseNode;
(path);
onCreated();
{
    new Future((), async, {
        config = configs["$$db_config"],
        while(removed) { }
    } != true);
    {
        try {
            database = await _historian.getDatabase(config);
            while (onDatabaseReady.isNotEmpty) {
                onDatabaseReady.removeAt(0)();
            }
            break;
        }
        catch (e) { }
        stack;
        {
            console.error(`Failed to connect to database for ${path}`, e, stack);
            await new Future.delayed();
            const Duration;
            (seconds) => ;
            ;
        }
    }
    if (removed == true) {
        try {
            await database.close();
        }
        catch (e) { }
        return;
    }
    _link.addNode("${path}/createWatchGroup", {
        "$name": "Add Watch Group",
        "$is": "createWatchGroup",
        "$invokable": "write",
        "$params": [
            {
                "name": "Name",
                "type": "string"
            }
        ]
    });
    _link.addNode("${path}/delete", {
        "$name": "Delete",
        "$invokable": "write",
        "$is": "delete"
    });
}
;
onRemoving();
{
    if (database != null) {
        database.close();
    }
}
class WatchPathNode extends SimpleNode {
    constructor() {
        super(...arguments);
        this.isPublishOnly = false;
    }
}
exports.WatchPathNode = WatchPathNode;
(path);
onCreated();
async;
{
    rp: string = configs["$path"];
    if (rp == null) {
        rp = configs["$value_path"];
    }
    if (configs["$publish"] == true) {
        isPublishOnly = true;
    }
    valuePath = rp;
    group = _link[new Path(path).parentPath];
    groupName: string = group._watchName;
    _link.addNode("${path}/lwv", {
        "$name": "Last Written Value",
        "$type": "dynamic"
    });
    _link.addNode("${path}/startDate", {
        "$name": "Start Date",
        "$type": "string"
    });
    _link.addNode("${path}/endDate", {
        "$name": "End Date",
        "$type": "string"
    });
    if (children["enabled"] == null) {
        _link.addNode("${path}/enabled", {
            "$name": "Enabled",
            "$type": "boolean",
            "?value": true,
            "$writable": "write"
        });
    }
    if (group.db.database == null) {
        Completer;
        c = new Completer();
        group.db.onDatabaseReady.add(c.complete);
        await c.future;
    }
    summary: HistorySummary = await group.db.database.getSummary(groupName, valuePath);
    if (summary.first != null) {
        _link.updateValue("${path}/startDate", summary.first.timestamp);
        isStartDateFilled = true;
    }
    if (summary.last != null) {
        let update = new ValueUpdate(summary.last.value, ts, summary.last.timestamp);
        _link.updateValue("${path}/lwv", update);
        updateValue(update);
    }
    timer = Scheduler.safeEvery();
    const Duration;
    (seconds) => , ();
    async;
    {
        await storeBuffer();
    }
    ;
    var ghn = new GetHistoryNode("${path}/getHistory");
    addChild("getHistory", ghn);
    this._link.provider.setNode(ghn.path, ghn);
    updateList("getHistory");
    _link.addNode("${path}/purge", {
        "$name": "Purge",
        "$invokable": "write",
        "$params": [
            {
                "name": "timeRange",
                "type": "string",
                "editor": "daterange"
            }
        ],
        "$is": "purgePath"
    });
    _link.addNode("${path}/delete", {
        "$name": "Delete",
        "$invokable": "write",
        "$is": "delete"
    });
    _link.onValueChange("${path}/enabled").listen((update) => {
        if (update.value == true) {
            sub();
        }
        else {
            if (valueSub != null) {
                valueSub.close();
                valueSub = null;
            }
        }
    });
    if (this._link.val("${path}/enabled") == true) {
        sub();
    }
    group.db.database.addWatchPathExtensions(this);
}
valueSub: ReqSubscribeListener;
sub();
{
    if (!isPublishOnly) {
        if (valueSub != null) {
            valueSub.close();
            valueSub = null;
        }
        valueSub = this._link.requester.subscribe(valuePath, (update) => {
            doUpdate(update);
        });
    }
}
doUpdate(update, ValueUpdate);
{
    updateValue(update);
    buffer.add(update);
}
asValueEntry(update, ValueUpdate);
ValueEntry;
{
    return new ValueEntry(group._watchName, valuePath, update.ts, update.value);
}
isStartDateFilled: boolean = false;
storeBuffer();
async;
{
    entries: ValueEntry[] = buffer.map(asValueEntry).toList();
    if (entries.isNotEmpty) {
        try {
            if (!isStartDateFilled) {
                _link.updateValue("${path}/startDate", entries.first.timestamp);
            }
            _link.updateValue("${path}/lwv", entries.last.value);
            _link.updateValue("${path}/endDate", entries.last.timestamp);
        }
        catch (e) {
        }
    }
    buffer.clear();
    await group.storeValues(entries);
}
onRemoving();
{
    if (timer != null) {
        timer.dispose();
    }
    storeBuffer();
    while (onRemoveCallbacks.isNotEmpty) {
        onRemoveCallbacks.removeAt(0)();
    }
}
save();
object;
{
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
fetchHistory(range, TimeRange);
Stream < ValuePair > {
    return: group.fetchHistory(valuePath, range)
};
class WatchGroupNode extends SimpleNode {
}
exports.WatchGroupNode = WatchGroupNode;
(path, this._link.provider);
onCreated();
{
    var p = new Path(path);
    db = _link[p.parentPath];
    _watchName = configs["$name"];
    if (this._watchName == null) {
        _watchName = NodeNamer.decodeName(p.name);
    }
    _link.addNode("${path}/addWatchPath", {
        "$name": "Add Watch Path",
        "$invokable": "write",
        "$is": "addWatchPath",
        "$params": [
            {
                "name": "Path",
                "type": "string"
            }
        ]
    });
    _link.addNode("${path}/publish", {
        "$name": "Publish",
        "$invokable": "write",
        "$is": "publishValue",
        "$params": [
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
        "$name": "Delete",
        "$invokable": "write",
        "$is": "delete"
    });
    _link.addNode("${path}/purge", {
        "$name": "Purge",
        "$invokable": "write",
        "$params": [
            {
                "name": "timeRange",
                "type": "string",
                "editor": "daterange"
            }
        ],
        "$is": "purgeGroup"
    });
    new Future((), async, {
        if(db) { }, : .database == null
    });
    {
        Completer;
        c = new Completer();
        db.onDatabaseReady.add(c.complete);
        await c.future;
    }
    db.database.addWatchGroupExtensions(this);
}
;
onRemoving();
{
    while (onRemoveCallbacks.isNotEmpty) {
        onRemoveCallbacks.removeAt(0)();
    }
    super.onRemoving();
}
fetchHistory(path, string, range, TimeRange);
Stream < ValuePair > {
    return: db.database.fetchHistory(name, path, range)
};
storeValues(entries, ValueEntry[]);
Future;
{
    return db.database.store(entries);
}
onRemoveCallbacks: Function[] = [];
//# sourceMappingURL=container.js.map
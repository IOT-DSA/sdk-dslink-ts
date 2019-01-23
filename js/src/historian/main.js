"use strict";
// part of dslink.historian;
historianMain(args, string[], name, string, adapter, HistorianAdapter);
async;
{
    _historian = adapter;
    _link = new LinkProvider(args, "${name}-", isRequester, true, autoInitialize, false, nodes, {
        "addDatabase": {
            r, "$name": "Add Database",
            r, "$invokable": "write",
            r, "$params": [
                {
                    "name": "Name",
                    "type": "string",
                    "placeholder": "HistoryData"
                }
            ]..addAll(adapter.getCreateDatabaseParameters()),
            r, "$is": "addDatabase"
        }
    }, profiles, {
        "createWatchGroup": (path) => new CreateWatchGroupNode(path),
        "addDatabase": (path) => new AddDatabaseNode(path),
        "addWatchPath": (path) => new AddWatchPathNode(path),
        "watchGroup": (path) => new WatchGroupNode(path),
        "watchPath": (path) => new WatchPathNode(path),
        "database": (path) => new DatabaseNode(path),
        "delete": (path) => new DeleteActionNode.forParent(path, this._link.provider, onDelete, () => {
            _link.save();
        }),
        "purgePath": (path) => new PurgePathNode(path),
        "purgeGroup": (path) => new PurgeGroupNode(path),
        "publishValue": (path) => new PublishValueAction(path)
    }, encodePrettyJson, true);
    _link.init();
    _link.connect();
}
//# sourceMappingURL=main.js.map
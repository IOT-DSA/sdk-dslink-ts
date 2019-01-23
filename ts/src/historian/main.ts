// part of dslink.historian;

historianMain(args: string[], name: string, adapter: HistorianAdapter) async {
  _historian = adapter;

  _link = new LinkProvider(
    args,
    "${name}-",
    isRequester: true,
    autoInitialize: false,
    nodes: {
      "addDatabase": {
        r"$name": "Add Database",
        r"$invokable": "write",
        r"$params": <{[key: string]: dynamic}>[
          {
            "name": "Name",
            "type": "string",
            "placeholder": "HistoryData"
          }
        ]..addAll(adapter.getCreateDatabaseParameters()),
        r"$is": "addDatabase"
      }
    },
    profiles: {
      "createWatchGroup": (path: string) => new CreateWatchGroupNode(path),
      "addDatabase": (path: string) => new AddDatabaseNode(path),
      "addWatchPath": (path: string) => new AddWatchPathNode(path),
      "watchGroup": (path: string) => new WatchGroupNode(path),
      "watchPath": (path: string) => new WatchPathNode(path),
      "database": (path: string) => new DatabaseNode(path),
      "delete": (path: string) => new DeleteActionNode.forParent(
        path, this._link.provider as MutableNodeProvider, onDelete: () {
        _link.save();
      }),
      "purgePath": (path: string) => new PurgePathNode(path),
      "purgeGroup": (path: string) => new PurgeGroupNode(path),
      "publishValue": (path: string) => new PublishValueAction(path)
    },
    encodePrettyJson: true
  );
  _link.init();
  _link.connect();
}

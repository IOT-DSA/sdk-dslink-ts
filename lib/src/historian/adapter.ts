// part of dslink.historian;

export interface HistorianAdapter {
  Future<HistorianDatabaseAdapter> getDatabase(config: object);

  List<{[key: string]: dynamic}> getCreateDatabaseParameters();
}

export interface HistorianDatabaseAdapter {
  Future<HistorySummary> getSummary(group: string, path: string);
  Future store(entries: ValueEntry[]);
  Stream<ValuePair> fetchHistory(group: string, path: string, range: TimeRange);
  Future purgePath(group: string, path: string, range: TimeRange);
  Future purgeGroup(group: string, range: TimeRange);

  Future close();

  addWatchPathExtensions(node: WatchPathNode) {}
  addWatchGroupExtensions(node: WatchGroupNode) {}
}

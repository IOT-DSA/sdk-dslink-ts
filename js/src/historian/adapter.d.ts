export interface HistorianAdapter {
    Promise<HistorianDatabaseAdapter>(): any;
    getDatabase(config: object): any;
    List(): any;
}
export interface HistorianDatabaseAdapter {
    Promise<HistorySummary>(): any;
    getSummary(group: string, path: string): any;
}

export interface LocalNode extends Node {
    _listChangeController: BroadcastStreamController<string>;
}

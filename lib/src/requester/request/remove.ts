// part of dslink.requester;

export class RemoveController  implements RequestUpdater {
  final completer: Completer<RequesterUpdate> = new Completer<RequesterUpdate>();
  Future<RequesterUpdate> get future => completer.future;

  final requester: Requester;
  final path: string;
  _request: Request;

  RemoveController(this.requester, this.path) {
    var reqMap = <string, dynamic>{
      'method': 'remove',
      'path': path
    };

    _request = requester._sendRequest(reqMap, this);
  }

  onUpdate(status: string, updates: List, columns: List, meta: object, error: DSError) {
    // TODO implement error
    completer.complete(new RequesterUpdate(status));
  }

  void onDisconnect() {}

  void onReconnect() {}
}

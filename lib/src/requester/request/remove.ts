// part of dslink.requester;

export class RemoveController  implements RequestUpdater {
  readonly completer: Completer<RequesterUpdate> = new Completer<RequesterUpdate>();
  Promise<RequesterUpdate> get future => completer.future;

  readonly requester: Requester;
  readonly path: string;
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

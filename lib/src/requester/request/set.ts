// part of dslink.requester;

export class SetController  implements RequestUpdater {
  readonly completer: Completer<RequesterUpdate> = new Completer<RequesterUpdate>();
  Promise<RequesterUpdate> get future => completer.future;
  readonly requester: Requester;
  readonly path: string;
  readonly value: object;
  _request: Request;

  SetController(this.requester, this.path, this.value,
      [maxPermission:number = Permission.CONFIG]) {
    var reqMap = <string, dynamic>{
      'method': 'set',
      'path': path,
      'value': value
    };

    if (maxPermission != Permission.CONFIG) {
      reqMap['permit'] = Permission.names[maxPermission];
    }

    _request = requester._sendRequest(reqMap, this);
  }

  onUpdate(status: string, updates: List, columns: List, meta: object, error: DSError) {
    // TODO implement error
    completer.complete(new RequesterUpdate(status));
  }

  void onDisconnect() {}

  void onReconnect() {}
}

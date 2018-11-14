// part of dslink.responder;

typedef ResponseTraceCallback(update: ResponseTrace);

export class ResponseTrace  {
  /// data path for trace
  path: string;
  /// 'list' 'subscribe' 'invoke'
  type: string;

  /// value is + - or blank string
  change: string;

  /// action name, only needed by invoke
  action: string;
  /// rid, only needed by invoke
  rid:number;

//  {'name': 'path', 'type': 'string'},
//  {'name': 'type', 'type': 'string'},
//  {'name': 'rid', 'type': 'number'},
//  {'name': 'action', 'type': 'string'},
//  {'name': 'change', 'type': 'string'},
  List get rowData => [path, type, rid, action, change];

  ResponseTrace(this.path, this.type, this.rid, [this.change = '', this.action]);
}

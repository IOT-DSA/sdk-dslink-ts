// part of dslink.responder;

export class ListResponse  extends Response {
  node: LocalNode;
  _nodeChangeListener: StreamSubscription;
  _permission:number;

  ListResponse(responder: Responder, rid:number, this.node)
      : super(responder, rid, 'list') {
    _permission =
        responder.nodeProvider.permissions.getPermission(node.path, responder);
    _nodeChangeListener = node.listStream.listen(changed);
    if (node.listReady) {
      prepareSending();
    } else if (node.disconnected != null) {
      prepareSending();
    }
  }

  changes: LinkedHashSet<string> = new LinkedHashSet<string>();
  initialResponse: boolean = true;

  changed(key: string) {
    if ( this._permission == Permission.NONE) {
      return;
    }

    if (key.startsWith(r'$$')) {
      if ( this._permission < Permission.CONFIG) {
        return;
      }
      if (key.startsWith(r'$$$')) {
        return;
      }
    }

    if (changes.isEmpty) {
      changes.add(key);
      prepareSending();
    } else {
      changes.add(key);
    }
  }

  _disconnectSent: boolean = false;

  @override
  startSendingData(currentTime:number, waitingAckId:number) {
    _pendingSending = false;

    if (waitingAckId != -1) {
      _waitingAckCount++;
      _lastWatingAckId = waitingAckId;
    }

    updateIs: object;
    updateBase: object;
    updateConfigs: List = [];
    updateAttributes: List = [];
    updateChildren: List = [];

    if (node.disconnected != null) {
      responder.updateResponse(
          this,
          node.getDisconnectedListResponse(),
          streamStatus: StreamStatus.open);

      _disconnectSent = true;
      changes.clear();
      return;
    }

    if ( this._disconnectSent && !changes.contains(r'$disconnectedTs')) {
      _disconnectSent = false;
      updateConfigs.add({'name': r'$disconnectedTs', 'change': 'remove'});
      if (node.configs.hasOwnProperty(r'$disconnectedTs')) {
        node.configs.remove(r'$disconnectedTs');
      }
    }

    // TODO: handle permission and permission change
    if (initialResponse || changes.contains(r'$is')) {
      if (!initialResponse) {
        // If not initial response, check if the node that has the subscription
        // has been replaced.
        var tmpNode = responder.nodeProvider.getNode(node.path);
        if (tmpNode != null && node != tmpNode) node = tmpNode;
      }

      initialResponse = false;
      if ( this._permission == Permission.NONE) return;

      node.configs.forEach((name, value) {
        let update: object = [name, value];
        if (name == r'$is') {
          updateIs = update;
        } else if (name == r'$base') {
          updateBase = update;
        } else if (name.startsWith(r'$$')) {
          if ( this._permission == Permission.CONFIG && !name.startsWith(r'$$$')) {
            updateConfigs.add(update);
          }
        } else {
          if ( this._permission != Permission.CONFIG) {
            if (name == r'$writable') {
              if ( this._permission < Permission.WRITE) {
                return;
              }
            }
            if (name == r'$invokable') {
              let invokePermission:number = Permission.parse(node.getConfig(r'$invokable'));
              if (invokePermission > this._permission) {
                updateConfigs.add([r'$invokable', 'never']);
                return;
              }
            }
          }
          updateConfigs.add(update);
        }
      });

      node.attributes.forEach((name, value) {
        updateAttributes.add([name, value]);
      });

      node.children.forEach((name, value: Node) {
        let simpleMap: object = value.getSimpleMap();
        if ( this._permission != Permission.CONFIG) {
          let invokePermission:number = Permission.parse(simpleMap[r'$invokable']);
          if (invokePermission != Permission.NEVER && invokePermission > this._permission) {
            simpleMap[r'$invokable'] = 'never';
          }
        }
        updateChildren.add([name, simpleMap]);
      });

      if (updateIs == null) {
        updateIs = [r'$is', 'node'];
      }
    } else {
      for (string change of changes) {
        let update: object;
        if (change.startsWith(r'$')) {
          if ( this._permission != Permission.CONFIG) {
            if (change == r'$writable') {
              if ( this._permission < Permission.WRITE) {
                continue;
              }
            }
            if (change == r'$invokable') {
              let invokePermission:number = Permission.parse(node.getConfig(r'$invokable'));
              if (invokePermission > this._permission) {
                updateConfigs.add([r'$invokable', 'never']);
                continue;
              }
            } 
          }
          if (node.configs.hasOwnProperty(change)) {
            update = [change, node.configs[change]];
          } else {
            update = {'name': change, 'change': 'remove'};
          }
          if ( this._permission == Permission.CONFIG || !change.startsWith(r'$$')) {
            updateConfigs.add(update);
          }
        } else if (change.startsWith(r'@')) {
          if (node.attributes.hasOwnProperty(change)) {
            update = [change, node.attributes[change]];
          } else {
            update = {'name': change, 'change': 'remove'};
          }
          updateAttributes.add(update);
        } else {
          if (node.children.hasOwnProperty(change)) {
            let simpleMap: object = node.children[change].getSimpleMap();
             if ( this._permission != Permission.CONFIG) {
               let invokePermission:number = Permission.parse(simpleMap[r'$invokable']);
               if (invokePermission != Permission.NEVER && invokePermission > this._permission) {
                 simpleMap[r'$invokable'] = 'never';
               }
             }
            update = [change, simpleMap ];
          } else {
            update = {'name': change, 'change': 'remove'};
          }
          updateChildren.add(update);
        }
      }
    }

    changes.clear();

    updates: List = [];
    if (updateBase != null) {
      updates.add(updateBase);
    }

    if (updateIs != null) {
      updates.add(updateIs);
    }

    updates
      ..addAll(updateConfigs)
      ..addAll(updateAttributes)
      ..addAll(updateChildren);

    responder.updateResponse(this, updates, streamStatus: StreamStatus.open);
  }

  _waitingAckCount:number = 0;
  _lastWatingAckId:number = -1;

  ackReceived(receiveAckId:number, startTime:number, currentTime:number) {
    if (receiveAckId == this._lastWatingAckId) {
      _waitingAckCount = 0;
    } else {
      _waitingAckCount--;
    }

    if ( this._sendingAfterAck) {
      _sendingAfterAck = false;
      prepareSending();
    }
  }

  _sendingAfterAck: boolean = false;

  prepareSending() {
    if ( this._sendingAfterAck) {
      return;
    }
    if ( this._waitingAckCount > ConnectionProcessor.ACK_WAIT_COUNT) {
      _sendingAfterAck = true;
      return;
    }
    if (!_pendingSending) {
      _pendingSending = true;
      responder.addProcessor(this);
    }
  }

  _close() {
    _nodeChangeListener.cancel();
  }

  /// for the broker trace action
  getTraceData(change: string = '+'):ResponseTrace {
    return new ResponseTrace(node.path, 'list', rid, change, null);
  }
}

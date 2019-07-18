import {NodeState} from "../node_state";
import {Responder} from "../responder";
import {Response} from "../response";
import {DSA_CONFIG} from "../../common/connection-handler";
import {StreamStatus} from "../../common/interfaces";

export class ListResponse extends Response {
  state: NodeState;

  constructor(responder: Responder, rid: number, state: NodeState) {
    super(responder, rid, 'list');
    this.state = state;
    state.listStream.listen(this.changed);
    if (state._node) {
      this.prepareSending();
    }
  }

  changes: Set<string> = new Set<string>();
  initialResponse = true;

  changed = (key: string) => {
    if (key === null) {
      this.initialResponse = true;
    } else {
      this.changes.add(key);
    }
    if (!this._pendingSending) {
      this.prepareSending();
    }
  };

  startSendingData(currentTime: number, waitingAckId: number) {
    this._pendingSending = false;

    let node = this.state._node;

    if (waitingAckId !== -1) {
      this._waitingAckCount++;
      this._lastWatingAckId = waitingAckId;
    }


    let updates: any[] = [];

    if (!node) {
      updates.push(['$disconnectedTs', this.state._disconnectedTs]);
    } else {
      let updateIs: any;
      let updateBase: any;
      let updateConfigs: any[] = [];
      let updateAttributes: any[] = [];
      let updateChildren: any[] = [];

      if (this.initialResponse || this.changes.has('$is')) {

        this.initialResponse = false;

        for (let [name, value] of node.configs) {
          let update: object = [name, value];
          if (name === '$is') {
            updateIs = update;
          } else if (name === '$base') {
            updateBase = update;
          } else {
            updateConfigs.push(update);
          }
        }
        for (let [name, value] of node.attributes) {
          updateAttributes.push([name, value]);
        }
        for (let [name, value] of node.children) {
          let simpleMap: object = value.getSimpleMap();
          updateChildren.push([name, simpleMap]);
        }

        if (updateIs == null) {
          updateIs = ['$is', 'node'];
        }
      } else {
        for (let change of this.changes) {
          let update: object;
          if (change.startsWith('$')) {
            if (node.configs.has(change)) {
              update = [change, node.configs.get(change)];
            } else {
              update = {'name': change, 'change': 'remove'};
            }
            updateConfigs.push(update);
          } else if (change.startsWith('@')) {
            if (node.attributes.has(change)) {
              update = [change, node.attributes.get(change)];
            } else {
              update = {'name': change, 'change': 'remove'};
            }
            updateAttributes.push(update);
          } else {
            if (node.children.has(change)) {
              let simpleMap: object = node.children.get(change).getSimpleMap();
              update = [change, simpleMap];
            } else {
              update = {'name': change, 'change': 'remove'};
            }
            updateChildren.push(update);
          }
        }
      }

      if (updateBase != null) {
        updates.push(updateBase);
      }

      if (updateIs != null) {
        updates.push(updateIs);
      }
      updates = updates.concat(updateConfigs).concat(updateAttributes).concat(updateChildren);
    }

    this.changes.clear();

    this.responder.updateResponse(this, updates, {streamStatus: "open"});
  }

  _waitingAckCount: number = 0;
  _lastWatingAckId: number = -1;

  ackReceived(receiveAckId: number, startTime: number, currentTime: number) {
    if (receiveAckId === this._lastWatingAckId) {
      this._waitingAckCount = 0;
    } else {
      this._waitingAckCount--;
    }

    if (this._sendingAfterAck) {
      this._sendingAfterAck = false;
      this.prepareSending();
    }
  }

  _sendingAfterAck: boolean = false;

  prepareSending() {
    if (this._sendingAfterAck) {
      return;
    }
    if (this._waitingAckCount > DSA_CONFIG.ackWaitCount) {
      this._sendingAfterAck = true;
      return;
    }
    if (!this._pendingSending) {
      this._pendingSending = true;
      this.responder.addProcessor(this);
    }
  }

  _close() {
    this.state.listStream.unlisten(this.changed);
  }
}

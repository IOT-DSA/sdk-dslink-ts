import {ConnectionProcessor, DSError, StreamStatus} from "../common/interfaces";
import {Responder} from "./responder";

export class Response implements ConnectionProcessor {
  readonly responder: Responder;
  readonly rid: number;
  type: string;
  _sentStreamStatus: string = StreamStatus.initialize;

  get sentStreamStatus(): string {
    return this._sentStreamStatus;
  }

  constructor(responder: Responder, rid: number, type ?: string) {
    this.responder = responder;
    this.rid = rid;
    this.type = type;
  }

  /// close the request from responder side and also notify the requester
  close(err: DSError = null) {
    this._sentStreamStatus = StreamStatus.closed;
    this.responder.closeResponse(this.rid, this, err);
  }

  /// close the response now, no need to send more response update
  _close() {
  }

  prepareSending() {
    if (!this._pendingSending) {
      this._pendingSending = true;
      this.responder.addProcessor(this);
    }
  }

  _pendingSending: boolean = false;

  startSendingData(currentTime: number, waitingAckId: number) {
    this._pendingSending = false;
  }

  ackReceived(receiveAckId: number, startTime: number, currentTime: number) {
    // TODO: implement ackReceived
  }
}

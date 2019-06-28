import { NodeState } from "../node_state";
import { Responder } from "../responder";
import { Response } from "../response";
export declare class ListResponse extends Response {
    state: NodeState;
    constructor(responder: Responder, rid: number, state: NodeState);
    changes: Set<string>;
    initialResponse: boolean;
    changed: (key: string) => void;
    startSendingData(currentTime: number, waitingAckId: number): void;
    _waitingAckCount: number;
    _lastWatingAckId: number;
    ackReceived(receiveAckId: number, startTime: number, currentTime: number): void;
    _sendingAfterAck: boolean;
    prepareSending(): void;
    _close(): void;
}

import {DSError} from "../common/interfaces";

export interface RequestUpdater {
  onUpdate(status: string, updates: any[], columns: any[], meta: { [key: string]: any }, error: DSError): void;

  onDisconnect(): void;

  onReconnect(): void;
}

export class RequesterUpdate {
  readonly streamStatus: string;

  constructor(streamStatus: string) {
    this.streamStatus = streamStatus;
  }
}
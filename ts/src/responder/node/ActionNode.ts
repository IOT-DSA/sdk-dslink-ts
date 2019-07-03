import {LocalNode, NodeProvider} from "../node_state";
import {Permission} from "../../common/permission";
import {Responder} from "../responder";
import {InvokeResponse} from "../response/invoke";
import {DSError, StreamStatus} from "../../common/interfaces";
import {Table} from "../../common/table";

export class ActionNode extends LocalNode {
  constructor(path: string, provider: NodeProvider, profileName: string = 'node', invokable = Permission.WRITE) {
    super(path, provider, profileName);
    this.setConfig('$invokable', Permission.names[invokable]);
  }

  onInvoke(params: {[key: string]: any}): any {

  }

  /// Called by the link internals to invoke this node.
  invoke(
    params: {[key: string]: any},
    responder: Responder,
    response: InvokeResponse,
    parentNode: LocalNode, maxPermission: number = Permission.CONFIG) {

    let rslt: any;
    try {
      rslt = this.onInvoke(params);
    } catch (err) {
      let error = new DSError("invokeException", {msg: String(err)});
      response.close(error);
      return response;
    }

    let rtype = "values";
    if (this.configs.has("$result")) {
      rtype = this.configs.get("$result");
    }

    if (rslt == null) {
      // Create a default result based on the result type
      if (rtype === "values") {
        rslt = {};
      } else if (rtype === "table") {
        rslt = [];
      } else if (rtype === "stream") {
        rslt = [];
      }
    }

    if (Array.isArray((rslt))) {
      response.updateStream(rslt, {streamStatus: StreamStatus.closed});
    } else if (rslt != null && rslt instanceof Object) {
      let columns: any[] = [];
      let out: any[] = [];
      for (let x of rslt) {
        columns.push({
          "name": x,
          "type": "dynamic"
        });
        out.push(rslt[x]);
      }

      response.updateStream([out], {columns, streamStatus: StreamStatus.closed});
    } else if (rslt instanceof Table) {
      response.updateStream(rslt.rows,
        {columns: rslt.columns, streamStatus: StreamStatus.closed});
    } else {
      response.close();
    }
  }
}

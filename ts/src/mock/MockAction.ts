import {BaseLocalNode} from "../responder/base-local-node";
import {InvokeResponse} from "../responder/response/invoke";
import {Permission} from "../common/permission";
import {DsError} from "../common/interfaces";
import {LocalNode} from "../responder/node_state";

export class MockActionNode extends BaseLocalNode {

  onInvoke: (params: {[key: string]: any}) => any;

  invoke(
    params: {[key: string]: any},
    response: InvokeResponse,
    parentNode: LocalNode, maxPermission: number = Permission.CONFIG) {
    if (this.onInvoke) {
      let rslt = this.onInvoke(params);
      if (Array.isArray((rslt))) {
        response.updateStream(rslt);
      } else if (rslt != null && rslt.__proto__ === Object.prototype) {
        let columns: any[] = [];
        let out: any[] = [];
        for (let x in rslt) {
          columns.push({
            "name": x,
            "type": "dynamic"
          });
          out.push(rslt[x]);
        }
        response.updateStream([out], {columns});
      }
    } else {
      response.close(DsError.NOT_IMPLEMENTED);
    }
  }

  shouldSaveConfig(key: string) {
    return true;
  }

  load(data: {[p: string]: any}) {
    super.load(data);
    if (typeof data['?invoke'] === 'function') {
      this.onInvoke = data['?invoke'];
    }
  }
}
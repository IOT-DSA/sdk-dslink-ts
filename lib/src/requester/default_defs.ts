// part of dslink.requester;

// TODO: merge with defaultProfileMap in common lib
import {buildEnumType} from "../../utils";
import {RemoteDefNode, RemoteNode} from "./node_cache";
import {Node} from '../common/node';

export class DefaultDefNodes {
  static readonly _defaultDefs: any = {
    "node": {},
    "static": {},
    "getHistory": {
      "$invokable": "read",
      "$result": "table",
      "$params": [
        {
          "name": "Timerange",
          "type": "string",
          "edito": "daterange"
        },
        {
          "name": "Interval",
          "type": "enum",
          "default": "none",
          "edito": buildEnumType([
            "default",
            "none",
            "1Y",
            "3N",
            "1N",
            "1W",
            "1D",
            "12H",
            "6H",
            "4H",
            "3H",
            "2H",
            "1H",
            "30M",
            "15M",
            "10M",
            "5M",
            "1M",
            "30S",
            "15S",
            "10S",
            "5S",
            "1S"
          ])
        },
        {
          "name": "Rollup",
          "default": "none",
          "type": buildEnumType([
            "none",
            "avg",
            "min",
            "max",
            "sum",
            "first",
            "last",
            "count",
            "delta"
          ])
        }
      ],
      "$columns": [
        {
          "name": "timestamp",
          "type": "time"
        },
        {
          "name": "value",
          "type": "dynamic"
        }
      ]
    }
  };

  static readonly nameMap: { [key: string]: Node } = (function () {
    let rslt: { [key: string]: Node } = {};
    for (let k in DefaultDefNodes._defaultDefs) {
      let m: any = DefaultDefNodes._defaultDefs[k];
      let path = `/defs/profile/${k}`;
      let node: RemoteDefNode = new RemoteDefNode(path);

      for (let n in m) {
        let v: any = DefaultDefNodes._defaultDefs[k];

        if (n.startsWith('$')) {
          node.configs.set(n, v);
        } else if (n.startsWith('@')) {
          node.attributes.set(n, v);
        }
      }
      node.listed = true;
      rslt[k] = node;
    }
    return rslt;
  })();

  static readonly pathMap: { [key: string]: Node } = (function () {
    let rslt: { [key: string]: Node } = {};
    for (let k in DefaultDefNodes.nameMap) {
      let node = DefaultDefNodes.nameMap[k];
      if (node instanceof RemoteNode) {
        rslt[node.remotePath] = node;
      }
    }
    return rslt;
  })();
}

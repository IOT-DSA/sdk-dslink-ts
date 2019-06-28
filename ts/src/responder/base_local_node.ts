import {LocalNode} from "./node_state";
import {Responder} from "./responder";
import {Response} from "./response";
import {Permission} from "../common/permission";
import {Path} from "../common/node";

export class BaseLocalNode extends LocalNode {

  createChild(name: string, cls: typeof LocalNode, ...args: any[]) {
    let childPath = Path.concat(this.path, name);
    let childNode = new cls(childPath, this.provider, ...args);
    this.addChild(name, childNode);
  }

  save(): {[key: string]: any} {
    let data = {};
    this.saveConfigs(data);
    this.saveAttributes(data);
    this.saveChildren(data);
    return data;
  }

  saveChildren(data: {[key: string]: any}) {
    for (let [key, value] of this.children) {
      if (value instanceof LocalNode) {
        let saved = value.save();
        if (saved) {
          data[key] = saved;
        }
      }
    }
  }

  saveAttributes(data: {[key: string]: any}) {
    for (let [key, value] of this.attributes) {
      data[key] = value;
    }
  }

  shouldSaveConfig(key: string) {
    return false;
  }

  saveConfigs(data: {[key: string]: any}) {
    for (let [key, value] of this.configs) {
      if (this.shouldSaveConfig(key)) {
        data[key] = value;
      }
    }
  }

  load(data: {[key: string]: any}) {
    for (let key in data) {
      if (key === '') continue;
      switch (key.charCodeAt(0)) {
        case 64 : /* @ */
          this.attributes.set(key, data[key]);
          continue;
        case 36 : /* $ */
          if (this.shouldSaveConfig(key)) {
            this.configs.set(key, data[key]);
          }
          continue;
        case 63 : /* ? */
          continue;
        default:
          if (data instanceof Object) {
            let child = this.loadChild(key, data);
            if (child) {
              this.addChild(key, child);
            }
          }
      }
    }
  }

  loadChild(key: string, data: {[key: string]: any}): LocalNode {
    // create node and load data here
    return null;
  }
}
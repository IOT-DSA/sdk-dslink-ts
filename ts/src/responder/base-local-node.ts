import {LocalNode} from './node_state';
import {Responder} from './responder';
import {Response} from './response';
import {Permission} from '../common/permission';
import {Path} from '../common/node';

export class BaseLocalNode extends LocalNode {
  createChild(name: string, cls: typeof LocalNode, ...args: any[]): LocalNode {
    let childPath = Path.concat(this.path, name);
    // @ts-ignore
    let childNode = new cls(childPath, this.provider, ...args);
    this.addChild(name, childNode);
    return childNode;
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
    return key === '$is';
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
        case 64 /* @ */:
          this.attributes.set(key, data[key]);
          continue;
        case 36 /* $ */:
          if (this.shouldSaveConfig(key)) {
            this.configs.set(key, data[key]);
          }
          continue;
        case 63 /* ? */:
          continue;
        default:
          let childData = data[key];
          if (childData instanceof Object) {
            this.loadChild(key, childData);
          }
      }
    }
  }

  /**
   * load data into existing child
   * or create new child
   */
  loadChild(key: string, data: {[key: string]: any}) {
    let child = this.children.get(key);
    if (child instanceof BaseLocalNode) {
      // load data to existing child
      child.load(data);
    }
    // default implementation doesn't know how to create a new child
  }
}

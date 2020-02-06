import {BaseLocalNode} from '../base-local-node';

export class StaticNode extends BaseLocalNode {
  profileName = 'static';

  loadChild(key: string, data: {[p: string]: any}) {
    let childNode = new StaticNode(`${this.path}/${key}`, this.provider);
    childNode.load(data);
    this.addChild(key, childNode);
  }
  shouldSaveConfig(key: string) {
    return true;
  }
  save(): {[key: string]: any} {
    return null;
  }
}

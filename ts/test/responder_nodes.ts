import {ActionNode} from "../src/responder/node/ActionNode";
import {ValueNode} from "../src/responder/node/ValueNode";
import {RootNode} from "../src/responder/node/RootNode";
import {NodeProvider} from "../src/responder/node_state";
import {Permission} from "../src/common/permission";

class TestActionNode extends ActionNode {
  constructor(path: string, provider: NodeProvider) {
    super(path, provider, 'myaction', Permission.READ);
  }

  initialize() {
    this.setConfig('$params', [{name: 'value', type: 'number'}]);
    this.setConfig('$columns', [{name: 'c1', type: 'number'}, {name: 'c2', type: 'string'}]);
  }

  onInvoke(params: {[key: string]: any}) {
    return {c1: params['value'], c2: 'str'};
  }
}

class TestValueNode extends ValueNode {
  constructor(path: string, provider: NodeProvider) {
    super(path, provider, 'myvalue', 'number', Permission.WRITE);
    this._value = 123;
  }

  initialize() {
    this.setConfig('$hello', 'world');
    this.createChild('b', TestActionNode);
  }
}

export class TestRootNode extends RootNode {
  val: TestValueNode;

  initialize() {
    this.setConfig('$hello', 'world');
    this.val = this.createChild('val', TestValueNode) as TestValueNode;
  }
}
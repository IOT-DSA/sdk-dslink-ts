import {ActionNode} from "../src/responder/node/ActionNode";
import {ValueNode} from "../src/responder/node/ValueNode";
import {RootNode} from "../src/responder/node/RootNode";
import {NodeProvider} from "../src/responder/node_state";
import {Permission} from "../src/common/permission";

class TestActionNode extends ActionNode {
  constructor(path: string, provider: NodeProvider) {
    super(path, provider, 'testaction', Permission.READ);
  }

  initialize() {
    this.setConfig('$params', [{name: 'value', type: 'number'}]);
    this.setConfig('$columns', [{name: 'c1', type: 'number'}, {name: 'c2', type: 'string'}]);
  }

  onInvoke(params: {[key: string]: any}) {
    let input = params['value'];
    return {c1: Number(input), c2: String(input)};
  }
}

export class TestValueNode extends ValueNode {
  constructor(path: string, provider: NodeProvider) {
    super(path, provider, 'testvalue', 'number', Permission.WRITE);
    this._value = 123;
  }

  initialize() {
    this.setConfig('$config1', 'hello');
    this.createChild('valAct', TestActionNode);
  }
}

export class TestRootNode extends RootNode {
  val: TestValueNode;
  action: TestActionNode;

  initialize() {
    this.val = this.createChild('val', TestValueNode) as TestValueNode;
    this.action = this.createChild('act', TestActionNode) as TestActionNode;
  }
}
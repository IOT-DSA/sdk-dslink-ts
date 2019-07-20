import {ActionNode} from "../../src/responder/node/action-node";
import {ValueNode} from "../../src/responder/node/value-node";
import {RootNode} from "../../src/responder/node/root-node";
import {NodeProvider, Subscriber} from "../../src/responder/node_state";
import {Permission} from "../../src/common/permission";

class TestActionNode extends ActionNode {
  static profileName = 'testaction';

  constructor(path: string, provider: NodeProvider) {
    super(path, provider, Permission.READ);
  }

  initialize() {
    this.setConfig('$params', [{name: 'value', type: 'number'}]);
    this.setConfig('$columns', [{name: 'c1', type: 'number'}, {name: 'c2', type: 'string'}]);
  }

  onInvoke(params: {[key: string]: any}): any {
    let input = params['value'];
    return {c1: Number(input), c2: String(input)};
  }
}

export class TestValueNode extends ValueNode {
  static profileName = 'testvalue';
  static saveNodeOnChange = true;

  constructor(path: string, provider: NodeProvider) {
    super(path, provider, 'number', Permission.WRITE);
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
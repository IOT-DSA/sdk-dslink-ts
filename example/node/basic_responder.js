// const { DSLink, RootNode, ValueNode, ActionNode, Permission} = require("dslink-js");
const { DSLink, RootNode, ValueNode, ActionNode, Permission} = require("../../js/node");

class MyActionNode extends ActionNode {
  constructor(path, provider) {
    super(path, provider, 'myaction', Permission.READ);
  }

  initialize() {
    this.setConfig('$params', [{name: 'value', type: 'number'}]);
    this.setConfig('$columns', [{name: 'c1', type: 'number'}, {name: 'c2', type: 'string'}]);
  }

  onInvoke(params) {
    let input = params['value'];
    return {c1: Number(input), c2: String(input)};
  }
}

class MyValueNode extends ValueNode {
  constructor(path, provider) {
    super(path, provider, 'myvalue', 'number', Permission.WRITE);
    this._value = 123;
  }

  initialize() {
    this.createChild('b', MyActionNode);
  }
}

class MyRootNode extends RootNode {
  initialize() {
    this.setConfig('$hello', 'world');
    this.createChild('a', MyValueNode);
  }
}

async function main() {
  let link = new DSLink('http://localhost:8080/conn', 'test-', {
    isRequester: true,
    rootNode: new MyRootNode(),
    format: 'json'
  });
  await link.connect();
}

main();
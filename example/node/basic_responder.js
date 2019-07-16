// const { DSLink, RootNode, ValueNode, ActionNode, Permission} = require("dslink");
const {DSLink, RootNode, ValueNode, ActionNode, Permission} = require("../../js/node");

class MyRootNode extends RootNode {
  initialize() {
    // create children nodes here
    this.createChild('a', MyValueNode);
  }
}

class MyValueNode extends ValueNode {
  constructor(path, provider) {
    super(path, provider, 'myvalue', 'number', Permission.WRITE);
    this._value = 123;
  }

  initialize() {
    // set configs
    this.setConfig('$hello', 'world');
    // create a child action
    this.createChild('b', MyActionNode);
  }
}

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

async function main() {
  let link = new DSLink('test',
    {rootNode: new MyRootNode()},
    // ['-b', 'http://localhost:8080/conn'] /* overwrite command line options */
  );

  await link.connect();
}

main();

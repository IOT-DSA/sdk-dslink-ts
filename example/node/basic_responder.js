const {NodeProvider} = require("../../js/src/responder/node_state");
const {Permission} = require("../../js/src/common/permission");

const {BaseLocalNode} = require("../../js/src/responder/base_local_node");
const {HttpClientLink: DSLink, RootNode, ValueNode, ActionNode} = require("../../js/src/http/client_link");
const {PrivateKey} = require("../../js/src/crypto/pk");

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
  let key = PrivateKey.loadFromString('M6S41GAL0gH0I97Hhy7A2-icf8dHnxXPmYIRwem03HE');
  let link = new DSLink('http://localhost:8080/conn', 'test-', key, {
    isRequester: true,
    rootNode: new MyRootNode(),
    format: 'json'
  });
  await link.connect();
  console.log('connected');
}

main();
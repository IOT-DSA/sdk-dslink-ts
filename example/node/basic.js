const {NodeProvider} = require( "../../js/src/responder/node_state");
const {Permission} = require( "../../js/src/common/permission");

const {BaseLocalNode} = require("../../js/src/responder/base_local_node");
const {HttpClientLink: DSLink, RootNode, ValueNode} = require("../../js/src/http/client_link");
const {PrivateKey} = require("../../js/src/crypto/pk");

class MyValueNode extends ValueNode {
  constructor(path, provider) {
    super(path, provider, 'myvalue', 'number', Permission.WRITE);
    this._value = 123;
  }

  initialize() {
    this.setConfig('$hello', 'world');
  }
}

class MyRootNOde extends RootNode {
  initialize() {
    this.setConfig('$hello', 'world');
    this.createChild('a', MyValueNode);
  }
}

async function main() {
  let key = PrivateKey.loadFromString('M6S41GAL0gH0I97Hhy7A2-icf8dHnxXPmYIRwem03HE');
  let link = new DSLink('http://localhost:8080/conn', 'test-', key, {
    isRequester: true,
    rootNode: new MyRootNOde(),
    format: 'json'
  });
  await link.connect();
  console.log('connected');

  let {requester} = link;

  console.log(await requester.subscribeOnce('/sys/dataOutPerSecond'));

  console.log(
    (await requester.listOnce('/sys'))
      .children.size
  );

  console.log(
    (await requester.invokeOnce('/sys/get_server_log', {lines: 5}))
      .result.log
  );
}

main();
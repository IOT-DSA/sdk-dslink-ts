// const { DSLink, RootNode, ValueNode, Permission} = require("dslink");
const {DSLink, RootNode, ValueNode, Permission} = require("../../../js/node");


class MyValueNode extends ValueNode {
  constructor(path, provider) {
    super(path,          // pass path to base class
      provider,          // pass provider to base class
      'myvalue',         // $is = myvalue
      'number',          // value type
      Permission.WRITE,  // minimal permission required to set the value (optional)
      true               // save the node value during serialization (optional)
    );
    this._value = 32;
  }

  // override changeValue to validate the value
  onValueChange(newValue) {
    if (typeof newValue === 'number' && newValue >= 0 && newValue < 100) {
      return super.onValueChange(newValue);
    }
    throw new Error('value not allowed');
  }
}


async function main() {
  let rootNode = new RootNode();
  rootNode.createChild('value', MyValueNode);
  let link = new DSLink('responder', {rootNode, saveNodes: true});
  await link.connect();
}

main();

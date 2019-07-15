# sdk-dslink-ts
typescript/javascript sdk for DSA protocol

<a href='https://travis-ci.org/IOT-DSA/sdk-dslink-ts'><img src="https://travis-ci.org/IOT-DSA/sdk-dslink-ts.svg?branch=master" title="travis-ci"></a>
<a href='https://coveralls.io/github/IOT-DSA/sdk-dslink-ts'><img src='https://coveralls.io/repos/github/IOT-DSA/sdk-dslink-ts/badge.svg?branch=master&service=github&cache=0' title="coveralls"/></a>

```javascript
const { DSLink, RootNode, ValueNode, ActionNode, Permission} = require("dslink-js");

class MyValueNode extends ValueNode {
  constructor(path, provider) {
    super(path, provider, 'myvalue', 'number', Permission.WRITE);
    this._value = 123;
  }
}

class MyRootNode extends RootNode {
  initialize() {
    this.createChild('a', MyValueNode);
  }
}

async function main() {
  let link = new DSLink('mydslink', {rootNode: new MyRootNode()});
  await link.connect();
}

main();

```
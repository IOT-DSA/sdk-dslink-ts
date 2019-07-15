# sdk-dslink-ts
typescript/javascript sdk for DSA protocol

<a href='https://travis-ci.org/IOT-DSA/sdk-dslink-ts'><img src="https://travis-ci.org/IOT-DSA/sdk-dslink-ts.svg?branch=master" title="travis-ci"></a>
<a href='https://coveralls.io/github/IOT-DSA/sdk-dslink-ts'><img src='https://coveralls.io/repos/github/IOT-DSA/sdk-dslink-ts/badge.svg?branch=master&service=github&cache=0' title="coveralls"/></a>


JavaScript SDK for the DSA protocol.

## Install

`npm install dslink --save` or `yarn add dslink`

## Example

A sample dslink with a basic value node at the path /value

```javascript
const { DSLink, RootNode, ValueNode} = require("dslink");

class MyValueNode extends ValueNode {
  constructor(path, provider) {
    super(path, provider, 'myvalue', 'number');
    this._value = 123;
  }
}

class MyRootNode extends RootNode {
  initialize() {
    this.createChild('value', MyValueNode);
  }
}

async function main() {
  let link = new DSLink('mydslink', {rootNode: new MyRootNode()});
  await link.connect();
}

main();

```
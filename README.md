# sdk-dslink-ts
JavaScript / Typescript SDK for the DSA protocol.

<a href='https://travis-ci.org/IOT-DSA/sdk-dslink-ts'><img src="https://travis-ci.org/IOT-DSA/sdk-dslink-ts.svg?branch=master" title="travis-ci"></a>
<a href='https://coveralls.io/github/IOT-DSA/sdk-dslink-ts'><img src='https://coveralls.io/repos/github/IOT-DSA/sdk-dslink-ts/badge.svg?branch=master&service=github&cache=0' title="coveralls"/></a>


Version 2.0 of this sdk is re-written with typescript and is **NOT** backward compatible with the DSA javascript sdk 1.x.

## Install

`npm install dslink --save` <br>
or <br>
`yarn add dslink` <br>

## Use Typescript

To compile with dslink sdk's typescript definition, make sure `esModuleInterop` flag is true in typescript [compilerOptions](https://www.typescriptlang.org/docs/handbook/compiler-options.html).

## Install DsLink on broker

You can zip a javascript dslink and install it on dglux-server.

[A working example](https://github.com/IOT-DSA/template-dslink-javascript)

## Javascript Example

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

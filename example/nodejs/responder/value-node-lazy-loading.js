// const { DSLink, RootNode, ValueNode, Permission} = require("dslink");
const {DSLink, RootNode, ValueNode, Permission} = require("../../../js/node");

class LazyLoadValue extends ValueNode {
  constructor(path, provider) {
    super(path,          // pass path to base class
      provider,          // pass provider to base class
      'lazyLoad',       // $is = lazyLoad
      'string',         // value type
    );
    // do not set value here
  }

  onSubscribe(subscriber) {
    if (subscriber) {
      // load the value only when there is a subscriber
      this.setValue('ready');
    }
  }
}


async function main() {
  let rootNode = new RootNode();
  rootNode.createChild('lazy', LazyLoadValue);
  let link = new DSLink('responder', {rootNode, saveNodes: true});
  await link.connect();
}

main();

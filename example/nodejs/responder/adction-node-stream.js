// const { DSLink, RootNode, ActionNode, Permission} = require("dslink");

const {DSLink, RootNode, ActionNode, Permission, Table, DsError} = require("../../../js/node");


class StreamActionNode extends ActionNode {
  constructor(path, provider) {
    super(path, provider);
  }

  initialize() {
    // let requester know the result could be a stream
    this.setConfig('$result', 'stream');
    // output structure
    this.setConfig('$columns', [{name: 'output', type: 'string'}]);
  }

  // override the raw invoke method instead of onInvoke
  invoke(params, response) {
    // the requester won't receive update when status is initialize
    response.updateStream([[0]], {streamStatus: 'initialize'});

    setTimeout(() => {
      // requester callback will be called only when it receive the first open status
      response.updateStream([[1], [2], [3]], {streamStatus: 'open'});
    }, 1000);

    setTimeout(() => {
      response.updateStream([[4], [5], [6]], {streamStatus: 'open'});
    }, 2000);

    setTimeout(() => {
      // stream must be closed, otherwise it will cause memory leak on both requester and responder
      response.updateStream([[7], [8], [9]], {streamStatus: 'closed'});
    }, 3000);
  }
}


async function main() {
  let rootNode = new RootNode();
  rootNode.createChild('streamAction', StreamActionNode);
  let link = new DSLink('responder', {rootNode});
  await link.connect();
}

main();

// const { DSLink, RootNode, ActionNode, Permission} = require("dslink");
const {DSLink, BaseLocalNode, RootNode, ActionNode, Permission, Table, DsError} = require("../../js/node");

class ChildNode extends BaseLocalNode {

  initialize() {
    // actions to add remove nodes
    this.createChild('add', AddChildAction);
    if (this.path !== '/main') {
      this.createChild('remove', RemoveSelfAction);
    }
  }

  loadChild(name, data) {
    // create nodes during deserialization
    if (!this.children.has(name)) {
      if (data['$is'] === ChildNode.profileName) {
        let node = this.createChild(name, ChildNode);
        node.load(data);
      }
    }
  }
}

// profile name, need this to make sure the nodes loaded from deserialization is the type we need
ChildNode.profileName = 'childNode';
// save nodes whenever there is a change
ChildNode.saveNodeOnChange = true;

class AddChildAction extends ActionNode {

  initialize() {
    // input parameters
    this.setConfig('$params', [{name: 'name', type: 'string'}]);
  }

  onInvoke(params, parentNode) {
    let {name} = params;
    if (parentNode.children.has(name)) {
      return new DsError('invalidInput', {msg: 'child name already used'});
    }
    parentNode.createChild(name, ChildNode);
  }
}

class RemoveSelfAction extends ActionNode {
  onInvoke(params, parentNode) {
    parentNode.provider.removeNode(parentNode.path);
  }
}

async function main() {
  let rootNode = new RootNode();
  rootNode.createChild('main', ChildNode);
  let link = new DSLink('responder', {rootNode, saveNodes: true});
  await link.connect();
}

main();

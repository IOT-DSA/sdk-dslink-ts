// const { DSLink, RootNode, ActionNode, Permission} = require("dslink");
const {DSLink, BaseLocalNode, RootNode, ActionNode, Permission, Table, DsError} = require("../../js/node");

class ChildNode extends BaseLocalNode {

  initialize() {
    this.createChild('add', AddChildAction);
    if (this.path !== '/main') {
      this.createChild('remove', RemoveSelfAction);
    }
  }

  loadChild(name, data) {
    if (!this.children.has(name)) {
      if (data['$is'] === ChildNode.profileName) {
        let node = this.createChild(name, ChildNode);
        node.load(data);
      }
    }
  }
}

ChildNode.profileName = 'childNode';
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

// action that returns a table
class TableActionNode extends ActionNode {
  constructor(path, provider) {
    super(path, provider, Permission.READ);
  }

  initialize() {
    // let requester know the result could be more than one row
    this.setConfig('$result', 'table');
    // input parameters (optional)
    this.setConfig('$params', [{name: 'input', type: 'number'}]);
    // output structure
    this.setConfig('$columns', [{name: 'output', type: 'number'}]);
  }

  onInvoke(params) {
    let {input} = params;
    return [[input], [input * input]];
  }
}

// action that doesn't have a known column structure until invoked
class DynamicTableAction extends ActionNode {
  constructor(path, provider) {
    super(path, provider, Permission.READ);
  }

  initialize() {
    // let requester know the result could be more than one row
    this.setConfig('$result', 'table');
    // input parameters (optional)
    this.setConfig('$params', [{name: 'name', type: 'string', placeholder: 'name of result column'}]);

    // output structure unknown, don't set $column
  }

  onInvoke(params) {
    let {name} = params;
    // return a table that has dynamic structure
    return Table.parse(
      [{name: name, type: 'number'}], // columns with a dynamic column name
      [  // rows
        [1],
        [2]
      ]
    );
  }
}

async function main() {
  let rootNode = new RootNode();
  rootNode.createChild('main', ChildNode);
  let link = new DSLink('responder', {rootNode, saveNodes: true});
  await link.connect();
}

main();

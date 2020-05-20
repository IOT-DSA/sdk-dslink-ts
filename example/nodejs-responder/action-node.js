// const { DSLink, RootNode, ActionNode, Permission} = require("dslink");

const {DSLink, RootNode, ActionNode, Permission, Table, DsError} = require("../../js/node");

// basic action
class BasicActionNode extends ActionNode {
  constructor(path, provider) {
    super(path, provider,
      Permission.READ // require read permission to invoke (optional, default is Permission.WRITE)
    );
  }

  initialize() {
    // input parameters (optional)
    this.setConfig('$params', [{name: 'input', type: 'map'}]);
    // output structure
    this.setConfig('$columns', [{name: 'output1', type: 'map'},{name: 'output2', type: 'array'}]);
  }

  onInvoke(params) {
    let {input} = params;
      return [[input,[{a:1},{a:2}]]];
  }
}

// action that returns a table
class TableActionNode extends ActionNode {

  initialize() {
    // let requester know the result could be more than one row
    this.setConfig('$result', 'table');
    // input parameters (optional)
    this.setConfig('$params', [{name: 'input', type: 'array'}]);
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

  initialize() {
    // let requester know the result could be more than one row
    this.setConfig('$result', 'table');
    // input parameters (optional)
    this.setConfig('$params', [{name: 'name', type: 'string', hint: 'name of result column'}]);

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
  rootNode.createChild('inputMustBe3', BasicActionNode);
  rootNode.createChild('getTable', TableActionNode);
  rootNode.createChild('dynamicTable', DynamicTableAction);
  let link = new DSLink('responder', {rootNode});
  await link.connect();
}

main();

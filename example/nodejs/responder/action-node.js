// const { DSLink, RootNode, ActionNode, Permission} = require("dslink");

const {DSLink, RootNode, ActionNode, Permission, Table, DsError} = require("../../../js/node");


class BasicActionNode extends ActionNode {
  constructor(path, provider) {
    super(path, provider, 'myaction', Permission.READ);
  }

  initialize() {
    // input parameters (optional)
    this.setConfig('$params', [{name: 'input', type: 'number', default: 3}]);
    // output structure
    this.setConfig('$columns', [{name: 'output', type: 'string'}]);
  }

  onInvoke(params) {
    let {input} = params;
    if (input === 3) {
      return [['correct']];
      // also same result can be
      // return {output: 'correct'};
    }
    return new DsError('invalidInput', {msg: 'value must be 3'});
  }
}

class TableActionNode extends ActionNode {
  constructor(path, provider) {
    super(path, provider, 'myaction', Permission.READ);
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

class DynamicTableAction extends ActionNode {
  constructor(path, provider) {
    super(path, provider, 'myaction', Permission.READ);
  }

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

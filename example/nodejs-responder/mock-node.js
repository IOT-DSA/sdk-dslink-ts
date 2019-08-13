const {DSLink, BaseLocalNode, RootNode, ActionNode, Permission, Table, DsError} = require("../../js/node");
const {MockNode} = require("../../js/src/mock/MockNode");

const mockData = {
  writableValue: {
    '?value': 'hello',
    '$type': 'string',
    '$writable': 'write',
  },
  dynamicValue: {
    '?value': () => Math.random() * 30 + 40,
    '@unit': '°F',
    '$type': 'number'
  },
  tableAction: {
    '$invokable': 'read',
    '$result': 'table',
    "$columns": [
      {"name": "ts", "type": "time"},
      {"name": "value", "type": "number"}
    ],
    '?invoke': (params) => [['2019-08-08T08:00:00Z', 100], ['2019-08-08T09:00:00Z', 200]]
  },
  valueAction: {
    '$invokable': 'read',
    "$params": [
      {"name": "input", "type": "number"}
    ],
    "$columns": [
      {"name": "output", "type": "number"},
    ],
    '?invoke': (params) => {
      return {output: params.input + 1}
    }
  },
  '?repeat': {
    count: 3,
    namePrefix: 'node',
    allowAddReduce: true,
    data: {
      '?value': () => Math.random() * 30 + 40,
      '@unit': '°F',
      '$type': 'number'
    }
  }
};

async function main() {
  // change MockNode's value update interval
  MockNode.interval = 2000;

  let rootNode = new RootNode();
  rootNode.createChild('main', MockNode).load(mockData);
  let link = new DSLink('responder', {rootNode});
  await link.connect();
}

main();

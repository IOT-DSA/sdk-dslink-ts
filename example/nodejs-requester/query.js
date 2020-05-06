// const {DSLink} = require("dslink");
const { DSLink } = require('../../js/node');

const q = {
  '?children': 'live',
  '*': {
    '?value': 'snapshot', '?filter': { 'field': '$type', '=': 'bool' }
  }
};

async function main() {
  let link = new DSLink('requester', { isRequester: true }, [
    '-b',
    'ws://localhost:8181/dsbroker/conn',
    '--log',
    'trace'
  ]);
  await link.connect();

  let { requester } = link;

  requester.query('/local/Package Management/Repositories/0/18', q, (n) => {
    if (n.children.size) {
      console.log(n.children.keys());
    } else {
      console.log('--');
    }

  });
}

main();

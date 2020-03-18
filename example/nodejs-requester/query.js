// const {DSLink} = require("dslink");
const {DSLink} = require('../../js/node');

const q = {
  '?children': 'live',
  'aaa': {
    '?value': 'live'
  }
};

async function main() {
  let link = new DSLink('requester', {isRequester: true}, [
    '-b',
    'ws://localhost:8181/dsbroker/conn',
    '--log',
    'trace'
  ]);
  await link.connect();

  let {requester} = link;

  requester.query('/local/Preference Service/global', q, (n) => console.log([...n.children.keys()].sort()));
}

main();

// const {DSLink} = require("dslink");
const { DSLink } = require('../../js/node');

const q = {
  '?children': 'live',
  '?value': 'live'
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

  requester.query('/local/Preference Service/global/c.d', q, (n) => {
    console.log('update: ' + n.value);
  });
}

main();

// const {DSLink} = require("dslink");
const {DSLink} = require('../../js/node');

const q = {
  '*': {
    '*': {
      '?value': 'snapshot'
    }
  }
};


async function main() {
  let link = new DSLink('requester', {isRequester: true}, ['-b', 'ws://localhost:8181/dsbroker/conn','-l','trace']);
  await link.connect();

  let {requester} = link;

  requester.query('/downstream/services/main/Job service', q, (n) =>
    console.log(n.children.get('Job-1258').children.keys())
  );
}

main();

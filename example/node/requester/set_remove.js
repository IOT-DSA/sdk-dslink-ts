// const {DSLink} = require("dslink");
const {DSLink} = require("../../../js/node");

async function main() {
  let link = new DSLink('test',
    {isRequester: true},
  );
  await link.connect();

  let {requester} = link;

  // set node value
  await requester.set('/data/v1', Math.random());

  // set node attribute
  await requester.set('/data/v1/@att1', Math.random());

  // remove node attribute
  await requester.remove('/data/v1/@att1');
}

main();

// const {DSLink} = require("dslink");
const {DSLink} = require("../../js/node");

async function main() {
  let link = new DSLink('requester',
    {isRequester: true},['--log','trace']
  );
  await link.connect();

  let {requester} = link;

  // list for root node structure once
  console.log((await requester.listOnce('/sys', 1000)));

}

main();

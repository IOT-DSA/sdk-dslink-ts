// const {DSLink} = require("dslink");
const {DSLink} = require("../../js/node");

async function main() {
  let link = new DSLink('testRequester-aa-',
    {isRequester: true},['--broker','http://localhost:8181/dsbroker/conn']
  );
  await link.connect();

  let {requester} = link;

  // list for root node structure once
  console.log((await requester.listOnce('/local/Preference Service/global', 1000)).children);

}

main();

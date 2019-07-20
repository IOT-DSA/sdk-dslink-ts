// const {DSLink} = require("dslink");
const {DSLink} = require("../../js/node");

async function main() {
  let link = new DSLink('requester',
    {isRequester: true},
  );
  await link.connect();

  let {requester} = link;

  // list for root node structure once
  console.log((await requester.listOnce('/')).children);

  // list node and track all the changes in children / configs /attributes
  let sub = requester.list('/data', (update) => {
    // log the name of changed children / configs / attributes
    // initial callback contains the names of everything in the node
    console.log(update.changes);

    // get a config value from the node
    console.log(update.node.getConfig('$is'));
  });
}

main();

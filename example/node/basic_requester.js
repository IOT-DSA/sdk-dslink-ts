// const {DSLink} = require("dslink");
const {DSLink} = require("../../js/node");

async function main() {
  let link = new DSLink('test',
    {isRequester: true},
    // ['-b', 'http://localhost:8080/conn'] /* overwrite command line options */
  );
  await link.connect();

  let {requester} = link;

  // subscribe value
  console.log(await requester.subscribeOnce('/sys/dataOutPerSecond'));

  // list node children
  console.log(
    (await requester.listOnce('/sys'))
      .children.size
  );

  // invoke action
  console.log(
    (await requester.invokeOnce('/sys/get_server_log', {lines: 5}))
      .result.log
  );
}

main();

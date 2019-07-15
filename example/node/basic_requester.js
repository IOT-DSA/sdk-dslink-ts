// const {DSLink, RootNode, ValueNode, ActionNode} = require("dslink-js");
const {DSLink, RootNode, ValueNode, ActionNode} = require("../../js/node");


async function main() {
  let link = new DSLink('test',
    {isRequester: true, format: 'json'},
    ['-b', 'http://localhost:8080/conn'] // overwrite command line options
  );
  await link.connect();

  let {requester} = link;

  console.log(await requester.subscribeOnce('/sys/dataOutPerSecond'));

  console.log(
    (await requester.listOnce('/sys'))
      .children.size
  );

  console.log(
    (await requester.invokeOnce('/sys/get_server_log', {lines: 5}))
      .result.log
  );
}

main();
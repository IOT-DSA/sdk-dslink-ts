// const {DSLink, RootNode, ValueNode, ActionNode} = require("dslink-js");
const {DSLink, RootNode, ValueNode, ActionNode} = require("../../js/node");


async function main() {
  let link = new DSLink('http://localhost:8080/conn', 'test-', {
    isRequester: true,
    format: 'json'
  });
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
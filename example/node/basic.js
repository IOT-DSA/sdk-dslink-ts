const DSLink = require("../../js/src/http/client_link").HttpClientLink;
const {PrivateKey} = require("../../js/src/crypto/pk");

async function main() {
  let key = PrivateKey.loadFromString('M6S41GAL0gH0I97Hhy7A2-icf8dHnxXPmYIRwem03HE');
  let link = new DSLink('http://localhost:8080/conn', 'test-', key, {
    isRequester: true,
    isResponder: false,
    format: 'json'
  });
  await link.connect();

  let {requester} = link;

  console.log(await requester.subscribeOnce('/sys/dataOutPerSecond'));

  console.log(
    (await requester.listOnce('/sys'))
      .children
  );

  console.log(
    (await requester.invokeOnce('/sys/get_server_log', {lines: 5}))
      .result.log
  );
}

main();
// const {DSLink} = require("dslink");
const {DSLink} = require("../../../js/node");
const {sleep} = require("../../../js/src/utils/async");

async function main() {
  let link = new DSLink('requester',
    {isRequester: true},
  );
  await link.connect();

  let {requester} = link;

  // subscribe for the first value
  console.log((await requester.subscribeOnce('/sys/dataOutPerSecond')).value);

  // live subscription
  let sub = requester.subscribe('/sys/dataOutPerSecond', (update) => {
    console.log(update.value); // value
    console.log(update.ts); // timestamp
  });

  // wait 2 seconds
  await sleep(2000);

  // unsubscribe
  sub.close();

  // subscribe with qos 1
  // server maintains a queue and won't drop value as long as requester is connected
  let sub1 = requester.subscribe(
    '/sys/dataOutPerSecond',
    (update) => {
      console.log(update.value);
    },
    1
  );
}

main();

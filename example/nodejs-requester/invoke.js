// const {DSLink} = require("dslink");
const {DSLink} = require("../../js/node");
const {sleep} = require("../../js/src/utils/async");

async function main() {
  let link = new DSLink('requester',
    {isRequester: true},
  );
  await link.connect();

  let {requester} = link;

  // invoke action and get the first response
  console.log(
    (
      await requester.invokeOnce(
        '/sys/get_server_log',
        {lines: 1} // parameters
      )
    ).result.log
  );

  // invoke with a callback, get one or more response
  let invoke = requester.invoke(
    '/sys/get_server_log',
    {lines: 1}, // parameters
    (update) => {
      console.log(update.columns); // column structure
      console.log(update.rows);    // rows
      console.log(update.result);  // convert the first row to a js object, use column names as keys
    }
  );

}

main();

// const {DSLink} = require("dslink");
const {DSLink} = require("../../../js/node");
const {sleep} = require("../../../js/src/utils/async");

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

  let invoke = requester.invoke(
    '/sys/get_server_log',
    {lines: 1}, // parameters
    (update) => {
      console.log(update.columns); // column structure
      console.log(update.rows);    // rows
      console.log(update.result);  // convert the first row to a js object, use column names as keys
    }
  );
  await sleep(1);

  // invoke.close() is not necessary here, since it will be closed by responder automatically
  // but for actions with streaming result, the request must be closed from requester side
  invoke.close();

  // stream multiple requests on the same invoke stream ( only for special usecases )
  // most invoke action don't support request streaming
  // and this is NOT the right way to invoke the same action twice
  let streamInvoke = requester.invoke('/data/publish', {Path: '/data/v1', Value: Math.random()});
  streamInvoke.addReqParams({Path: '/data/v2', Value: Math.random()});

}

main();

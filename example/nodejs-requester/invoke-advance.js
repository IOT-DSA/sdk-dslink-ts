// const {DSLink} = require("dslink");
const {DSLink} = require("../../js/node");
const {sleep} = require("../../js/src/utils/async");

async function main() {
  let link = new DSLink('requester',
    {isRequester: true},
  );
  await link.connect();

  let {requester} = link;

  // stream multiple requests on the same invoke stream ( only for special usecases )
  let streamRequestInvoke = requester.invoke('/data/publish', {Path: '/data/v1', Value: Math.random()});
  // add second request
  streamRequestInvoke.addReqParams({Path: '/data/v2', Value: Math.random()});

  // close the stream since it wont be closed from server side
  streamRequestInvoke.close();

}

main();

// const {DSLink} = require("dslink");
const {DSLink} = require("../../js/node");

async function main() {
  let link = new DSLink('test',
    {isRequester: true},
  );

  link.onConnect.listen(() => {  // use link.onConnect.unlisten to cancel the listener
    console.log('connected from listener');
  });
  link.onDisconnect.listen(() => {  // use link.onDisconnect.unlisten to cancel the listener
    console.log('disconnect from listener');
  });

  await link.connect();

  console.log('connected from await');

  // wait 15 seconds and disconnect
  setTimeout(() => {

    // close the dslink
    // when dslink is disconnected because of server or network error, it will reconnect automaticly
    // but when dslink is closed from client side with close(), it will stop reconnecting

    link.close();

  }, 15000)

}

main();

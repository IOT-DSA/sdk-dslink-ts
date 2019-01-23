const {DSLink} = require('dslink-js/js/web');

let link = new DSLink('ws://localhost:8080/ws', 'json');
link.connect();

let subscription = link.requester.subscribe('/sys/dataOutPerSecond', (data) => {
  console.log(data);
  subscription.close();
});

let list = link.requester.list('/sys', (data) => {
  console.log(data);
});

let invoke = link.requester.invoke('/sys/get_server_log', {lines: 5}, (data) => {
  console.log(data);
});



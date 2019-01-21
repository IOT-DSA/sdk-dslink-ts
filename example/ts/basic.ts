import {BrowserUserLink} from "../../lib/src/browser/browser_user_link";


let link = new BrowserUserLink('ws://192.168.0.9:8080/ws', true, 'json');
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


// make it easy to debug
let global: any = window;
global.link = link;

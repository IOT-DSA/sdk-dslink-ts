import {BrowserUserLink} from "../lib/src/browser/browser_user_link";


let link = new BrowserUserLink('ws://localhost:8080/ws', true, 'json');
link.connect();

let subscription = link.requester.subscribe('/sys/dataOutPerSecond', (data) => {
  console.log(data);
  subscription.cancel();
});

let list = link.requester.list('/sys', (data) => {
  console.log(data);
});

// make it easy to debug
let global: any = window;
global.link = link;
global.subscription = subscription;
global.list = list;
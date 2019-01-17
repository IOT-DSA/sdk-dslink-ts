import {BrowserUserLink} from "../lib/src/browser/browser_user_link";


let link = new BrowserUserLink('ws://localhost:8080/ws', true, 'json');
link.connect();
let global: any = window;
global.subscription = link.requester.subscribe('/sys/dataOutPerSecond', (data) => {
  console.log(data);
});
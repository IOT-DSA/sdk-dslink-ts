import {BrowserUserLink} from "../lib/src/browser/browser_user_link";


let link = new BrowserUserLink('ws://localhost:8080/conn');
link.connect();
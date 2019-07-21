
## Get Started

```javascript
const {DSLink} = require('dslink/js/web');

async function main() {
    let link = new DSLink('ws://localhost:8080/ws', 'json');
    link.connect();

    let {requester} = link;

    console.log(await requester.subscribeOnce('/sys/dataOutPerSecond'));
}

main();
```

## Class Reference
- DSLink is an alias of [[BrowserUserLink]]
- [[Requester]]
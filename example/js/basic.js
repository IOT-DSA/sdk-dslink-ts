// const {DSLink} = require('dslink-js/js/web');
const {DSLink} = require('../../js/web');


async function main() {
    let link = new DSLink('ws://localhost:8080/ws', 'json');
    link.connect();

    let {requester} = link;

    console.log(await requester.subscribeOnce('/sys/dataOutPerSecond'));

    console.log(
        (await requester.listOnce('/sys'))
            .children
    );

    console.log(
        (await requester.invokeOnce('/sys/get_server_log', {lines: 5}))
            .result.log
    );
}

main();

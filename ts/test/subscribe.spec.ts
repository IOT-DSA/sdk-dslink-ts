import {MockBroker} from "./mock_broker";
import {assert} from "chai";
import {TestRootNode} from "./responder_nodes";
import {shouldHappen, sleep} from "./test_util";
import {ValueUpdate} from "../src/common/value";
import {Logger, logger} from "../src/utils/logger";
import {HttpClientLink} from "../src/http/client_link";
import {Requester} from "../src/requester/requester";

describe('subscribe', function () {
  let broker = new MockBroker();
  logger.setLevel(Logger.ERROR | Logger.WARN, false);
  // logger.setLevel(Logger.TRACE);

  after(() => {
    broker.destroy();
  });

  let rootNode = new TestRootNode();
  let requesterClient: HttpClientLink;
  let responderClient: HttpClientLink;
  let requester: Requester;

  beforeEach(async () => {
    rootNode = new TestRootNode();
    requesterClient = await broker.createRequester();
    responderClient = await broker.createResponder(rootNode);
    requester = requesterClient.requester;
  });
  afterEach(() => {
    requesterClient.close();
    responderClient.close();
  });

  it('subscribe', async function () {
    let updates: any[] = [];
    requester.subscribe('/val', (update: ValueUpdate) => {
      updates.push(update.value);
    });
    await shouldHappen(() => updates[0] === 123);
    rootNode.val.setValue(456);
    await shouldHappen(() => updates[1] === 456);
    rootNode.val.setValue(null);
    await shouldHappen(() => updates[2] === null);
  });

  it('subscribeOnce', async function () {
    assert.equal((await requester.subscribeOnce('/val')).value, 123);
    await sleep();
    assert.equal(requester._subscription.subscriptions.size, 0); // everything should be unsubscribed
  });

  it('qos 0', async function () {
    let updates: any[] = [];
    requester.subscribe('/val', (update: ValueUpdate) => {
      updates.push(update.value);
    });
    await shouldHappen(() => updates[0] === 123);

    for (let i = 0; i < 10; ++i) {
      rootNode.val.setValue(i);
    }
    await shouldHappen(() => updates[updates.length - 1] === 9);
    // skip all the value in between in qos 0
    assert.isTrue(updates.length === 2);
  });

  it('qos 1', async function () {
    let updates: any[] = [];
    requester.subscribe('/val', (update: ValueUpdate) => {
      updates.push(update.value);
    }, 1);
    await shouldHappen(() => updates[0] === 123);

    for (let i = 0; i < 10; ++i) {
      rootNode.val.setValue(i);
    }
    await shouldHappen(() => updates[updates.length - 1] === 9);
    // no skip in qos 1
    assert.isTrue(updates.length === 11);
  });

  it('qos 2', async function () {
    let updates: any[] = [];
    requester.subscribe('/val', (update: ValueUpdate) => {
      updates.push(update.value);
    }, 2);
    await shouldHappen(() => updates[0] === 123);

    for (let i = 0; i < 5; ++i) {
      rootNode.val.setValue(i);
    }
    requesterClient._wsConnection.close();
    for (let i = 5; i < 10; ++i) {
      rootNode.val.setValue(i);
    }
    await shouldHappen(() => updates[updates.length - 1] === 9);
    // no skip in qos 1
    assert.isTrue(updates.length >= 11);
  });
});

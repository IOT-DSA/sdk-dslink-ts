import {MockBroker} from './utils/mock-broker';
import {assert} from 'chai';
import {TestRootNode} from './utils/responder-nodes';
import {shouldHappen} from './utils/async-test';
import {ValueUpdate} from '../src/common/value';
import {Logger, logger} from '../src/utils/logger';
import {HttpClientLink} from '../src/nodejs/client-link';
import {Requester} from '../src/requester/requester';
import {Path} from '../src/common/node';
import {sleep} from '../src/utils/async';
import {ValueNode} from '../src/responder/node/value-node';
import {NodeProvider, Subscriber} from '../src/responder/node_state';
import {setErrorCallback} from '../src/utils/error-callback';

class TestLazyValue extends ValueNode {
  constructor(path: string, provider: NodeProvider) {
    super(path, provider, 'number');
  }

  onSubscribe(subscribed: Subscriber) {
    if (subscribed) {
      setTimeout(() => this.setValue('ready'), 10);
    }
  }
}

describe('subscribe', function () {
  let broker = new MockBroker();
  logger.setLevel(Logger.WARN);
  // logger.setLevel(Logger.TRACE);

  after(() => {
    broker.destroy();
  });

  let rootNode = new TestRootNode();
  let requesterClient: HttpClientLink;
  let responderClient: HttpClientLink;
  let requester: Requester;
  let responderPath: string;

  function resolve(str: string) {
    return Path.concat(responderPath, str);
  }

  beforeEach(async () => {
    rootNode = new TestRootNode();
    requesterClient = await broker.createRequester();
    responderClient = await broker.createResponder(rootNode);
    requester = requesterClient.requester;
    responderPath = responderClient.remotePath;
  });
  afterEach(() => {
    requesterClient.close();
    responderClient.close();
  });

  it('subscribe', async function () {
    let updates: any[] = [];
    let subscription = requester.subscribe(resolve('val'), (update: ValueUpdate) => {
      updates.push(update.value);
    });
    await shouldHappen(() => updates[0] === 123);
    await requester.set(resolve('val'), 456);
    await shouldHappen(() => updates[1] === 456);
    await requester.set(resolve('val'), NaN);
    await shouldHappen(() => isNaN(updates[2]));

    subscription.close();
    rootNode.val.setValue(789);
    await sleep(10);
    assert.equal(updates.length, 3); // should not receive new update after close() subscription;
  });

  it('subscribeOnce', async function () {
    assert.equal((await requester.subscribeOnce(resolve('val'))).value, 123);
    await sleep(20);
    assert.equal(requester._subscription.subscriptions.size, 1); // not unsubsceibed yet
    await sleep(100);
    assert.equal(requester._subscription.subscriptions.size, 0); // everything should be unsubscribed after 3 seconds
  });

  it('set invalid value', async function () {
    assert.equal((await requester.subscribeOnce(resolve('val'))).value, 123);

    let resp = await requester.set(resolve('val'), null);
    assert.equal(resp.error.msg, "value can't be null");

    assert.equal((await requester.subscribeOnce(resolve('val'))).value, 123);
  });

  it('lazy value load', async function () {
    let lazy = rootNode.createChild('lazy', TestLazyValue);
    assert.isUndefined(lazy._value);

    // value exist only after subscription
    assert.equal((await requester.subscribeOnce(resolve('lazy'))).value, 'ready');

    setTimeout(() => rootNode.createChild('lazy2', TestLazyValue), 50);
    // subscribe before value node gets created
    let lastUpdate: ValueUpdate;
    requester.subscribe(resolve('lazy2'), (update) => {
      lastUpdate = update;
    });
    await shouldHappen(() => lastUpdate && lastUpdate.value == null && lastUpdate.status === 'unknown');

    await shouldHappen(() => lastUpdate && lastUpdate.value === 'ready');
  });

  it('qos 0', async function () {
    let updates: any[] = [];
    requester.subscribe(resolve('val'), (update: ValueUpdate) => {
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
    requester.subscribe(
      resolve('val'),
      (update: ValueUpdate) => {
        updates.push(update.value);
      },
      1
    );
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
    requester.subscribe(
      resolve('val'),
      (update: ValueUpdate) => {
        updates.push(update.value);
      },
      2
    );
    await shouldHappen(() => updates[0] === 123);

    for (let i = 0; i < 5; ++i) {
      rootNode.val.setValue(i);
    }
    requesterClient._wsConnection.close();
    for (let i = 5; i < 10; ++i) {
      rootNode.val.setValue(i);
    }
    await shouldHappen(() => updates[updates.length - 1] === 9);
    // no skip in qos 2
    assert.isTrue(updates.length >= 11);

    updates.length = 0;
    // the subscription should continue
    for (let i = 0; i < 10; ++i) {
      rootNode.val.setValue(i);
    }
    await shouldHappen(() => updates[updates.length - 1] === 9);
    assert.isTrue(updates.length === 10);
  });

  it('error handling', async function () {
    let callbackObject: any;
    setErrorCallback((e: any) => (callbackObject = e));
    requester.subscribe(resolve('val'), (update: ValueUpdate) => {
      throw new Error('error in subscribe callback');
    });
    await shouldHappen(() => callbackObject instanceof Error);
  });
});

import {MockBroker} from "./mock_broker";
import {assert} from "chai";
import {TestRootNode, TestValueNode} from "./responder_nodes";
import {shouldHappen, sleep} from "./test_util";
import {ValueUpdate} from "../src/common/value";
import {Logger, logger} from "../src/utils/logger";
import {HttpClientLink} from "../src/http/client_link";
import {Requester} from "../src/requester/requester";
import {RequesterListUpdate} from "../src/requester/request/list";
import {RemoteNode} from "../src/requester/node_cache";
import {Path} from "../src/common/node";

describe('list', function () {
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

  it('list', async function () {
    let node: RemoteNode;
    let subscription = requester.list(resolve(''), (update: RequesterListUpdate) => {
      node = update.node;
    });
    await shouldHappen(() => node && node.getConfig('$is'));
    assert.equal(node.getChild('val').getConfig('$is'), 'testvalue');
    assert.equal(node.getChild('act').getConfig('$is'), 'testaction');
  });

  it('list attributes and configs', async function () {
    let node: RemoteNode;
    let subscription = requester.list(resolve('val'), (update: RequesterListUpdate) => {
      node = update.node;
    });
    await shouldHappen(() => node && node.getConfig('$config1') === 'hello');
    assert.isTrue(node.getConfig('$config2') == null);

    await requester.set(resolve('val/@attribute1'), 'world');
    await shouldHappen(() => node && node.getAttribute('@attribute1') === 'world');

    await requester.remove(resolve('val/@attribute1'));
    await shouldHappen(() => node && !node.attributes.has('@attribute1'));

    subscription.close();
    rootNode.setConfig('$config3', 'hmm?');
    await sleep(10);
    assert.isTrue(node.getConfig('$config3') == null);
  });

  it('listOnce', async function () {
    let node = await requester.listOnce(resolve(''));
    assert.equal(node.getChild('val').getConfig('$is'), 'testvalue');
    assert.equal(node.getChild('act').getConfig('$is'), 'testaction');

    // test invalid path
    let invalidNode = await requester.listOnce('/invalid/path');
    assert.isTrue(invalidNode.getConfig('$disconnectedTs') != null);
  });

  it('list parent and add/remove child', async function () {
    let node: RemoteNode;
    let subscription = requester.list(resolve(''), (update: RequesterListUpdate) => {
      node = update.node;
    });
    await shouldHappen(() => node && node.getConfig('$is'));
    assert.isTrue(node.getChild('newChild') == null);

    rootNode.createChild('newChild', TestValueNode);

    await shouldHappen(() => node && node.getChild('newChild'));
    assert.equal(node.getChild('newChild').getConfig('$is'), 'testvalue');

    rootNode.removeChild('val');
    await shouldHappen(() => node && !node.children.has('val'));
  });

  it('list and add/remove child', async function () {
    let node: RemoteNode;
    let subscription = requester.list(resolve('newChild'), (update: RequesterListUpdate) => {
      node = update.node;
    });
    await shouldHappen(() => node && node.getConfig('$disconnectedTs'));

    rootNode.createChild('newChild', TestValueNode);
    await shouldHappen(() => node.getConfig('$is') === 'testvalue' && node.getConfig('$disconnectedTs') == null);

    rootNode.removeChild('newChild');
    await shouldHappen(() => node.getConfig('$disconnectedTs'));
  });

  it('list child and add/remove parent', async function () {
    let node: RemoteNode;
    let subscription = requester.list(resolve('newChild/valAct'), (update: RequesterListUpdate) => {
      node = update.node;
    });
    await shouldHappen(() => node && node.getConfig('$disconnectedTs'));

    rootNode.createChild('newChild', TestValueNode);
    await shouldHappen(() => node.getConfig('$is') === 'testaction' && node.getConfig('$disconnectedTs') == null);

    rootNode.removeChild('newChild');
    await shouldHappen(() => node.getConfig('$disconnectedTs'));

  });
});

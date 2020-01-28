import {assert} from 'chai';
import {LocalNode, NodeProvider, Subscriber} from '../src/responder/node_state';
import {MockBroker} from './utils/mock-broker';
import {Logger, logger} from '../src/utils/logger';
import {HttpClientLink} from '../src/nodejs/client-link';
import {Requester} from '../src/requester/requester';
import {Path} from '../src/common/node';
import {RootNode} from '../src/responder/node/root-node';
import {RemoteNode} from '../src/requester/node_cache';
import {RequesterListUpdate} from '../src/requester/request/list';
import {shouldHappen} from './utils/async-test';
import {sleep} from '../src/utils/async';

class VirtualChild extends LocalNode {
  useVirtualList = true;

  cache: any[];
  genCacheTimeout: any;

  virtualList(updates: any[]) {
    if (this.cache) {
      updates.push(...this.cache);
    } else {
      if (!this.genCacheTimeout) {
        this.genCacheTimeout = setTimeout(() => {
          this.cache = [
            ['$is', 'node'],
            ['vchild1', {$is: 'node'}]
          ];
          this._state.listStream.add('$is');
        }, 20);
      }
    }
  }

  onSubscribe(subscriber: Subscriber) {
    if (subscriber) {
      // load the value only when there is a subscriber, (use setTimeout to simulate the delay)
      setTimeout(() => {
        // requester wont receive any update until the value is loaded
        this.setValue('ready');
      }, 20);
    }
  }
}

class VirtualProvider extends NodeProvider {
  getVirtualNode(path: string): LocalNode {
    if (path.length > 1) {
      return new VirtualChild(path, this);
    }
    return null;
  }
}

describe('virtual node', function() {
  let broker = new MockBroker();
  logger.setLevel(Logger.WARN);
  // logger.setLevel(Logger.TRACE);

  after(() => {
    broker.destroy();
  });

  let rootNode = new RootNode(null, new VirtualProvider());
  let requesterClient: HttpClientLink;
  let responderClient: HttpClientLink;
  let requester: Requester;
  let responderPath: string;

  function resolve(str: string) {
    return Path.concat(responderPath, str);
  }

  beforeEach(async () => {
    rootNode = new RootNode(null, new VirtualProvider());
    requesterClient = await broker.createRequester();
    responderClient = await broker.createResponder(rootNode);
    requester = requesterClient.requester;
    responderPath = responderClient.remotePath;
  });
  afterEach(() => {
    requesterClient.close();
    responderClient.close();
  });

  it('list', async function() {
    let node: RemoteNode;
    let subscription = requester.list(resolve('anychild'), (update: RequesterListUpdate) => {
      node = update.node;
    });
    await sleep(10);
    assert.isUndefined(node); // node list should have a delay
    await shouldHappen(() => node && node.getChild('vchild1'));
  });

  it('split list requests', async function() {
    let count = 0;
    let checked = 0;

    for (let i = 0; i < 1000; ++i) {
      (async () => {
        await requester.listOnce(resolve('anychild' + i));
        ++count;
      })();
    }

    while (count < 1000) {
      await sleep(0);
      // shouldn't receive a lot of updates at same time
      assert.isTrue(count - checked < 100);
      checked = count;
    }
    assert.equal(count, 1000);
  });

  it('split subscribe requests', async function() {
    let count = 0;
    let checked = 0;

    for (let i = 0; i < 1000; ++i) {
      (async () => {
        await requester.subscribeOnce(resolve('anychild' + i));
        ++count;
      })();
    }

    while (count < 1000) {
      await sleep(0);
      // shouldn't receive a lot of updates at same time
      assert.isTrue(count - checked < 100);
      checked = count;
    }
    assert.equal(count, 1000);
  });
});

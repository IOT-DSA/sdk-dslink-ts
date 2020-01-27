import {assert} from 'chai';
import {LocalNode, NodeProvider} from '../src/responder/node_state';
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
});

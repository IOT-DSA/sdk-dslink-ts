import {MockBroker} from './utils/mock-broker';
import {Logger, logger} from '../src/utils/logger';
import {TestRootNode} from './utils/responder-nodes';
import {HttpClientLink} from '../src/nodejs/client-link';
import {Requester} from '../src/requester/requester';
import {Path} from '../src/common/node';
import {RequesterInvokeUpdate} from '../src/requester/request/invoke';
import {shouldHappen} from './utils/async-test';
import {assert} from 'chai';
import {DsError} from '../src/common/interfaces';
import {Table} from '../src/common/table';
import {MockNode, RootMockNode} from '../src/mock/MockNode';
import {NodeQueryStructure} from '../src/requester/query/query-structure';

MockNode.interval = 1000000;
let count1 = 0;
let count2 = 0;
let count3 = 0;
let count4 = 0;
let count5 = 0;

const mockData = {
  'v': {
    '?value': 'hello',
    '$type': 'string',
    '$writable': 'write'
  },
  '?repeat': {
    count: 3,
    namePrefix: 'node',
    allowAddReduce: true,
    data: {
      '?value': () => ++count3,
      '$type': 'number',
      '$writable': 'write',
      '$state': () => ['on', 'off', 'auto'][++count1 % 3],
      '@att': () => ++count2 % 2 === 0,
      '?repeat': {
        count: 3,
        namePrefix: 'str',
        allowAddReduce: true,
        data: {
          '?value': () => (++count3).toString(),
          '$type': 'string',
          '$writable': 'write',
          '$sub': () => ['on', 'off', 'auto'][++count4 % 3],
          '@sub': () => ++count5 % 2 === 0
        }
      }
    }
  }
};

describe('query', function() {
  let broker = new MockBroker();
  logger.setLevel(Logger.WARN);
  // logger.setLevel(Logger.TRACE);

  after(() => {
    broker.destroy();
  });

  let rootNode: RootMockNode;
  let requesterClient: HttpClientLink;
  let responderClient: HttpClientLink;
  let requester: Requester;
  let responderPath: string;

  function resolve(str: string) {
    return Path.concat(responderPath, str);
  }

  beforeEach(async () => {
    // reset counter to make sure data is same
    count1 = 0;
    count2 = 0;
    count3 = 0;
    count4 = 0;
    count5 = 0;
    rootNode = new RootMockNode(mockData);
    requesterClient = await broker.createRequester();
    responderClient = await broker.createResponder(rootNode);
    requester = requesterClient.requester;
    responderPath = responderClient.remotePath;
  });
  afterEach(() => {
    requesterClient.close();
    responderClient.close();
    rootNode.destroy();
  });

  it('simple query', async function() {
    let data: any;
    let query = requester.query(
      '/',
      {'add': {'?configs': '*'}, '*': {'?value': 'snapshot', '?children': 'snapshot', '?attributes': ['*']}} as any,
      (n) => {
        data = n.toObject();
      }
    );
    await shouldHappen(() => data);
    assert.deepEqual(data, {
      add: {
        $invokable: 'write',
        $is: 'node'
      },
      node0: {
        '?value': 1,
        '@att': false
      },
      node1: {
        '?value': 5,
        '@att': true
      },
      node2: {
        '?value': 9,
        '@att': false
      },
      v: {
        '?value': 'hello'
      }
    });
  });

  it('with filter', async function() {
    let data: any;
    let query = requester.query(
      '/',
      {'*': {'?value': 'snapshot', '?children': 'snapshot', '?filter': {'field': '@att', '=': false}}} as any,
      (n) => {
        data = n.toObject();
      }
    );
    await shouldHappen(() => data);
    assert.deepEqual(data, {
      node0: {'?value': 1},
      node2: {'?value': 9}
    });
  });
  it('live update filter', async function() {
    let data: any;
    let q = requester.query(
      '/',
      {
        '*': {'?value': 'snapshot', '?children': 'snapshot', '?filter': {'field': '?value', '>': 1, 'mode': 'live'}}
      } as any,
      (n) => {
        data = n.toObject();
      }
    );
    await shouldHappen(() => data);
    assert.deepEqual(data, {
      node1: {'?value': 5},
      node2: {'?value': 9}
    });
    data = null;
    rootNode.getChild('node0').setValue(5);
    rootNode.getChild('node1').setValue(4);
    rootNode.getChild('node2').setValue(-1);
    await shouldHappen(() => data);
    assert.deepEqual(data, {
      node0: {'?value': 5},
      node1: {'?value': 5} // unchanged, because of snapshot
    });
    q.close();
  });

  it('live update nested children', async function() {
    let data: any;
    let q = requester.query(
      '/',
      {
        '?children': 'live',
        '*': {
          '?value': 'live',
          '*': {'?value': 'live', '?filter': {'field': '?value', '<': 4, 'mode': 'live'}}
        }
      } as any,
      (n) => {
        data = n.toObject();
      }
    );
    await shouldHappen(() => data);

    assert.deepEqual(data, {
      v: {'?value': 'hello'},
      node0: {'str0': {'?value': '2'}, 'str1': {'?value': '3'}, '?value': 1},
      node1: {'?value': 5},
      node2: {'?value': 9}
    });

    requester.invoke('/reduce', {});
    await shouldHappen(() => Object.keys(data).length === 3);

    requester.invoke('/add', {});
    requester.invoke('/add', {});
    await shouldHappen(() => Object.keys(data).length === 5);

    q.close();
  });
});

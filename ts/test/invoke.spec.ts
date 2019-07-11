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
import {RequesterInvokeUpdate} from "../src/requester/request/invoke";
import {DSError} from "../src/common/interfaces";
import {Path} from "../src/common/node";

describe('invoke', function () {
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

  it('simple invoke', async function () {
    let data: any;
    requester.invoke(resolve('act'), {value: 2}, (update: RequesterInvokeUpdate) => {
      data = update.result;
    });
    await shouldHappen(() => data);
    assert.deepEqual(data, {c1: 2, c2: '2'});
  });

  it('invoke once', async function () {
    let data = await requester.invokeOnce(resolve('act'), {value: 2});
    assert.deepEqual(data.result, {c1: 2, c2: '2'});
  });

  it('invoke invalid path', async function () {
    let error: DSError;
    requester.invoke(resolve('invalidPath'), {}, (update: RequesterInvokeUpdate) => {
      error = update.error;
    });
    await shouldHappen(() => error);
    assert.equal(error.type, 'notImplemented');
  });

  it('invoke once invalid path', async function () {
    let error: DSError;
    try {
      await requester.invokeOnce(resolve('invalidPath'), {});
    } catch (e) {
      error = e;
    }
    assert.equal(error.type, 'notImplemented');
  });
});

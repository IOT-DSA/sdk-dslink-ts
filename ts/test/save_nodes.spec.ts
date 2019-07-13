import {MockBroker} from "./utils/mock_broker";
import {assert} from "chai";
import {TestRootNode, TestValueNode} from "./utils/responder_nodes";
import {shouldHappen} from "./utils/async_test";
import {ValueUpdate} from "../src/common/value";
import {Logger, logger} from "../src/utils/logger";
import {HttpClientLink} from "../src/node/client_link";
import {Requester} from "../src/requester/requester";
import {Path} from "../src/common/node";
import {sleep} from "../src/utils/async";
import * as fs from "fs";

describe('save nodes', function () {
  logger.setLevel(Logger.ERROR | Logger.WARN, false);
  // logger.setLevel(Logger.TRACE);


  it('save to json', async function () {
    {
      let rootNode = new TestRootNode();
      rootNode.val._saveValue = true;

      let link = new HttpClientLink(`http://127.0.0.1:8080/conn`, 'responder-', {
        isRequester: true,
        rootNode,
        saveNodes: true
      });
      rootNode.val.setAttribute('@attr1', 'value1');
      rootNode.val.changeValue(207);
      link.close();

      // give the provider enough time to save the nodes
      await sleep(10);
    }

    {
      let rootNode = new TestRootNode();
      rootNode.val._saveValue = true;

      let link = new HttpClientLink(`http://127.0.0.1:8080/conn`, 'responder-', {
        isRequester: true,
        rootNode,
        saveNodes: true
      });

      assert.equal(rootNode.val.getAttribute('@attr1'), 'value1');
      assert.equal(rootNode.val._value, 207);

      link.close();

      // give the provider enough time to save the nodes
      await sleep(10);
      fs.unlinkSync('nodes.json');

      rootNode.provider.save();
      rootNode.provider.finishSaveTimer();
      await sleep(10);
      // default serializer should not save if there is no change
      assert.isFalse(fs.existsSync('nodes.json'));

    }

  });

  it('save function', async function () {
    let rootNode = new TestRootNode();
    rootNode.val._saveValue = true;

    let savedData: any;

    rootNode.provider._saveIntervalMs = 0;
    rootNode.provider._saveFunction = (data) => {
      savedData = data;
    };

    rootNode.provider.save();
    assert.deepEqual(savedData, {
      '$is': 'node',
      val: {'$is': 'testvalue', '?value': 123}
    });

    let val2 = rootNode.createChild('val2', TestValueNode);
    assert.deepEqual(savedData, {
      '$is': 'node',
      val: {'$is': 'testvalue', '?value': 123},
      val2: {'$is': 'testvalue'} // value of TestValue Node is not saved by default
    });
    rootNode.removeChild(val2);
    assert.deepEqual(savedData, {
      '$is': 'node',
      val: {'$is': 'testvalue', '?value': 123}
    });
  });

});

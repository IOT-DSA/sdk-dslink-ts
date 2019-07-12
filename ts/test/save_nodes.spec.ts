import {MockBroker} from "./utils/mock_broker";
import {assert} from "chai";
import {TestRootNode} from "./utils/responder_nodes";
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
        privateKey: this.key,
        isRequester: true,
        rootNode,
        saveNodes: true,
        format: 'json'
      });
      rootNode.val.setAttribute('@attr1', 'value1');
      rootNode.val.changeValue(207);
      link.close();
    }
    // give the provide enough time to save the nodes
    await sleep(10);
    {
      let rootNode = new TestRootNode();
      rootNode.val._saveValue = true;

      let link = new HttpClientLink(`http://127.0.0.1:8080/conn`, 'responder-', {
        privateKey: this.key,
        isRequester: true,
        rootNode,
        saveNodes: true,
        format: 'json'
      });

      assert.equal(rootNode.val.getAttribute('@attr1'), 'value1');
      assert.equal(rootNode.val._value, 207);

      link.close();
    }
    // give the provide enough time to save the nodes
    await sleep(10);
    fs.unlinkSync('nodes.json');
  });

});

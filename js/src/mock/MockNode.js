"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_local_node_1 = require("../responder/base-local-node");
const action_node_1 = require("../responder/node/action-node");
const MockAction_1 = require("./MockAction");
const node_state_1 = require("../responder/node_state");
class MockNode extends base_local_node_1.BaseLocalNode {
    constructor() {
        super(...arguments);
        this.numRepeat = 0;
    }
    shouldSaveConfig(key) {
        return true;
    }
    load(data) {
        super.load(data);
        if (data.hasOwnProperty('?value')) {
            let value = data['?value'];
            if (typeof value === 'function') {
                // change value with a timer
                this.setValue(value());
                this.setValueTimer = setInterval(() => this.setValue(value()), MockNode.interval);
            }
            else {
                this.setValue(value);
            }
        }
        if (data.hasOwnProperty('?repeat')) {
            this.repeat = data['?repeat'];
            for (let i = 0; i < this.repeat.count; ++i) {
                this.addRepeatNode();
            }
            if (this.repeat.allowAddReduce) {
                this.createChild('add', AddChildAction);
                this.createChild('reduce', ReduceChildAction);
            }
        }
    }
    addRepeatNode() {
        this.loadChild(`${this.repeat.namePrefix}${this.numRepeat}`, this.repeat.data);
        this.numRepeat++;
    }
    reduceRepeatNode() {
        if (this.numRepeat > 0) {
            this.numRepeat--;
            this.removeChild(`${this.repeat.namePrefix}${this.numRepeat}`);
        }
    }
    loadChild(name, data) {
        if (!this.children.has(name)) {
            if (data.hasOwnProperty('$invokable')) {
                let node = this.createChild(name, MockAction_1.MockActionNode);
                node.load(data);
            }
            else {
                let node = this.createChild(name, MockNode);
                node.load(data);
            }
        }
    }
    destroy() {
        if (this.setValueTimer) {
            clearInterval(this.setValueTimer);
        }
        super.destroy();
    }
}
MockNode.profileName = 'mock';
MockNode.interval = 1000;
exports.MockNode = MockNode;
class RootMockNode extends MockNode {
    constructor(data) {
        super('/', new node_state_1.NodeProvider());
        this.provider.setRoot(this);
        if (data) {
            this.load(data);
        }
    }
}
exports.RootMockNode = RootMockNode;
class AddChildAction extends action_node_1.ActionNode {
    onInvoke(params, parentNode) {
        parentNode.addRepeatNode();
    }
}
class ReduceChildAction extends action_node_1.ActionNode {
    onInvoke(params, parentNode) {
        parentNode.reduceRepeatNode();
    }
}
//# sourceMappingURL=MockNode.js.map
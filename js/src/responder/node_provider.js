"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("../common/node");
const async_1 = require("../utils/async");
/// Base Class for responder-side nodes.
class LocalNode extends node_1.Node {
    constructor(path) {
        super();
        /// Subscription Callbacks
        this.callbacks = new Map();
        this.path = path;
    }
    /// Changes to nodes will be added to this controller's stream.
    /// See [updateList].
    get listStream() {
        if (this._listChangeController === null) {
            this._listChangeController = new async_1.Stream(() => {
                this.onStartListListen();
            }, () => {
                this.onAllListCancel();
            });
        }
        return this._listChangeController;
    }
    /// Callback for when listing this node has started.
    onStartListListen() {
    }
    /// Callback for when all lists are canceled.
    onAllListCancel() {
    }
    _hasListListener() {
        return this._listChangeController && this._listChangeController.hasListener;
    }
    subscribe(callback) { }
}
exports.LocalNode = LocalNode;
(update) => , [qos, number = 0];
{
    callbacks[callback] = qos;
    return new RespSubscribeListener(this, callback);
}
/// Unsubscribe the given [callback] from this node.
unsubscribe(callback, ValueUpdateCallback);
{
    if (callbacks.hasOwnProperty(callback)) {
        callbacks.remove(callback);
    }
}
_lastValueUpdate: ValueUpdate;
/// Gets the last value update of this node.
get;
lastValueUpdate();
ValueUpdate;
{
    if (this._lastValueUpdate == null) {
        _lastValueUpdate = new ValueUpdate(null);
    }
    return this._lastValueUpdate;
}
/// Gets the current value of this node.
dynamic;
get;
value;
{
    if (this._lastValueUpdate != null) {
        return this._lastValueUpdate.value;
    }
    return null;
}
_valueReady: boolean = false;
/// Is the value ready?
get;
valueReady();
boolean;
{
    return this._valueReady;
}
/// Updates this node's value to the specified [value].
updateValue(update, object, { boolean, force: false });
{
    _valueReady = true;
    if (update instanceof ValueUpdate) {
        _lastValueUpdate = update;
        callbacks.forEach((callback, qos) => {
            callback(this._lastValueUpdate);
        });
    }
    else if (this._lastValueUpdate == null ||
        _lastValueUpdate.value != update ||
        force) {
        _lastValueUpdate = new ValueUpdate(update);
        callbacks.forEach((callback, qos) => {
            callback(this._lastValueUpdate);
        });
    }
}
clearValue();
{
    _valueReady = false;
    _lastValueUpdate = null;
}
/// Checks if this node exists.
/// list and subscribe can be called on a node that doesn't exist
/// Other things like set remove, and invoke can only be applied to an existing node.
get;
exists();
boolean;
{
    return true;
}
/// whether the node is ready for returning a list response
get;
listReady();
boolean;
{
    return true;
}
/// Disconnected Timestamp
get;
disconnected();
string;
{
    return null;
}
getDisconnectedListResponse();
List;
{
    return [
        ['$disconnectedTs', disconnected]
    ];
}
/// Checks if this node has a subscriber.
/// Use this for things like polling when you
/// only want to do something if the node is subscribed to.
boolean;
get;
hasSubscriber => callbacks.isNotEmpty;
/// Gets the invoke permission for this node.
getInvokePermission();
number;
{
    return Permission.parse(getConfig('$invokable'));
}
/// Gets the set permission for this node.
getSetPermission();
number;
{
    return Permission.parse(getConfig('$writable'));
}
/// Called by the link internals to invoke this node.
invoke(params, { [key]: string, dynamic }, responder, Responder, response, InvokeResponse, parentNode, node_1.Node, maxPermission, number = Permission.CONFIG);
InvokeResponse;
{
    return response..close();
}
/// Called by the link internals to set an attribute on this node.
setAttribute(let, name, string, value, object, responder, Responder, response, Response);
Response;
{
    if (response != null) {
        return response..close();
    }
    else {
        if (!name.startsWith("@")) {
            name = "@${name}";
        }
        attributes[name] = value;
        if (provider instanceof SerializableNodeProvider) {
            provider.persist();
        }
        return null;
    }
}
/// Called by the link internals to remove an attribute from this node.
removeAttribute(let, name, string, responder, Responder, response, Response);
Response;
{
    if (response != null) {
        return response..close();
    }
    else {
        if (!name.startsWith("@")) {
            name = "@${name}";
        }
        attributes.remove(name);
        if (provider instanceof SerializableNodeProvider) {
            provider.persist();
        }
        return null;
    }
}
/// Called by the link internals to set a config on this node.
setConfig(let, name, string, value, object, responder, Responder, response, Response);
Response;
{
    if (response != null) {
        return response..close();
    }
    else {
        if (!name.startsWith("$")) {
            name = "\$${name}";
        }
        configs[name] = value;
        return null;
    }
}
/// Called by the link internals to remove a config from this node.
removeConfig(name, string, responder, Responder, response, Response);
Response;
{
    if (response != null) {
        return response..close();
    }
    else {
        if (!name.startsWith("$")) {
            name = "\$${name}";
        }
        configs.remove(name);
        return null;
    }
}
/// Called by the link internals to set a value of a node.
setValue(value, object, responder, Responder, response, Response, let, maxPermission, number = Permission.CONFIG);
Response;
{
    return response..close();
}
/// Shortcut to [get].
operator[](name, string);
{
    return get(name);
}
/// Set a config, attribute, or child on this node.
operator[] = (name, value) => {
    if (name.startsWith("$")) {
        configs[name] = value;
    }
    else if (name.startsWith(r, "@")) {
        attributes[name] = value;
    }
    else if (value instanceof node_1.Node) {
        addChild(name, value);
    }
};
load(map, { [key]: string, dynamic });
{
}
//# sourceMappingURL=node_provider.js.map
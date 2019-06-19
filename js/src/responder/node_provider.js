"use strict";
// part of dslink.responder;
Object.defineProperty(exports, "__esModule", { value: true });
/// Changes to nodes will be added to this controller's stream.
/// See [updateList].
get;
listChangeController();
BroadcastStreamController < string > {
    : ._listChangeController == null
};
{
    _listChangeController = new BroadcastStreamController(() => {
        onStartListListen();
    }, () => {
        onAllListCancel();
    }, null, true);
}
return this._listChangeController;
overrideListChangeController(controller, BroadcastStreamController(), {
    _listChangeController = controller
}
/// List Stream.
/// See [listChangeController].
, 
/// List Stream.
/// See [listChangeController].
Stream < string > get, listStream => listChangeController.stream);
/// Callback for when listing this node has started.
void onStartListListen();
{ }
/// Callback for when all lists are canceled.
void onAllListCancel();
{ }
boolean;
get;
_hasListListener => _listChangeController ? .hasListener ?  ? false :  :  : ;
/// Node Provider
provider: NodeProvider;
path: string;
LocalNode(this.path);
/// Subscription Callbacks
callbacks: object < ValueUpdateCallback, int > ;
new object();
/// Subscribes the given [callback] to this node.
RespSubscribeListener;
subscribe(callback(update, ValueUpdate), [qos, number = 0]);
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
        [r, '$disconnectedTs', disconnected]
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
    return Permission.parse(getConfig(r, '$invokable'));
}
/// Gets the set permission for this node.
getSetPermission();
number;
{
    return Permission.parse(getConfig(r, '$writable'));
}
/// Called by the link internals to invoke this node.
invoke(params, { [key]: string, dynamic }, responder, Responder, response, InvokeResponse, parentNode, Node, maxPermission, number = Permission.CONFIG);
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
        if (!name.startsWith(r, "$")) {
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
        if (!name.startsWith(r, "$")) {
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
    if (name.startsWith(r, "$")) {
        configs[name] = value;
    }
    else if (name.startsWith(r, "@")) {
        attributes[name] = value;
    }
    else if (value instanceof Node) {
        addChild(name, value);
    }
};
load(map, { [key]: string, dynamic });
{
}
//# sourceMappingURL=node_provider.js.map
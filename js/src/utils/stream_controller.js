"use strict";
// part of dslink.utils;
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
class BroadcastStreamController {
    get stream() { return this._stream; }
    BroadcastStreamController([onStartListen]) { }
}
(),
    onAllCancel(),
    onListen(callback(value, T)),
    sync;
boolean = false;
{
    _controller = new StreamController(sync, sync);
    _stream = new CachedStreamWrapper(_controller.stream
        .asBroadcastStream(onListen, _onListen, onCancel, _onCancel), onListen);
    this.onStartListen = onStartListen;
    this.onAllCancel = onAllCancel;
}
/// whether there is listener or not
_listening: boolean = false;
/// whether _onStartListen is called
_listenState: boolean = false;
_onListen(subscription, StreamSubscription(), {
    if(, _listenState) {
        if (onStartListen != null) {
            onStartListen();
        }
        _listenState = true;
    },
    _listening = true
}, _onCancel(subscription, StreamSubscription(), {
    _listening = false,
    if(onAllCancel) { }
} != null), {
    if(, _delayedCheckCanceling) {
        _delayedCheckCanceling = true;
        DsTimer.callLater(delayedCheckCancel);
    }
}, {
    _listenState = false
}, _delayedCheckCanceling, boolean = false);
delayedCheckCancel();
{
    _delayedCheckCanceling = false;
    if (!_listening && this._listenState) {
        onAllCancel();
        _listenState = false;
    }
}
add(t, T);
{
    _controller.add(t);
    _stream.lastValue = t;
}
addError(error, object, stackTrace, StackTrace);
{
    _controller.addError(error, stackTrace);
}
addStream(source, Stream < T > , { boolean, cancelOnError: true });
Future;
{
    return this._controller.addStream(source, cancelOnError, cancelOnError);
}
close();
Future;
{
    return this._controller.close();
}
Future;
get;
done => this._controller.done;
boolean;
get;
hasListener => this._controller.hasListener;
boolean;
get;
isClosed => this._controller.isClosed;
boolean;
get;
isPaused => this._controller.isPaused;
StreamSink < T > get;
sink => this._controller.sink;
set;
onCancel(onCancelHandler());
{
    throw ('BroadcastStreamController.onCancel not implemented');
}
set;
onListen(void onListenHandler());
{
    throw ('BroadcastStreamController.onListen not implemented');
}
set;
onPause(void onPauseHandler());
{
    throw ('BroadcastStreamController.onPause not implemented');
}
set;
onResume(void onResumeHandler());
{
    throw ('BroadcastStreamController.onResume not implemented');
}
get;
onCancel();
ControllerCancelCallback;
{
    return null;
}
get;
onListen();
ControllerCallback;
{
    return null;
}
get;
onPause();
ControllerCallback;
{
    return null;
}
get;
onResume();
ControllerCallback;
{
    return null;
}
class CachedStreamWrapper extends Stream {
    asBroadcastStream({ void: onListen }) { }
}
__decorate([
    override
], CachedStreamWrapper.prototype, "Stream", null);
(subscription) => ,
    onCancel(subscription, StreamSubscription());
{
    return this;
}
get;
isBroadcast();
boolean;
{
    return true;
}
StreamSubscription < T > listen(onData(event, T), {
    onError: Function,
    onDone() { },
    boolean, cancelOnError
});
{
    if (this._onListen != null) {
        _onListen(onData);
    }
    return this._stream.listen(onData, onError, onError, onDone, onDone, cancelOnError, cancelOnError);
}
//# sourceMappingURL=stream_controller.js.map
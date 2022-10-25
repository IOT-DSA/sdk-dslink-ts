let _callback: Function = null;
export function setErrorCallback(callback: Function) {
  _callback = callback;
}

export function logError(err: any) {
  if (_callback) {
    _callback(err);
  } else {
    console.error(err);
  }
}

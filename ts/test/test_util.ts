export function shouldHappen(callback: () => any, timeoutMs: number = 100): Promise<any> {
  // prepare a Error first to maintain the original call stack
  let error = new Error('timeout');

  let beginTime = new Date().getTime();
  return new Promise<any>((resolve, reject) => {
    let onTimer = () => {
      let result = callback();
      if (result) {
        resolve(result);
        return;
      }
      let currentTime = new Date().getTime();
      if (currentTime - beginTime > timeoutMs) {
        reject(error);
      } else {
        setTimeout(onTimer, 1);
      }
    };
    onTimer();
  });
}

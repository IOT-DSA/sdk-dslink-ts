const callbacks = new Set<() => void>();
let updating = false;
export function startBatchUpdate() {
  updating = true;
}

export function endBatchUpdate() {
  for (let callback of callbacks) {
    try {
      callback();
    } catch (e) {
      console.error(e);
    }
  }
  updating = false;
}

export function addBatchUpdateCallback(callback: () => void) {
  callbacks.add(callback);
}

export function isBatchUpdating() {
  return updating;
}

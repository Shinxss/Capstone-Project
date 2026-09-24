type DispatchEventListener = () => void | Promise<void>;

const dispatchEventListeners = new Set<DispatchEventListener>();

export function subscribeDispatchEvents(listener: DispatchEventListener): () => void {
  dispatchEventListeners.add(listener);
  return () => {
    dispatchEventListeners.delete(listener);
  };
}

export async function emitDispatchEvent(): Promise<void> {
  const listeners = Array.from(dispatchEventListeners);
  for (const listener of listeners) {
    try {
      await listener();
    } catch {
      // Ignore listener failures
    }
  }
}

type UnauthorizedListener = () => void | Promise<void>;

const unauthorizedListeners = new Set<UnauthorizedListener>();

export function subscribeUnauthorized(listener: UnauthorizedListener): () => void {
  unauthorizedListeners.add(listener);
  return () => {
    unauthorizedListeners.delete(listener);
  };
}

export async function emitUnauthorized(): Promise<void> {
  for (const listener of unauthorizedListeners) {
    await listener();
  }
}

/**
 * Serialized localStorage adapter for Zustand persist.
 *
 * The browser's localStorage is backed by LevelDB in Chromium-based
 * environments. LevelDB only allows one write batch at a time — concurrent
 * writes from multiple Zustand stores throw:
 *   "Another write batch or compaction is already active"
 *
 * This adapter queues all setItem calls so they execute one at a time,
 * eliminating the concurrency conflict.
 * 
 * Also handles AbortError from Web Locks API conflicts in Chrome/Edge.
 */

type WriteTask = () => void;

const isBrowser = typeof window !== "undefined";

const writeQueue: WriteTask[] = [];
let writing = false;

const isAbortError = (err: unknown): boolean => {
  if (err instanceof DOMException) return err.name === 'AbortError';
  if (err instanceof Error) return err.name === 'AbortError';
  if (typeof err === 'object' && err !== null) {
    return (err as { name?: string }).name === 'AbortError';
  }
  return false;
};

const isLockError = (err: unknown): boolean => {
  if (isAbortError(err)) {
    const msg = err instanceof Error ? err.message : String(err);
    return msg.includes('steal') || msg.includes('Lock') || msg.includes('lock');
  }
  if (err instanceof Error) {
    const msg = err.message;
    return msg.includes('Lock') && (msg.includes('steal') || msg.includes('abort'));
  }
  return false;
};

function flushQueue() {
  if (writing || writeQueue.length === 0) return;
  writing = true;
  const task = writeQueue.shift()!;
  try {
    task();
  } finally {
    writing = false;
    if (writeQueue.length > 0) {
      setTimeout(flushQueue, 50);
    }
  }
}

function queuedSetItem(key: string, value: string): void {
  if (!isBrowser) return;
  writeQueue.push(() => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      if (isAbortError(e) || isLockError(e)) {
        const isLock = isLockError(e);
        console.warn(`[storage] ${isLock ? 'Lock conflict' : 'AbortError'} for key "${key}" - will retry`);
        setTimeout(() => {
          try {
            localStorage.setItem(key, value);
          } catch (retryErr) {
            if (isAbortError(retryErr) || isLockError(retryErr)) {
              console.warn(`[storage] Retry also failed for "${key}" - will try one more time`);
              setTimeout(() => {
                try {
                  localStorage.setItem(key, value);
                } catch (finalErr) {
                  if (isAbortError(finalErr) || isLockError(finalErr)) {
                    console.warn(`[storage] Final retry failed for "${key}" - discarding write`);
                  } else {
                    console.warn(`[storage] Final retry failed for "${key}":`, finalErr);
                  }
                }
              }, 300);
            } else {
              console.warn(`[storage] Retry failed for key "${key}":`, retryErr);
            }
          }
        }, 200);
      } else {
        const err = e as Error;
        if (err.name === 'QuotaExceededError') {
          console.warn(`[storage] localStorage quota exceeded for key "${key}"`);
        } else {
          console.warn(`[storage] setItem failed for key "${key}":`, e);
        }
      }
    }
  });
  flushQueue();
}

export const serializedStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      if (isAbortError(e) || isLockError(e)) {
        console.warn(`[storage] ${isLockError(e) ? 'Lock conflict' : 'AbortError'} on getItem("${key}") - returning null`);
        return null;
      }
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    queuedSetItem(key, value);
  },
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      if (!isAbortError(e) && !isLockError(e)) {
        console.warn(`[storage] removeItem failed for key "${key}":`, e);
      }
    }
  },
};

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
 */

type WriteTask = () => void;

const writeQueue: WriteTask[] = [];
let writing = false;

function flushQueue() {
  if (writing || writeQueue.length === 0) return;
  writing = true;
  const task = writeQueue.shift()!;
  try {
    task();
  } finally {
    writing = false;
    // Use setTimeout to yield to the event loop between writes
    if (writeQueue.length > 0) {
      setTimeout(flushQueue, 0);
    }
  }
}

function queuedSetItem(key: string, value: string): void {
  writeQueue.push(() => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[storage] setItem failed for key "${key}":`, e);
    }
  });
  flushQueue();
}

export const serializedStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    queuedSetItem(key, value);
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[storage] removeItem failed for key "${key}":`, e);
    }
  },
};

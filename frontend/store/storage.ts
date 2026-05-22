/**
 * Serialized localStorage adapter for Zustand persist.
 */
import logger from '@/lib/logger';

const isBrowser = typeof window !== 'undefined';

function isAbortError(e: unknown): boolean {
  return e instanceof Error && (e.name === 'AbortError' || e.message.includes('AbortError'));
}

function isLockError(e: unknown): boolean {
  return e instanceof Error && (e.message.includes('Lock') || e.message.includes('lock') || e.message.includes('steal'));
}

export const serializedStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch (e) {
      if (isLockError(e) || isAbortError(e)) {
        logger.warn(`[storage] ${isLockError(e) ? 'Lock conflict' : 'AbortError'} on getItem("${key}") - returning null`);
        return null;
      }
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser) return;
    
    const maxRetries = 2;
    let attempt = 0;

    const trySet = (k: string, v: string) => {
      try {
        localStorage.setItem(k, v);
        return true;
      } catch (e) {
        const isLock = isLockError(e);
        const isAbort = isAbortError(e);

        if ((isLock || isAbort) && attempt < maxRetries) {
          attempt++;
          logger.warn(`[storage] ${isLock ? 'Lock conflict' : 'AbortError'} for key "${key}" - will retry`);
          return false;
        }

        if (e instanceof Error && e.name === 'QuotaExceededError') {
          logger.warn(`[storage] localStorage quota exceeded for key "${key}"`);
        } else {
          logger.warn(`[storage] setItem failed for key "${key}":`, e);
        }
        return true; // Stop retrying on non-lock errors
      }
    };

    while (attempt <= maxRetries) {
      if (trySet(key, value)) break;
    }
  },
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      if (!isAbortError(e) && !isLockError(e)) {
        logger.warn(`[storage] removeItem failed for key "${key}":`, e);
      }
    }
  },
};

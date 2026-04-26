import { useState, useCallback, useRef } from 'react';

export type TransitionState = 'idle' | 'exiting' | 'entering' | 'ready';

interface TransitionOptions {
  duration?: number;
}

export function useCanvasTransition(options: TransitionOptions = {}) {
  const { duration = 150 } = options;
  const [state, setState] = useState<TransitionState>('idle');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTransition = useCallback(async (onReady: () => void | Promise<void>) => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Exit phase
    setState('exiting');
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // Run the transition callback
    const result = onReady();
    if (result instanceof Promise) {
      await result;
    }
    
    // Enter phase
    setState('entering');
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // Ready
    setState('ready');
    
    // Reset to idle
    setTimeout(() => setState('idle'), duration);
  }, [duration]);

  const cancelTransition = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setState('idle');
  }, []);

  return {
    state,
    isTransitioning: state === 'exiting' || state === 'entering',
    startTransition,
    cancelTransition,
    getTransitionStyle: useCallback(() => {
      if (state === 'exiting') {
        return { opacity: 0, transform: 'scale(0.98)', transition: `all ${duration}ms ease-out` };
      }
      if (state === 'entering') {
        return { opacity: 1, transform: 'scale(1)', transition: `all ${duration}ms ease-in` };
      }
      return {};
    }, [state, duration]),
  };
}
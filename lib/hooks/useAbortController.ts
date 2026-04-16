import { useEffect, useRef } from 'react';

/**
 * Manages an AbortController for fetch requests.
 * Aborts the previous request when a new one starts,
 * and cleans up on component unmount.
 */
export function useAbortController(): {
  getSignal: () => AbortSignal;
} {
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const getSignal = (): AbortSignal => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    return controller.signal;
  };

  return { getSignal };
}

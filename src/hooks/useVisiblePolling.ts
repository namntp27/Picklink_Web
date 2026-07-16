import { useEffect, useRef } from 'react';

export const useVisiblePolling = (
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled = true,
) => {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let active = true;
    let running = false;
    let timer: number | undefined;

    const schedule = () => {
      if (active && !document.hidden) timer = window.setTimeout(run, intervalMs);
    };

    const run = async () => {
      timer = undefined;
      if (!active || running || document.hidden) return;

      running = true;
      try {
        await callbackRef.current();
      } catch (error) {
        console.error('Polling callback failed', error);
      } finally {
        running = false;
        schedule();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timer !== undefined) window.clearTimeout(timer);
        timer = undefined;
        return;
      }
      if (timer !== undefined) window.clearTimeout(timer);
      void run();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    schedule();

    return () => {
      active = false;
      if (timer !== undefined) window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, intervalMs]);
};

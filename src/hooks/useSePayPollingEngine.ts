import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseSePayPollingEngineOptions {
  intervalSeconds?: number;
  enabled?: boolean;
  isActive?: boolean;
  onTrigger: () => Promise<void> | void;
}

export const useSePayPollingEngine = ({
  intervalSeconds = 5,
  enabled = true,
  isActive = true,
  onTrigger,
}: UseSePayPollingEngineOptions) => {
  const [countdown, setCountdown] = useState(intervalSeconds);
  const [isChecking, setIsChecking] = useState(false);
  const callbackRef = useRef(onTrigger);
  callbackRef.current = onTrigger;

  const triggerNow = useCallback(async () => {
    setIsChecking(true);
    try {
      await callbackRef.current();
    } finally {
      setIsChecking(false);
      setCountdown(intervalSeconds);
    }
  }, [intervalSeconds]);

  useEffect(() => {
    if (!enabled || !isActive) {
      setCountdown(intervalSeconds);
      return;
    }

    const timer = window.setInterval(() => {
      if (document.hidden) return;

      setCountdown((current) => {
        if (current <= 1) {
          void triggerNow();
          return intervalSeconds;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [enabled, intervalSeconds, isActive, triggerNow]);

  return {
    countdown,
    isChecking,
    triggerNow,
  };
};

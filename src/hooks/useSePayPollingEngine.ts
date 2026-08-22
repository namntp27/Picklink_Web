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
  const inFlightRef = useRef(false);
  const hasTriggeredForActivePeriodRef = useRef(false);
  callbackRef.current = onTrigger;

  const triggerNow = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setIsChecking(true);
    try {
      await callbackRef.current();
    } finally {
      inFlightRef.current = false;
      setIsChecking(false);
      setCountdown(intervalSeconds);
    }
  }, [intervalSeconds]);

  useEffect(() => {
    if (!enabled || !isActive) {
      hasTriggeredForActivePeriodRef.current = false;
      setCountdown(intervalSeconds);
      return;
    }

    // Reconcile immediately when a payment screen becomes active, then keep checking
    // on the interval below. The ref also prevents React Strict Mode from firing the
    // initial request twice during its development-only effect replay.
    if (!hasTriggeredForActivePeriodRef.current) {
      hasTriggeredForActivePeriodRef.current = true;
      void triggerNow();
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

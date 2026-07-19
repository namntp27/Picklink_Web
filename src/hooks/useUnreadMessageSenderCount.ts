import { useCallback, useEffect, useState } from 'react';
import { getUnreadMessageSenderCount } from '../api/community';
import { useVisiblePolling } from './useVisiblePolling';

const MESSAGE_BADGE_POLL_INTERVAL_MS = 4_000;

export const useUnreadMessageSenderCount = (token?: string | null) => {
  const [count, setCount] = useState(0);

  const loadCount = useCallback(async () => {
    if (!token) {
      setCount(0);
      return;
    }

    try {
      const result = await getUnreadMessageSenderCount(token);
      setCount(result.count);
    } catch {
      setCount(0);
    }
  }, [token]);

  useEffect(() => {
    void loadCount();
  }, [loadCount]);

  useVisiblePolling(loadCount, MESSAGE_BADGE_POLL_INTERVAL_MS, Boolean(token));

  return count;
};
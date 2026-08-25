import { useCallback } from 'react';
import { getUnreadNotificationCount } from '../api/notifications';
import { useApiQuery } from './useApiQuery';
import { useNotificationRealtime } from './useNotificationRealtime';

/**
 * One shared cache entry (via useApiQuery) for the unread-notification badge. Every shell/page
 * that shows this count used to keep its own useState + fetch + realtime listener, so the same
 * count was independently re-fetched once per mounted consumer on every realtime push.
 */
export const useUnreadNotificationCount = (token: string | null | undefined) => {
  const { data, refresh } = useApiQuery(
    ['unread-notification-count', token],
    async () => (await getUnreadNotificationCount(token!)).count,
    { enabled: Boolean(token) },
  );

  useNotificationRealtime(token, useCallback(() => {
    void refresh();
  }, [refresh]));

  return { count: data ?? 0, refresh };
};

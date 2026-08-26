import { useCallback, useRef } from 'react';
import { listNotifications, type NotificationTone } from '../../api/notifications';
import { useAuth } from '../../auth/AuthContext';
import { useNotificationRealtime } from '../../hooks/useNotificationRealtime';
import { isAutomaticMatch } from '../matches/MatchFoundAlert';
import { useToast, type ToastTone } from '../ui/ToastRegion';

const toastToneFor = (tone: NotificationTone): ToastTone => {
  if (tone === 'urgent') return 'error';
  if (tone === 'success') return 'success';
  return 'info';
};

/**
 * Mounted once near the app root. Whenever the backend creates a notification for the
 * current user (a queue join request, an accepted invite, a payment update, etc.), pop a
 * toast so the user finds out immediately instead of only on their next /notifications visit.
 */
export const NotificationToastBridge = () => {
  const { token } = useAuth();
  const notify = useToast();
  const shownNotificationIdsRef = useRef(new Set<number>());

  useNotificationRealtime(token, useCallback((event) => {
    if (!token || event.action !== 'Created' || !event.notificationId) return;
    const notificationId = event.notificationId;
    if (shownNotificationIdsRef.current.has(notificationId)) return;

    void listNotifications(token, { page: 1, pageSize: 10 })
      .then(({ items }) => {
        const notification = items.find((item) => item.notificationId === notificationId);
        if (!notification || shownNotificationIdsRef.current.has(notificationId)) return;
        // MatchFoundAlert already shows a full-screen modal for this one; skip the toast to avoid double-announcing it.
        if (isAutomaticMatch(notification)) return;

        shownNotificationIdsRef.current.add(notificationId);
        notify(`${notification.title}: ${notification.message}`, toastToneFor(notification.tone));
      })
      .catch(() => undefined);
  }, [token, notify]));

  return null;
};

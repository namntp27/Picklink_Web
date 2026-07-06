import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../api/client';

export type NotificationRealtimeEvent = {
  userId: number;
  notificationId?: number | null;
  action: string;
  changedAt: string;
};

export const useNotificationRealtime = (
  accessToken: string | null | undefined,
  onNotificationChanged: (event: NotificationRealtimeEvent) => void,
) => {
  const callbackRef = useRef(onNotificationChanged);

  useEffect(() => {
    callbackRef.current = onNotificationChanged;
  }, [onNotificationChanged]);

  useEffect(() => {
    if (!accessToken || typeof ReadableStream === 'undefined') return;

    const controller = new AbortController();
    let isActive = true;

    const readStream = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/realtime/notifications`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (isActive) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split('\n\n');
          buffer = chunks.pop() ?? '';

          chunks.forEach((chunk) => {
            if (!chunk.includes('event: notification-updated')) return;
            const dataLine = chunk
              .split('\n')
              .find((line) => line.startsWith('data:'));
            if (!dataLine) return;

            try {
              callbackRef.current(JSON.parse(dataLine.replace(/^data:\s*/, '')) as NotificationRealtimeEvent);
            } catch {
              // Keep listening when a malformed SSE payload is received.
            }
          });
        }
      } catch {
        // The stream is allowed to end silently when the component unmounts or the token changes.
      }
    };

    void readStream();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [accessToken]);
};

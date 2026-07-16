import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../api/client';

export type NotificationRealtimeEvent = {
  userId: number;
  notificationId?: number | null;
  action: string;
  changedAt: string;
};

type Listener = (event: NotificationRealtimeEvent) => void;

type RealtimeConnection = {
  listeners: Set<Listener>;
  stop: () => void;
};

const connections = new Map<string, RealtimeConnection>();

const createConnection = (accessToken: string): RealtimeConnection => {
  const controller = new AbortController();
  const listeners = new Set<Listener>();
  let isActive = true;

  const waitToReconnect = () => new Promise<void>((resolve) => {
    window.setTimeout(resolve, 3000);
  });

  const readStream = async () => {
    while (isActive) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/realtime/notifications`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error('Notification stream unavailable.');

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
            const dataLine = chunk.split('\n').find((line) => line.startsWith('data:'));
            if (!dataLine) return;

            try {
              const event = JSON.parse(dataLine.replace(/^data:\s*/, '')) as NotificationRealtimeEvent;
              listeners.forEach((listener) => listener(event));
            } catch {
              // Keep listening when a malformed SSE payload is received.
            }
          });
        }
      } catch {
        // Retry below unless the last subscriber left or the token changed.
      }

      if (isActive) await waitToReconnect();
    }
  };

  void readStream();

  return {
    listeners,
    stop: () => {
      isActive = false;
      controller.abort();
    },
  };
};

const subscribe = (accessToken: string, listener: Listener) => {
  let connection = connections.get(accessToken);
  if (!connection) {
    connection = createConnection(accessToken);
    connections.set(accessToken, connection);
  }

  connection.listeners.add(listener);

  return () => {
    const current = connections.get(accessToken);
    if (!current) return;

    current.listeners.delete(listener);
    if (current.listeners.size === 0) {
      current.stop();
      connections.delete(accessToken);
    }
  };
};

export const useNotificationRealtime = (
  accessToken: string | null | undefined,
  onNotificationChanged: Listener,
) => {
  const callbackRef = useRef(onNotificationChanged);

  useEffect(() => {
    callbackRef.current = onNotificationChanged;
  }, [onNotificationChanged]);

  useEffect(() => {
    if (!accessToken || typeof ReadableStream === 'undefined') return;
    return subscribe(accessToken, (event) => callbackRef.current(event));
  }, [accessToken]);
};

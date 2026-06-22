import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../api/client';

export type MatchRealtimeEvent = {
  matchId: number;
  action: string;
  changedAt: string;
};

export const useMatchRealtime = (onMatchChanged: (event: MatchRealtimeEvent) => void) => {
  const callbackRef = useRef(onMatchChanged);

  useEffect(() => {
    callbackRef.current = onMatchChanged;
  }, [onMatchChanged]);

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/api/realtime/matches`);
    const handleChange = (message: MessageEvent<string>) => {
      try {
        callbackRef.current(JSON.parse(message.data) as MatchRealtimeEvent);
      } catch {
        // Ignore malformed events and keep the stream connected.
      }
    };

    eventSource.addEventListener('match-updated', handleChange as EventListener);
    return () => {
      eventSource.removeEventListener('match-updated', handleChange as EventListener);
      eventSource.close();
    };
  }, []);
};

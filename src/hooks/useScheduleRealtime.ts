import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../api/client';

export type ScheduleRealtimeEvent = {
  venueId: number;
  courtId: number;
  startTime: string;
  endTime: string;
  entryType: 'Blocked' | 'Maintenance' | 'Event';
  action: 'Created' | 'Deleted';
};

export const useScheduleRealtime = (onScheduleChanged: (event: ScheduleRealtimeEvent) => void) => {
  const callbackRef = useRef(onScheduleChanged);

  useEffect(() => {
    callbackRef.current = onScheduleChanged;
  }, [onScheduleChanged]);

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/api/realtime/schedule`);
    const handleChange = (message: MessageEvent<string>) => {
      try {
        callbackRef.current(JSON.parse(message.data) as ScheduleRealtimeEvent);
      } catch {
        // Ignore malformed events and keep the stream connected.
      }
    };

    eventSource.addEventListener('schedule-updated', handleChange as EventListener);
    return () => {
      eventSource.removeEventListener('schedule-updated', handleChange as EventListener);
      eventSource.close();
    };
  }, []);
};

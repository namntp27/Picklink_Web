import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../api/client';

export type VenueRealtimeEvent = {
  venueId: number;
  action: string;
  changedAt: string;
};

export const useVenueRealtime = (onVenueChanged: (event: VenueRealtimeEvent) => void) => {
  const callbackRef = useRef(onVenueChanged);

  useEffect(() => {
    callbackRef.current = onVenueChanged;
  }, [onVenueChanged]);

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/api/realtime/venues`);
    const handleChange = (message: MessageEvent<string>) => {
      try {
        callbackRef.current(JSON.parse(message.data) as VenueRealtimeEvent);
      } catch {
        // Ignore malformed events and keep the stream connected.
      }
    };
    eventSource.addEventListener('venue-updated', handleChange as EventListener);
    return () => {
      eventSource.removeEventListener('venue-updated', handleChange as EventListener);
      eventSource.close();
    };
  }, []);
};

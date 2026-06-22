import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../api/client';

export type PaymentRealtimeEvent = {
  paymentId: number;
  bookingId: number;
  venueId: number;
  paymentStatus: string;
  action: 'Submitted' | 'Approved' | 'Rejected';
};

export const usePaymentRealtime = (onPaymentChanged: (event: PaymentRealtimeEvent) => void) => {
  const callbackRef = useRef(onPaymentChanged);

  useEffect(() => {
    callbackRef.current = onPaymentChanged;
  }, [onPaymentChanged]);

  useEffect(() => {
    const eventSource = new EventSource(`${API_BASE_URL}/api/realtime/payments`);
    const handleChange = (message: MessageEvent<string>) => {
      try {
        callbackRef.current(JSON.parse(message.data) as PaymentRealtimeEvent);
      } catch {
        // Keep the stream alive when a malformed event is received.
      }
    };

    eventSource.addEventListener('payment-updated', handleChange as EventListener);
    return () => {
      eventSource.removeEventListener('payment-updated', handleChange as EventListener);
      eventSource.close();
    };
  }, []);
};

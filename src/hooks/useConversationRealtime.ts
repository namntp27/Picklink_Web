import { useEffect, useRef } from 'react';
import { getConversationStreamUrl, type FirebaseRealtimeEvent } from '../api/firebaseRealtime';

export type ReadReceiptData = {
  UserId?: number;
  userId?: number;
  LastReadAt?: string;
  lastReadAt?: string;
  LastReadMessageId?: number;
  lastReadMessageId?: number;
};

export type ConversationRealtimeCallbacks = {
  onReadReceiptUpdated?: (receipt: ReadReceiptData) => void;
  onMessagePushed?: (message: any) => void;
};

export const useConversationRealtime = (
  numericConversationId: number | null | undefined,
  callbacks: ConversationRealtimeCallbacks
) => {
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    if (!numericConversationId || numericConversationId <= 0) return;

    const streamUrl = getConversationStreamUrl(numericConversationId);
    console.log(`[Firebase SSE] Subscribing to conversation #${numericConversationId}:`, streamUrl);
    const eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      console.log(`[Firebase SSE] Connected to conversation #${numericConversationId}`);
    };

    eventSource.onerror = (err) => {
      console.error(`[Firebase SSE Error] Conversation #${numericConversationId}`, err);
    };

    const handleStreamEvent = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as FirebaseRealtimeEvent;
        if (!payload) return;

        const path = payload.path || '/';
        const data = payload.data;
        if (!data) return;

        console.log(`[Firebase SSE Event] path="${path}"`, data);

        // Path matches root conversation node or read_receipts subnode
        if (path === '/' && data.read_receipts) {
          Object.values(data.read_receipts).forEach((rr: any) => {
            if (rr && typeof rr === 'object') {
              callbacksRef.current.onReadReceiptUpdated?.(rr);
            }
          });
        } else if (path.startsWith('/read_receipts')) {
          if (typeof data === 'object' && !Array.isArray(data)) {
            if (data.LastReadAt || data.lastReadAt || data.UserId || data.userId) {
              callbacksRef.current.onReadReceiptUpdated?.(data);
            } else {
              Object.values(data).forEach((rr: any) => {
                if (rr && typeof rr === 'object') {
                  callbacksRef.current.onReadReceiptUpdated?.(rr);
                }
              });
            }
          }
        }

        // Messages node
        if (path === '/' && data.messages) {
          Object.values(data.messages).forEach((msg: any) => {
            if (msg && typeof msg === 'object') {
              callbacksRef.current.onMessagePushed?.(msg);
            }
          });
        } else if (path.startsWith('/messages')) {
          if (typeof data === 'object') {
            callbacksRef.current.onMessagePushed?.(data);
          }
        }
      } catch {
        // Keep connection open
      }
    };

    eventSource.addEventListener('put', handleStreamEvent as EventListener);
    eventSource.addEventListener('patch', handleStreamEvent as EventListener);

    return () => {
      console.log(`[Firebase SSE] Closing subscription to conversation #${numericConversationId}`);
      eventSource.removeEventListener('put', handleStreamEvent as EventListener);
      eventSource.removeEventListener('patch', handleStreamEvent as EventListener);
      eventSource.close();
    };
  }, [numericConversationId]);
};

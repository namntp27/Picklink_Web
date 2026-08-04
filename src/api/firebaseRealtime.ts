export const FIREBASE_DATABASE_URL = 'https://picklink-realtime-default-rtdb.asia-southeast1.firebasedatabase.app';
export const FIREBASE_AUTH_SECRET = 'iWlhfZVhUSkaWAjkt0W9oMgJA46ZUJkClRbnsnLK';

export type FirebaseRealtimeEvent<T = any> = {
  path: string;
  data: T;
};

export const getConversationStreamUrl = (numericConversationId: number): string => {
  const baseUrl = `${FIREBASE_DATABASE_URL}/conversations/${numericConversationId}.json?accept=text/event-stream`;
  return FIREBASE_AUTH_SECRET ? `${baseUrl}&auth=${FIREBASE_AUTH_SECRET}` : baseUrl;
};

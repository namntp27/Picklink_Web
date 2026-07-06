import { apiRequest, type PaginatedResponse, type PaginationParams } from './client';

export type NotificationType = 'match' | 'payment' | 'court' | 'club' | 'system';
export type NotificationTone = 'default' | 'urgent' | 'success';
export type NotificationFilter = 'all' | 'unread' | NotificationType;

export type NotificationItem = {
  notificationId: number;
  type: NotificationType;
  title: string;
  message: string;
  tone: NotificationTone;
  linkTo?: string | null;
  linkLabel?: string | null;
  createdAt: string;
  isRead: boolean;
};

export type NotificationListParams = PaginationParams & {
  type?: NotificationType | 'all';
  unreadOnly?: boolean;
};

export type NotificationUnreadCount = {
  count: number;
};

const queryString = (params: NotificationListParams = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== 'all') {
      query.set(key, String(value));
    }
  });
  const value = query.toString();
  return value ? `?${value}` : '';
};

export const listNotifications = (
  accessToken: string,
  params: NotificationListParams = {},
) => apiRequest<PaginatedResponse<NotificationItem>>(
  `/api/notifications${queryString(params)}`,
  {},
  accessToken,
);

export const getUnreadNotificationCount = (accessToken: string) =>
  apiRequest<NotificationUnreadCount>('/api/notifications/unread-count', {}, accessToken);

export const markNotificationAsRead = (accessToken: string, notificationId: number) =>
  apiRequest<NotificationItem>(
    `/api/notifications/${notificationId}/read`,
    { method: 'PATCH' },
    accessToken,
  );

export const markAllNotificationsAsRead = (accessToken: string) =>
  apiRequest<void>('/api/notifications/read-all', { method: 'PATCH' }, accessToken);

export const deleteNotification = (accessToken: string, notificationId: number) =>
  apiRequest<void>(`/api/notifications/${notificationId}`, { method: 'DELETE' }, accessToken);

export const deleteReadNotifications = (accessToken: string) =>
  apiRequest<void>('/api/notifications/read', { method: 'DELETE' }, accessToken);

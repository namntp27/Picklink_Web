import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  Bell,
  BellRing,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  ShieldCheck,
  Ticket,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { PaginationControls } from '../../components/PaginationControls';
import { useToast } from '../../components/ui/ToastRegion';
import {
  deleteNotification,
  deleteReadNotifications,
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationFilter,
  type NotificationItem,
  type NotificationTone,
  type NotificationType,
} from '../../api/notifications';
import { useNotificationRealtime } from '../../hooks/useNotificationRealtime';

const pageSize = 10;

const filterOptions: Array<{ label: string; value: NotificationFilter }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chưa đọc', value: 'unread' },
  { label: 'Ghép trận', value: 'match' },
  { label: 'Thanh toán', value: 'payment' },
  { label: 'Đặt sân', value: 'court' },
  { label: 'Xé vé', value: 'ticket' },
  { label: 'CLB', value: 'club' },
  { label: 'Hệ thống', value: 'system' },
];

const ownerFilterOptions: Array<{ label: string; value: NotificationFilter }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chưa đọc', value: 'unread' },
  { label: 'Đặt sân', value: 'court' },
  { label: 'Ghép trận', value: 'match' },
  { label: 'Xé vé', value: 'ticket' },
  { label: 'Thanh toán', value: 'payment' },
  { label: 'Hệ thống', value: 'system' },
];

const typeLabels: Record<NotificationType, string> = {
  match: 'Ghép trận',
  payment: 'Thanh toán',
  court: 'Đặt sân',
  ticket: 'Xé vé',
  club: 'Câu lạc bộ',
  system: 'Hệ thống',
};

const notificationTypeConfig: Record<
  NotificationType,
  {
    icon: typeof Bell;
    className: string;
  }
> = {
  match: {
    icon: UserPlus,
    className: 'bg-[#e2ff57] text-[#102414]',
  },
  payment: {
    icon: CreditCard,
    className: 'bg-[#edf5e9] text-[#477313]',
  },
  court: {
    icon: CalendarClock,
    className: 'bg-[#e5f0e5] text-[#276b3f]',
  },
  ticket: {
    icon: Ticket,
    className: 'bg-[#fff4d8] text-[#9a6700]',
  },
  club: {
    icon: Users,
    className: 'bg-[#edf5e9] text-[#477313]',
  },
  system: {
    icon: ShieldCheck,
    className: 'bg-[#e8ece7] text-[#53645b]',
  },
};

const toneClassNames: Record<NotificationTone, string> = {
  default: 'border-l-transparent',
  urgent: 'border-l-[#eab526]',
  success: 'border-l-[#98d951]',
};

const formatNotificationTime = (value: string) => {
  const date = new Date(value);

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const Notifications = ({ workspace = 'player' }: { workspace?: 'player' | 'owner' }) => {
  const shouldReduceMotion = useReducedMotion();
  const { token } = useAuth();
  const notify = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize,
    totalCount: 0,
    totalPages: 1,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      setPagination({ page: 1, pageSize, totalCount: 0, totalPages: 1 });
      setUnreadCount(0);
      setError('Vui lòng đăng nhập để xem thông báo.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [result, unreadResult] = await Promise.all([
        listNotifications(token, {
          page,
          pageSize,
          unreadOnly: activeFilter === 'unread',
          type: activeFilter !== 'all' && activeFilter !== 'unread' ? activeFilter : undefined,
        }),
        getUnreadNotificationCount(token),
      ]);
      setNotifications(result.items);
      setPagination(result);
      setUnreadCount(unreadResult.count);
      setError('');
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'Không thể tải thông báo.');
      setError(message);
      notify(message, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, notify, page, token]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useNotificationRealtime(token, () => {
    void loadNotifications();
  });

  const urgentNotifications = useMemo(
    () => notifications.filter((notification) => !notification.isRead && notification.tone === 'urgent'),
    [notifications],
  );
  const latestUnreadNotification = notifications.find((notification) => !notification.isRead);
  const hasReadNotifications = notifications.some((notification) => notification.isRead);

  const switchFilter = (filter: NotificationFilter) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const markAsRead = async (notificationId: number) => {
    if (!token) return;
    try {
      await markNotificationAsRead(token, notificationId);
      await loadNotifications();
    } catch (requestError) {
      notify(getErrorMessage(requestError, 'Không thể đánh dấu đã đọc.'), 'error');
    }
  };

  const markAllAsRead = async () => {
    if (!token || unreadCount === 0) return;
    try {
      await markAllNotificationsAsRead(token);
      await loadNotifications();
    } catch (requestError) {
      notify(getErrorMessage(requestError, 'Không thể đánh dấu tất cả đã đọc.'), 'error');
    }
  };

  const removeNotification = async (notificationId: number) => {
    if (!token) return;
    if (!window.confirm('Xóa thông báo này?')) return;
    try {
      await deleteNotification(token, notificationId);
      await loadNotifications();
    } catch (requestError) {
      notify(getErrorMessage(requestError, 'Không thể xóa thông báo.'), 'error');
    }
  };

  const clearReadNotifications = async () => {
    if (!token || !hasReadNotifications) return;
    if (!window.confirm('Xóa tất cả thông báo đã đọc?')) return;
    try {
      await deleteReadNotifications(token);
      await loadNotifications();
    } catch (requestError) {
      notify(getErrorMessage(requestError, 'Không thể xóa thông báo đã đọc.'), 'error');
    }
  };

  return (
    <div className={workspace === 'owner' ? 'text-[#0b2228]' : 'min-h-dvh bg-[#f8fbf4] pt-[72px] text-[#0b2228]'}>
      <section className="relative overflow-hidden bg-[#081d24] px-4 py-5 text-white sm:px-6 lg:px-8" data-no-reveal>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(152,217,81,0.17),transparent_32%),linear-gradient(120deg,#081d24,#143f34)]" />
        <div className="relative mx-auto flex max-w-[1120px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[12px] font-bold text-[#dff6b2]">
              <BellRing aria-hidden="true" className="h-4 w-4 text-[#e2ff57]" />
              {workspace === 'owner' ? 'Trung tâm vận hành' : 'Trung tâm thông báo'}
            </p>
            <h1 className="mt-1.5 text-[28px] font-bold leading-tight tracking-[-0.035em] sm:text-[32px]">
              {workspace === 'owner' ? 'Thông báo chủ sân' : 'Thông báo'}
            </h1>
            <p className="mt-1 max-w-[62ch] text-[13px] leading-5 text-white/68">
              {workspace === 'owner'
                ? 'Theo dõi đơn đặt sân, ghép trận, xé vé và giao dịch chuyển khoản.'
                : 'Lời mời, thanh toán, lịch sân và hoạt động cộng đồng tại một nơi.'}
            </p>
          </div>

          <div className="grid w-full grid-cols-2 overflow-hidden rounded-xl border border-white/12 bg-white/8 sm:w-auto sm:min-w-[250px]">
            <div className="px-4 py-2.5">
              <p className="font-mono text-[20px] font-bold leading-none text-[#e2ff57]">{unreadCount}</p>
              <p className="mt-1 text-[11px] font-medium text-white/62">chưa đọc</p>
            </div>
            <div className="border-l border-white/12 px-4 py-2.5">
              <p className="font-mono text-[20px] font-bold leading-none text-[#e2ff57]">{urgentNotifications.length}</p>
              <p className="mt-1 text-[11px] font-medium text-white/62">cần xử lý</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1120px] grid-cols-1 gap-4 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:px-8">
        <div className="min-w-0 space-y-3">
          <section className="picklink-glow-surface rounded-xl border border-[#d8e4d4] bg-white p-2.5 shadow-[0_8px_22px_rgba(8,29,36,0.045)]">
            <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 gap-1.5 overflow-x-auto pb-1 scrollbar-none xl:pb-0">
                {(workspace === 'owner' ? ownerFilterOptions : filterOptions).map((filter) => (
                  <button
                    className={`picklink-glow-control h-8 shrink-0 rounded-lg px-2.5 text-[12px] font-bold transition-[background-color,color,transform] ${
                      activeFilter === filter.value
                        ? 'bg-[#0b2228] text-white'
                        : 'bg-[#edf5e9] text-[#53645b] hover:bg-[#e2ff57] hover:text-[#102414]'
                    }`}
                    key={filter.value}
                    onClick={() => switchFilter(filter.value)}
                    type="button"
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 border-t border-[#e0e9dc] pt-2 xl:border-l xl:border-t-0 xl:pl-2 xl:pt-0">
                <button
                  className="picklink-glow-control inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#b9cbb3] px-2.5 text-[12px] font-bold text-[#477313] hover:border-[#98d951] hover:bg-[#edf5e9] disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={unreadCount === 0}
                  onClick={() => void markAllAsRead()}
                  type="button"
                >
                  <CheckCheck aria-hidden="true" className="h-3.5 w-3.5" />
                  Đọc tất cả
                </button>
                <button
                  className="picklink-glow-control inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#d8e4d4] px-2.5 text-[12px] font-bold text-[#64736a] hover:bg-[#edf5e9] disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!hasReadNotifications}
                  onClick={() => void clearReadNotifications()}
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                  Xóa đã đọc
                </button>
              </div>
            </div>
          </section>

          <section className="picklink-glow-surface overflow-hidden rounded-xl border border-[#d8e4d4] bg-white shadow-[0_10px_28px_rgba(8,29,36,0.05)]">
            {isLoading && (
              <div className="p-6 text-center text-[13px] font-bold text-[#53645b]">Đang tải thông báo...</div>
            )}

            {!isLoading && error && (
              <div className="p-6 text-center">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#edf5e9] text-[#477313]">
                  <Bell aria-hidden="true" className="h-5 w-5" />
                </span>
                <h2 className="mt-3 text-[16px] font-bold">Chưa thể tải thông báo</h2>
                <p className="mt-1 text-[12px] leading-5 text-[#64736a]">{error}</p>
              </div>
            )}

            {!isLoading && !error && (
              <AnimatePresence initial={false}>
                {notifications.map((notification) => {
                  const config = notificationTypeConfig[notification.type] ?? notificationTypeConfig.system;
                  const NotificationIcon = config.icon;

                  return (
                    <motion.article
                      animate={{ opacity: 1, y: 0 }}
                      className={`border-b border-l-2 border-b-[#e0e9dc] transition-colors last:border-b-0 hover:bg-[#f4f9ef] ${toneClassNames[notification.tone] ?? toneClassNames.default} ${
                        notification.isRead ? 'bg-white' : 'bg-[#fbfdf8]'
                      }`}
                      data-motion-managed
                      exit={shouldReduceMotion ? undefined : { opacity: 0, y: -5 }}
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 7 }}
                      key={notification.notificationId}
                      layout
                      transition={{ duration: shouldReduceMotion ? 0.01 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                    >
                      <div className="flex min-w-0 items-start gap-2.5 px-3 py-2.5 sm:px-3.5">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.className}`}>
                          <NotificationIcon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            {!notification.isRead && (
                              <span aria-label="Chưa đọc" className="h-1.5 w-1.5 rounded-full bg-[#d69e00]" role="img" />
                            )}
                            <span className="rounded-md bg-[#edf5e9] px-1.5 py-0.5 text-[10px] font-bold text-[#53645b]">
                              {typeLabels[notification.type] ?? 'Khác'}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#7a887e]">
                              <Clock aria-hidden="true" className="h-3 w-3" />
                              {formatNotificationTime(notification.createdAt)}
                            </span>
                          </div>

                          <div className="mt-1.5 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h2 className="text-[14px] font-bold leading-5 tracking-[-0.01em]">{notification.title}</h2>
                              <p className="mt-0.5 line-clamp-2 text-[12px] leading-5 text-[#64736a]">{notification.message}</p>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                              {notification.linkTo && notification.linkLabel && (
                                <Link
                                  className="picklink-glow-control inline-flex h-8 items-center justify-center rounded-lg bg-[#0b2228] px-2.5 text-[11px] font-bold text-white hover:bg-[#143f34]"
                                  onClick={() => void markAsRead(notification.notificationId)}
                                  to={notification.linkTo}
                                >
                                  {notification.linkLabel}
                                </Link>
                              )}
                              {!notification.isRead && (
                                <button
                                  aria-label={`Đánh dấu đã đọc: ${notification.title}`}
                                  className="picklink-glow-control inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8e4d4] text-[#477313] hover:border-[#98d951] hover:bg-[#edf5e9]"
                                  onClick={() => void markAsRead(notification.notificationId)}
                                  title="Đánh dấu đã đọc"
                                  type="button"
                                >
                                  <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                aria-label={`Xóa thông báo ${notification.title}`}
                                className="picklink-glow-control inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8e4d4] text-[#718077] hover:border-[#e7c8c4] hover:bg-[#fff1ef] hover:text-[#a33535]"
                                onClick={() => void removeNotification(notification.notificationId)}
                                title="Xóa thông báo"
                                type="button"
                              >
                                <X aria-hidden="true" className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            )}

            {!isLoading && !error && notifications.length === 0 && (
              <div className="p-6 text-center">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#edf5e9] text-[#477313]">
                  <Bell aria-hidden="true" className="h-5 w-5" />
                </span>
                <h2 className="mt-3 text-[16px] font-bold">Không có thông báo phù hợp</h2>
                <p className="mt-1 text-[12px] leading-5 text-[#64736a]">Hãy đổi bộ lọc hoặc quay lại khi có hoạt động mới.</p>
              </div>
            )}
          </section>

          <PaginationControls page={pagination} onPageChange={setPage} />
        </div>

        <aside className="space-y-3 lg:sticky lg:top-24 lg:self-start">
          <section className="picklink-glow-surface rounded-xl border border-[#b9dca8] bg-white p-3.5 shadow-[0_8px_22px_rgba(8,29,36,0.045)]">
            <h2 className="flex items-center gap-2 text-[15px] font-bold">
              <BellRing aria-hidden="true" className="h-4 w-4 text-[#477313]" />
              Việc cần xử lý
            </h2>

            <div className="mt-2.5 divide-y divide-[#e0e9dc]">
              {urgentNotifications.length > 0 ? (
                urgentNotifications.map((notification) => (
                  <div className="py-2.5 first:pt-0 last:pb-0" key={notification.notificationId}>
                    <p className="text-[12px] font-bold leading-4">{notification.title}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-[18px] text-[#64736a]">{notification.message}</p>
                    {notification.linkTo && notification.linkLabel && (
                      <Link
                        className="picklink-glow-control mt-2 inline-flex h-7 items-center justify-center rounded-lg bg-[#0b2228] px-2.5 text-[10px] font-bold text-white hover:bg-[#143f34]"
                        onClick={() => void markAsRead(notification.notificationId)}
                        to={notification.linkTo}
                      >
                        {notification.linkLabel}
                      </Link>
                    )}
                  </div>
                ))
              ) : (
                <p className="rounded-lg bg-[#edf5e9] px-3 py-2.5 text-[11px] font-bold text-[#477313]">Không có việc khẩn cấp.</p>
              )}
            </div>
          </section>

          <section className="picklink-glow-surface rounded-xl border border-[#d8e4d4] bg-white p-3.5 shadow-[0_8px_22px_rgba(8,29,36,0.045)]">
            <h2 className="flex items-center gap-2 text-[15px] font-bold">
              <MapPin aria-hidden="true" className="h-4 w-4 text-[#477313]" />
              Hoạt động gần nhất
            </h2>

            {latestUnreadNotification ? (
              <div className="mt-2.5 border-t border-[#e0e9dc] pt-2.5">
                <p className="text-[12px] font-bold leading-4">{latestUnreadNotification.title}</p>
                <p className="mt-1 text-[10px] font-semibold text-[#718077]">
                  {formatNotificationTime(latestUnreadNotification.createdAt)}
                </p>
              </div>
            ) : (
              <p className="mt-2.5 text-[11px] leading-4 text-[#64736a]">Tất cả thông báo hiện đã được đọc.</p>
            )}
          </section>
        </aside>
      </main>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
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
  Settings,
  ShieldCheck,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

type NotificationType = 'match' | 'payment' | 'court' | 'club' | 'tournament' | 'system';
type NotificationFilter = 'all' | 'unread' | NotificationType;
type NotificationTone = 'default' | 'urgent' | 'success';

type NotificationItem = {
  id: number;
  type: NotificationType;
  tone: NotificationTone;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  meta: string;
  linkTo?: string;
  linkLabel?: string;
};

type NotificationPreference = {
  id: NotificationType;
  label: string;
  description: string;
  enabled: boolean;
};

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    type: 'match',
    tone: 'urgent',
    title: 'Có người muốn tham gia trận của bạn',
    message: 'Minh Tuấn đã bấm tham gia trận đôi tại Pickleball Pro Duy Tân. Trận còn thiếu 1 người để đủ đội hình.',
    createdAt: '2026-06-18T08:20:00',
    read: false,
    meta: 'Ghép trận',
    linkTo: '/matches/1',
    linkLabel: 'Xem trận',
  },
  {
    id: 2,
    type: 'payment',
    tone: 'urgent',
    title: 'Đến lượt bạn thanh toán tiền sân',
    message: 'Trận tối Thủ Đức đã đủ người. Bạn cần thanh toán 94.000 đ để giữ lịch sân.',
    createdAt: '2026-06-18T07:45:00',
    read: false,
    meta: 'Thanh toán',
    linkTo: '/my-matches',
    linkLabel: 'Thanh toán',
  },
  {
    id: 3,
    type: 'court',
    tone: 'default',
    title: 'Lịch sân đã được giữ tạm',
    message: 'C.Lông 1, ngày 18/06/2026 lúc 7:00 - 8:00 đang được giữ trong 10 phút.',
    createdAt: '2026-06-18T07:10:00',
    read: false,
    meta: 'Đặt sân',
    linkTo: '/court/1/schedule',
    linkLabel: 'Xem lịch sân',
  },
  {
    id: 4,
    type: 'club',
    tone: 'success',
    title: 'Yêu cầu vào câu lạc bộ đã được duyệt',
    message: 'Câu lạc bộ PickleHub Mỹ Đình đã chấp nhận bạn làm thành viên.',
    createdAt: '2026-06-17T20:30:00',
    read: true,
    meta: 'Câu lạc bộ',
    linkTo: '/clubs/2',
    linkLabel: 'Xem CLB',
  },
  {
    id: 5,
    type: 'tournament',
    tone: 'default',
    title: 'Giải đấu mới gần bạn',
    message: 'Hanoi Summer Pickleball Open mở đăng ký hạng 3.0 - 3.5 đến hết tuần này.',
    createdAt: '2026-06-17T16:15:00',
    read: true,
    meta: 'Giải đấu',
    linkTo: '/tournaments',
    linkLabel: 'Xem giải đấu',
  },
  {
    id: 6,
    type: 'system',
    tone: 'success',
    title: 'Hồ sơ thi đấu đã được cập nhật',
    message: 'Trình độ hiện tại của bạn đã được lưu là 3.0 - 3.5. Picklink sẽ dùng dữ liệu này để gợi ý trận phù hợp hơn.',
    createdAt: '2026-06-16T21:00:00',
    read: true,
    meta: 'Tài khoản',
    linkTo: '/my-matches',
    linkLabel: 'Xem trận của tôi',
  },
];

const filterOptions: Array<{ label: string; value: NotificationFilter }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chưa đọc', value: 'unread' },
  { label: 'Ghép trận', value: 'match' },
  { label: 'Thanh toán', value: 'payment' },
  { label: 'Đặt sân', value: 'court' },
  { label: 'CLB', value: 'club' },
  { label: 'Giải đấu', value: 'tournament' },
];

const notificationTypeConfig: Record<
  NotificationType,
  {
    icon: React.ElementType;
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
  club: {
    icon: Users,
    className: 'bg-[#edf5e9] text-[#477313]',
  },
  tournament: {
    icon: Trophy,
    className: 'bg-[#e2ff57] text-[#102414]',
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

const initialPreferences: NotificationPreference[] = [
  {
    id: 'match',
    label: 'Ghép trận',
    description: 'Lời mời, người tham gia và thay đổi trạng thái trận',
    enabled: true,
  },
  {
    id: 'payment',
    label: 'Thanh toán',
    description: 'Nhắc thanh toán và xác nhận giao dịch',
    enabled: true,
  },
  {
    id: 'court',
    label: 'Lịch sân',
    description: 'Giữ sân, đổi giờ và cập nhật sân trống',
    enabled: true,
  },
  {
    id: 'club',
    label: 'Câu lạc bộ',
    description: 'Duyệt thành viên, bài đăng và hoạt động CLB',
    enabled: false,
  },
];

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

export const Notifications = () => {
  const shouldReduceMotion = useReducedMotion();
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>('all');
  const [preferences, setPreferences] = useState<NotificationPreference[]>(initialPreferences);

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        if (activeFilter === 'all') {
          return true;
        }

        if (activeFilter === 'unread') {
          return !notification.read;
        }

        return notification.type === activeFilter;
      }),
    [activeFilter, notifications],
  );

  const counts = useMemo(
    () =>
      notifications.reduce(
        (currentCounts, notification) => ({
          ...currentCounts,
          all: currentCounts.all + 1,
          unread: currentCounts.unread + (notification.read ? 0 : 1),
          [notification.type]: currentCounts[notification.type] + 1,
        }),
        { all: 0, unread: 0, match: 0, payment: 0, court: 0, club: 0, tournament: 0, system: 0 } as Record<
          NotificationFilter | 'system',
          number
        >,
      ),
    [notifications],
  );

  const unreadNotifications = notifications.filter((notification) => !notification.read);
  const urgentNotifications = unreadNotifications.filter((notification) => notification.tone === 'urgent');
  const latestUnreadNotification = unreadNotifications[0];

  const markAsRead = (notificationId: number) => {
    setNotifications((current) =>
      current.map((notification) => (notification.id === notificationId ? { ...notification, read: true } : notification)),
    );
  };

  const markAllAsRead = () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
  };

  const removeNotification = (notificationId: number) => {
    setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
  };

  const clearReadNotifications = () => {
    setNotifications((current) => current.filter((notification) => !notification.read));
  };

  const togglePreference = (preferenceId: NotificationType) => {
    setPreferences((current) =>
      current.map((preference) =>
        preference.id === preferenceId ? { ...preference, enabled: !preference.enabled } : preference,
      ),
    );
  };

  return (
    <div className="min-h-dvh bg-[#f8fbf4] pt-[72px] text-[#0b2228]">
      <section className="relative overflow-hidden bg-[#081d24] px-4 py-5 text-white sm:px-6 lg:px-8" data-no-reveal>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(152,217,81,0.17),transparent_32%),linear-gradient(120deg,#081d24,#143f34)]" />
        <div className="relative mx-auto flex max-w-[1120px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-[12px] font-bold text-[#dff6b2]">
              <BellRing aria-hidden="true" className="h-4 w-4 text-[#e2ff57]" />
              Trung tâm thông báo
            </p>
            <h1 className="mt-1.5 text-[28px] font-bold leading-tight tracking-[-0.035em] sm:text-[32px]">Thông báo</h1>
            <p className="mt-1 max-w-[62ch] text-[13px] leading-5 text-white/68">
              Lời mời, thanh toán, lịch sân và hoạt động cộng đồng tại một nơi.
            </p>
          </div>

          <div className="grid w-full grid-cols-2 overflow-hidden rounded-xl border border-white/12 bg-white/8 sm:w-auto sm:min-w-[250px]">
            <div className="px-4 py-2.5">
              <p className="font-mono text-[20px] font-bold leading-none text-[#e2ff57]">{counts.unread}</p>
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
                {filterOptions.map((filter) => (
                  <button
                    className={`picklink-glow-control h-8 shrink-0 rounded-lg px-2.5 text-[12px] font-bold transition-[background-color,color,transform] ${
                      activeFilter === filter.value
                        ? 'bg-[#0b2228] text-white'
                        : 'bg-[#edf5e9] text-[#53645b] hover:bg-[#e2ff57] hover:text-[#102414]'
                    }`}
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                    type="button"
                  >
                    {filter.label} ({counts[filter.value]})
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 border-t border-[#e0e9dc] pt-2 xl:border-l xl:border-t-0 xl:pl-2 xl:pt-0">
                <button
                  className="picklink-glow-control inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#b9cbb3] px-2.5 text-[12px] font-bold text-[#477313] hover:border-[#98d951] hover:bg-[#edf5e9] disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={counts.unread === 0}
                  onClick={markAllAsRead}
                  type="button"
                >
                  <CheckCheck aria-hidden="true" className="h-3.5 w-3.5" />
                  Đọc tất cả
                </button>
                <button
                  className="picklink-glow-control inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[#d8e4d4] px-2.5 text-[12px] font-bold text-[#64736a] hover:bg-[#edf5e9] disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={notifications.every((notification) => !notification.read)}
                  onClick={clearReadNotifications}
                  type="button"
                >
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                  Xóa đã đọc
                </button>
              </div>
            </div>
          </section>

          <section className="picklink-glow-surface overflow-hidden rounded-xl border border-[#d8e4d4] bg-white shadow-[0_10px_28px_rgba(8,29,36,0.05)]">
            <AnimatePresence initial={false}>
              {filteredNotifications.map((notification) => {
                const config = notificationTypeConfig[notification.type];
                const NotificationIcon = config.icon;

                return (
                  <motion.article
                    animate={{ opacity: 1, y: 0 }}
                    className={`border-b border-l-2 border-b-[#e0e9dc] transition-colors last:border-b-0 hover:bg-[#f4f9ef] ${toneClassNames[notification.tone]} ${
                      notification.read ? 'bg-white' : 'bg-[#fbfdf8]'
                    }`}
                    data-motion-managed
                    exit={shouldReduceMotion ? undefined : { opacity: 0, y: -5 }}
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 7 }}
                    key={notification.id}
                    layout
                    transition={{ duration: shouldReduceMotion ? 0.01 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <div className="flex min-w-0 items-start gap-2.5 px-3 py-2.5 sm:px-3.5">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.className}`}>
                        <NotificationIcon aria-hidden="true" className="h-4 w-4" strokeWidth={1.8} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          {!notification.read && (
                            <span aria-label="Chưa đọc" className="h-1.5 w-1.5 rounded-full bg-[#d69e00]" role="img" />
                          )}
                          <span className="rounded-md bg-[#edf5e9] px-1.5 py-0.5 text-[10px] font-bold text-[#53645b]">
                            {notification.meta}
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
                                onClick={() => markAsRead(notification.id)}
                                to={notification.linkTo}
                              >
                                {notification.linkLabel}
                              </Link>
                            )}
                            {!notification.read && (
                              <button
                                aria-label={`Đánh dấu đã đọc: ${notification.title}`}
                                className="picklink-glow-control inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8e4d4] text-[#477313] hover:border-[#98d951] hover:bg-[#edf5e9]"
                                onClick={() => markAsRead(notification.id)}
                                title="Đánh dấu đã đọc"
                                type="button"
                              >
                                <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              aria-label={`Xóa thông báo ${notification.title}`}
                              className="picklink-glow-control inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#d8e4d4] text-[#718077] hover:border-[#e7c8c4] hover:bg-[#fff1ef] hover:text-[#a33535]"
                              onClick={() => removeNotification(notification.id)}
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

            {filteredNotifications.length === 0 && (
              <div className="p-6 text-center">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#edf5e9] text-[#477313]">
                  <Bell aria-hidden="true" className="h-5 w-5" />
                </span>
                <h2 className="mt-3 text-[16px] font-bold">Không có thông báo phù hợp</h2>
                <p className="mt-1 text-[12px] leading-5 text-[#64736a]">Hãy đổi bộ lọc hoặc quay lại khi có hoạt động mới.</p>
              </div>
            )}
          </section>
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
                  <div className="py-2.5 first:pt-0 last:pb-0" key={notification.id}>
                    <p className="text-[12px] font-bold leading-4">{notification.title}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-[18px] text-[#64736a]">{notification.message}</p>
                    {notification.linkTo && notification.linkLabel && (
                      <Link
                        className="picklink-glow-control mt-2 inline-flex h-7 items-center justify-center rounded-lg bg-[#0b2228] px-2.5 text-[10px] font-bold text-white hover:bg-[#143f34]"
                        onClick={() => markAsRead(notification.id)}
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
              <Settings aria-hidden="true" className="h-4 w-4 text-[#477313]" />
              Cài đặt nhận tin
            </h2>

            <div className="mt-2.5 divide-y divide-[#e0e9dc]">
              {preferences.map((preference) => (
                <div
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                  key={preference.id}
                >
                  <span className="min-w-0">
                    <span className="block text-[12px] font-bold">{preference.label}</span>
                    <span className="mt-0.5 block text-[10px] leading-4 text-[#718077]">{preference.description}</span>
                  </span>
                  <button
                    aria-checked={preference.enabled}
                    aria-label={`${preference.enabled ? 'Tắt' : 'Bật'} thông báo ${preference.label}`}
                    className={`picklink-glow-control relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                      preference.enabled ? 'bg-[#477313]' : 'bg-[#cbd6c7]'
                    }`}
                    onClick={() => togglePreference(preference.id)}
                    role="switch"
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                        preference.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
                      }`}
                    />
                  </button>
                </div>
              ))}
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

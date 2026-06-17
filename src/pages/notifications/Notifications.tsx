import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
    className: 'bg-primary/10 text-primary',
  },
  payment: {
    icon: CreditCard,
    className: 'bg-[#fff4d8] text-[#755400]',
  },
  court: {
    icon: CalendarClock,
    className: 'bg-[#edf7ff] text-[#1d5b7a]',
  },
  club: {
    icon: Users,
    className: 'bg-[#eaf7df] text-primary',
  },
  tournament: {
    icon: Trophy,
    className: 'bg-[#f2edff] text-[#5a3a90]',
  },
  system: {
    icon: ShieldCheck,
    className: 'bg-surface-container-low text-on-surface-variant',
  },
};

const toneClassNames: Record<NotificationTone, string> = {
  default: 'border-outline-variant',
  urgent: 'border-[#eab526]',
  success: 'border-primary/40',
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
    <div className="min-h-screen bg-[#f9f9ff] pt-[72px] text-on-surface">
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-margin-desktop md:py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-lg bg-white/12 px-4 py-2 text-[13px] font-bold">
                <BellRing className="h-4 w-4" />
                Trung tâm thông báo
              </span>
              <h1 className="mt-4 text-[32px] font-bold leading-tight md:text-[44px]">Thông báo</h1>
              <p className="mt-3 max-w-2xl text-[16px] leading-7 text-white/85">
                Theo dõi lời mời ghép trận, thanh toán tiền sân, lịch đặt sân và hoạt động câu lạc bộ của bạn.
              </p>
            </div>

            <div className="rounded-lg border border-white/18 bg-white/10 p-5">
              <p className="text-[13px] font-bold uppercase text-white/72">Cần chú ý</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/12 p-4">
                  <p className="text-[28px] font-bold">{counts.unread}</p>
                  <p className="text-[13px] font-medium text-white/78">chưa đọc</p>
                </div>
                <div className="rounded-lg bg-white/12 p-4">
                  <p className="text-[28px] font-bold">{urgentNotifications.length}</p>
                  <p className="text-[13px] font-medium text-white/78">cần xử lý</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-4 py-8 md:px-margin-desktop lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-outline-variant bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {filterOptions.map((filter) => (
                  <button
                    className={`shrink-0 rounded-lg px-4 py-3 text-[14px] font-bold transition-colors ${
                      activeFilter === filter.value
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-primary/10 hover:text-primary'
                    }`}
                    key={filter.value}
                    onClick={() => setActiveFilter(filter.value)}
                    type="button"
                  >
                    {filter.label} ({counts[filter.value]})
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:w-auto">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-[14px] font-bold text-primary hover:bg-primary/10"
                  disabled={counts.unread === 0}
                  onClick={markAllAsRead}
                  type="button"
                >
                  <CheckCheck className="h-5 w-5" />
                  Đánh dấu đã đọc
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-[14px] font-bold text-on-surface-variant hover:bg-surface-container-low"
                  disabled={notifications.every((notification) => !notification.read)}
                  onClick={clearReadNotifications}
                  type="button"
                >
                  <Trash2 className="h-5 w-5" />
                  Xóa đã đọc
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            {filteredNotifications.map((notification) => {
              const config = notificationTypeConfig[notification.type];
              const NotificationIcon = config.icon;

              return (
                <article
                  className={`rounded-lg border bg-white p-5 shadow-sm transition-colors hover:border-primary ${toneClassNames[notification.tone]} ${
                    notification.read ? 'opacity-78' : ''
                  }`}
                  key={notification.id}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex min-w-0 gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${config.className}`}>
                        <NotificationIcon className="h-6 w-6" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {!notification.read && <span className="h-2.5 w-2.5 rounded-full bg-[#eab526]" />}
                          <span className="rounded-full bg-surface-container-low px-3 py-1 text-[12px] font-bold text-on-surface-variant">
                            {notification.meta}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-on-surface-variant">
                            <Clock className="h-3.5 w-3.5" />
                            {formatNotificationTime(notification.createdAt)}
                          </span>
                        </div>

                        <h2 className="mt-3 text-[20px] font-bold leading-tight">{notification.title}</h2>
                        <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">{notification.message}</p>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
                      {notification.linkTo && notification.linkLabel && (
                        <Link
                          className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90 md:w-auto"
                          onClick={() => markAsRead(notification.id)}
                          to={notification.linkTo}
                        >
                          {notification.linkLabel}
                        </Link>
                      )}
                      {!notification.read && (
                        <button
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-[14px] font-bold text-on-surface hover:bg-surface-container-low md:w-auto"
                          onClick={() => markAsRead(notification.id)}
                          type="button"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                          Đã đọc
                        </button>
                      )}
                      <button
                        aria-label={`Xóa thông báo ${notification.title}`}
                        className="flex h-12 w-full items-center justify-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-[#ffe8e8] hover:text-[#a33535] sm:w-12"
                        onClick={() => removeNotification(notification.id)}
                        type="button"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredNotifications.length === 0 && (
              <div className="rounded-lg border border-outline-variant bg-white p-8 text-center shadow-sm">
                <Bell className="mx-auto h-10 w-10 text-primary" />
                <h2 className="mt-3 text-[20px] font-bold">Không có thông báo phù hợp</h2>
                <p className="mt-2 text-[14px] text-on-surface-variant">Bạn có thể đổi bộ lọc hoặc quay lại sau khi có hoạt động mới.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-lg border border-primary bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[20px] font-bold">
              <BellRing className="h-5 w-5 text-primary" />
              Việc cần xử lý
            </h2>

            <div className="mt-4 space-y-3">
              {urgentNotifications.length > 0 ? (
                urgentNotifications.map((notification) => (
                  <div className="rounded-lg border border-outline-variant p-4" key={notification.id}>
                    <p className="text-[14px] font-bold">{notification.title}</p>
                    <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-on-surface-variant">{notification.message}</p>
                    {notification.linkTo && notification.linkLabel && (
                      <Link
                        className="mt-3 flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white hover:bg-primary/90"
                        onClick={() => markAsRead(notification.id)}
                        to={notification.linkTo}
                      >
                        {notification.linkLabel}
                      </Link>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-[#eaf7df] p-4 text-[14px] font-bold text-primary">Không có việc khẩn cấp.</div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[20px] font-bold">
              <Settings className="h-5 w-5 text-primary" />
              Cài đặt nhận tin
            </h2>

            <div className="mt-4 space-y-3">
              {preferences.map((preference) => (
                <label
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-outline-variant p-4 hover:bg-surface-container-low"
                  key={preference.id}
                >
                  <span>
                    <span className="block text-[14px] font-bold">{preference.label}</span>
                    <span className="mt-1 block text-[12px] leading-5 text-on-surface-variant">{preference.description}</span>
                  </span>
                  <input
                    checked={preference.enabled}
                    className="h-5 w-5 accent-primary"
                    onChange={() => togglePreference(preference.id)}
                    type="checkbox"
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[20px] font-bold">
              <MapPin className="h-5 w-5 text-primary" />
              Hoạt động gần nhất
            </h2>

            {latestUnreadNotification ? (
              <div className="mt-4 rounded-lg bg-surface-container-low p-4">
                <p className="text-[15px] font-bold">{latestUnreadNotification.title}</p>
                <p className="mt-2 text-[13px] font-medium text-on-surface-variant">
                  {formatNotificationTime(latestUnreadNotification.createdAt)}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-[14px] leading-6 text-on-surface-variant">Tất cả thông báo hiện đã được đọc.</p>
            )}
          </section>
        </aside>
      </main>
    </div>
  );
};

import { ArrowRight, CircleCheckBig, Users, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listNotifications, markNotificationAsRead, type NotificationItem } from '../../api/notifications';
import { useAuth } from '../../auth/AuthContext';
import { useNotificationRealtime } from '../../hooks/useNotificationRealtime';
import { ModalDialog } from '../ui/ModalDialog';

export const isAutomaticMatch = (notification: NotificationItem) =>
  notification.title === 'Đã tìm thấy trận đấu!'
  && /^\/opponents\/queue\/\d+$/.test(notification.linkTo ?? '');

export const MatchFoundAlert = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<NotificationItem | null>(null);

  useNotificationRealtime(token, (event) => {
    if (!token || user?.role !== 'player' || event.action !== 'Created' || !event.notificationId) return;

    void listNotifications(token, { type: 'match', page: 1, pageSize: 10 })
      .then(({ items }) => {
        const matchFound = items.find((item) => item.notificationId === event.notificationId);
        if (matchFound && isAutomaticMatch(matchFound)) setNotification(matchFound);
      })
      .catch(() => undefined);
  });

  if (!notification) return null;

  const enterWaitingRoom = () => {
    const destination = notification.linkTo!;
    setNotification(null);
    if (token) void markNotificationAsRead(token, notification.notificationId).catch(() => undefined);
    navigate(destination);
  };

  return (
    <ModalDialog
      aria-labelledby="match-found-title"
      canClose={false}
      className="w-[min(430px,calc(100vw-2rem))] overflow-hidden rounded-[28px] bg-[#f6f9f1] shadow-[0_28px_90px_rgba(3,25,31,0.38)]"
      onRequestClose={() => setNotification(null)}
    >
      <div className="relative overflow-hidden bg-[#082b30] px-6 pb-7 pt-6 text-white">
        <div className="absolute -right-12 -top-14 h-40 w-40 rounded-full border-[22px] border-[#dfff45]/15" />
        <button
          aria-label="Đóng thông báo ghép trận"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
          onClick={() => setNotification(null)}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative grid h-14 w-14 place-items-center rounded-2xl bg-[#dfff45] text-[#082b30] shadow-[0_10px_30px_rgba(223,255,69,0.22)]">
          <CircleCheckBig className="h-7 w-7" />
        </div>
        <p className="relative mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-[#dfff45]">
          Ghép trận thành công
        </p>
        <h2 className="relative mt-2 text-[25px] font-black leading-tight" id="match-found-title">
          Phòng chờ đã đủ người chơi
        </h2>
      </div>

      <div className="px-6 py-6">
        <div className="flex items-start gap-3 rounded-2xl border border-[#dce7d5] bg-white p-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#edf6e8] text-[#477313]">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[14px] font-extrabold text-[#0b2228]">Phòng chờ đã sẵn sàng</p>
            <p className="mt-1 text-[13px] leading-5 text-[#607067]">{notification.message}</p>
          </div>
        </div>

        <button
          className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#dfff45] px-5 text-[14px] font-black text-[#082b30] shadow-[0_10px_24px_rgba(109,140,24,0.18)] transition hover:bg-[#d5f63e]"
          onClick={enterWaitingRoom}
          type="button"
        >
          Vào phòng chờ
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </ModalDialog>
  );
};

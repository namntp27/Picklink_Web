import { useState, useTransition } from 'react';
import { UserPlus, Clock, UserCheck, UserX, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../../auth/AuthContext';
import { useToast } from '../../../components/ui/ToastRegion';
import {
  type FriendshipStatus,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
} from '../../../api/community';

export interface FriendButtonProps {
  targetUserId: number;
  targetUserName?: string;
  status?: FriendshipStatus;
  compact?: boolean;
  onStatusChange?: (newStatus: FriendshipStatus) => void;
  className?: string;
}

export const FriendButton = ({
  targetUserId,
  targetUserName = 'Người chơi',
  status: initialStatus = 'None',
  compact = false,
  onStatusChange,
  className = '',
}: FriendButtonProps) => {
  const { user, token, isAuthenticated } = useAuth();
  const notify = useToast();
  const [currentStatus, setCurrentStatus] = useState<FriendshipStatus>(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);

  // Sync internal state if prop updates
  if (initialStatus !== currentStatus && !isPending && initialStatus !== undefined) {
    setCurrentStatus(initialStatus);
  }

  // Do not render for self
  const currentUserIdNum = user?.id ? Number(user.id) : null;
  if (!targetUserId || (currentUserIdNum && currentUserIdNum === targetUserId)) {
    return null;
  }

  const handleSend = () => {
    if (!isAuthenticated || !token) {
      notify('Vui lòng đăng nhập để kết bạn.', 'info');
      return;
    }

    const prev = currentStatus;
    setCurrentStatus('PendingSent');
    onStatusChange?.('PendingSent');

    startTransition(async () => {
      try {
        const res = await sendFriendRequest(token, targetUserId);
        setCurrentStatus(res.status);
        onStatusChange?.(res.status);
        notify(res.message || `Đã gửi lời mời kết bạn đến ${targetUserName}.`, 'success');
      } catch (err) {
        setCurrentStatus(prev);
        onStatusChange?.(prev);
        notify(err instanceof Error ? err.message : 'Không thể gửi lời mời kết bạn.', 'error');
      }
    });
  };

  const handleAccept = () => {
    if (!isAuthenticated || !token) return;

    const prev = currentStatus;
    setCurrentStatus('Accepted');
    onStatusChange?.('Accepted');

    startTransition(async () => {
      try {
        const res = await acceptFriendRequest(token, targetUserId);
        setCurrentStatus(res.status);
        onStatusChange?.(res.status);
        notify(`Đã trở thành bạn bè với ${targetUserName}.`, 'success');
      } catch (err) {
        setCurrentStatus(prev);
        onStatusChange?.(prev);
        notify(err instanceof Error ? err.message : 'Không thể chấp nhận lời mời.', 'error');
      }
    });
  };

  const handleDecline = () => {
    if (!isAuthenticated || !token) return;

    const prev = currentStatus;
    setCurrentStatus('None');
    onStatusChange?.('None');

    startTransition(async () => {
      try {
        const res = await declineFriendRequest(token, targetUserId);
        setCurrentStatus(res.status);
        onStatusChange?.(res.status);
        notify('Đã từ chối lời mời kết bạn.', 'info');
      } catch (err) {
        setCurrentStatus(prev);
        onStatusChange?.(prev);
        notify(err instanceof Error ? err.message : 'Thao tác không thành công.', 'error');
      }
    });
  };

  const handleUnfriend = () => {
    if (!isAuthenticated || !token) return;

    const prev = currentStatus;
    setCurrentStatus('None');
    onStatusChange?.('None');
    setShowUnfriendConfirm(false);

    startTransition(async () => {
      try {
        const res = await removeFriend(token, targetUserId);
        setCurrentStatus(res.status);
        onStatusChange?.(res.status);
        notify(`Đã hủy kết bạn với ${targetUserName}.`, 'info');
      } catch (err) {
        setCurrentStatus(prev);
        onStatusChange?.(prev);
        notify(err instanceof Error ? err.message : 'Không thể hủy kết bạn.', 'error');
      }
    });
  };

  // 1. Pending Sent (Requested)
  if (currentStatus === 'PendingSent') {
    if (compact) {
      return (
        <button
          aria-label={`Đã gửi lời mời kết bạn đến ${targetUserName}`}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf5e9] text-[#718077] hover:bg-[#e0e9dc] hover:text-[#d32f2f] transition-colors cursor-pointer ${className}`}
          disabled={isPending}
          onClick={handleUnfriend}
          title="Nhấn để hủy lời mời kết bạn"
          type="button"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin text-[#477313]" /> : <Clock className="h-4 w-4" />}
        </button>
      );
    }

    return (
      <button
        aria-label={`Đã gửi lời mời kết bạn đến ${targetUserName}`}
        className={`inline-flex items-center gap-1.5 rounded-lg border border-[#cfe0c8] bg-[#f4f8f2] px-2.5 py-1 text-[11px] font-extrabold text-[#718077] hover:border-[#f0c2c2] hover:bg-[#fdeeee] hover:text-[#d32f2f] transition-colors cursor-pointer ${className}`}
        disabled={isPending}
        onClick={handleUnfriend}
        title="Nhấn để hủy lời mời kết bạn"
        type="button"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#477313]" />
        ) : (
          <Clock className="h-3.5 w-3.5 text-[#718077]" />
        )}
        <span>Đã gửi lời mời</span>
      </button>
    );
  }

  // 2. Pending Received (Incoming request)
  if (currentStatus === 'PendingReceived') {
    if (compact) {
      return (
        <div className={`inline-flex items-center gap-1 ${className}`}>
          <button
            aria-label={`Đồng ý kết bạn với ${targetUserName}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#477313] text-white hover:bg-[#3b5d0f] transition-colors cursor-pointer"
            disabled={isPending}
            onClick={handleAccept}
            title="Đồng ý kết bạn"
            type="button"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
          </button>
          <button
            aria-label={`Từ chối lời mời từ ${targetUserName}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf5e9] text-[#718077] hover:bg-[#fdeeee] hover:text-[#d32f2f] transition-colors cursor-pointer"
            disabled={isPending}
            onClick={handleDecline}
            title="Từ chối"
            type="button"
          >
            <UserX className="h-4 w-4" />
          </button>
        </div>
      );
    }

    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <button
          aria-label={`Đồng ý kết bạn với ${targetUserName}`}
          className="inline-flex items-center gap-1 rounded-lg bg-[#477313] px-2.5 py-1 text-[11px] font-extrabold text-white hover:bg-[#3b5d0f] transition-colors cursor-pointer"
          disabled={isPending}
          onClick={handleAccept}
          type="button"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserCheck className="h-3.5 w-3.5" />
          )}
          <span>Chấp nhận</span>
        </button>
        <button
          aria-label={`Từ chối lời mời từ ${targetUserName}`}
          className="inline-flex items-center rounded-lg border border-[#cfe0c8] bg-[#f4f8f2] px-2 py-1 text-[11px] font-extrabold text-[#718077] hover:bg-[#fdeeee] hover:text-[#d32f2f] transition-colors cursor-pointer"
          disabled={isPending}
          onClick={handleDecline}
          title="Từ chối"
          type="button"
        >
          <UserX className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // 3. Accepted (Friends)
  if (currentStatus === 'Accepted') {
    if (compact) {
      return (
        <button
          aria-label={`Bạn bè với ${targetUserName}`}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf5e9] text-[#477313] hover:bg-[#fdeeee] hover:text-[#d32f2f] transition-colors cursor-pointer ${className}`}
          disabled={isPending}
          onClick={() => {
            if (showUnfriendConfirm) {
              handleUnfriend();
            } else {
              setShowUnfriendConfirm(true);
              setTimeout(() => setShowUnfriendConfirm(false), 3000);
            }
          }}
          title={showUnfriendConfirm ? 'Nhấn lần nữa để hủy kết bạn' : 'Bạn bè (nhấn để hủy)'}
          type="button"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#477313]" />
          ) : showUnfriendConfirm ? (
            <UserX className="h-4 w-4 text-[#d32f2f]" />
          ) : (
            <Check className="h-4 w-4 text-[#477313]" />
          )}
        </button>
      );
    }

    return (
      <div className={`relative inline-block ${className}`}>
        <button
          aria-label={`Bạn bè với ${targetUserName}`}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-extrabold transition-colors cursor-pointer ${
            showUnfriendConfirm
              ? 'border-[#f0c2c2] bg-[#fdeeee] text-[#d32f2f]'
              : 'border-[#cfe0c8] bg-[#edf5e9] text-[#477313] hover:border-[#f0c2c2] hover:bg-[#fdeeee] hover:text-[#d32f2f]'
          }`}
          disabled={isPending}
          onClick={() => {
            if (showUnfriendConfirm) {
              handleUnfriend();
            } else {
              setShowUnfriendConfirm(true);
              setTimeout(() => setShowUnfriendConfirm(false), 3500);
            }
          }}
          title={showUnfriendConfirm ? 'Nhấn để xác nhận hủy kết bạn' : 'Bạn bè (nhấn để hủy kết bạn)'}
          type="button"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : showUnfriendConfirm ? (
            <UserX className="h-3.5 w-3.5 text-[#d32f2f]" />
          ) : (
            <Check className="h-3.5 w-3.5 text-[#477313]" />
          )}
          <span>{showUnfriendConfirm ? 'Hủy kết bạn?' : 'Bạn bè'}</span>
        </button>
      </div>
    );
  }

  // 4. Default: None (Not friends yet)
  if (compact) {
    return (
      <button
        aria-label={`Kết bạn với ${targetUserName}`}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#edf5e9] text-[#477313] hover:bg-[#477313] hover:text-white transition-colors cursor-pointer ${className}`}
        disabled={isPending}
        onClick={handleSend}
        title={`Kết bạn với ${targetUserName}`}
        type="button"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <button
      aria-label={`Kết bạn với ${targetUserName}`}
      className={`inline-flex items-center gap-1.5 rounded-lg border border-[#477313]/30 bg-[#edf5e9] hover:bg-[#477313] hover:text-white px-2.5 py-1 text-[11px] font-extrabold text-[#477313] transition-colors cursor-pointer ${className}`}
      disabled={isPending}
      onClick={handleSend}
      type="button"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-current" />
      ) : (
        <UserPlus className="h-3.5 w-3.5 text-current" />
      )}
      <span>Kết bạn</span>
    </button>
  );
};

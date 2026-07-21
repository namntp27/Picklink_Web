import { Check, LogOut, UserMinus, UserPlus, X } from 'lucide-react';
import {
  acceptMatchSlotReplacement,
  applyForMatchSlotReplacement,
  withdrawMatchSlotAbsence,
  rejectMatchSlotReplacement,
  removeMatchSlotReplacement,
  reportMatchSlotUnavailable,
  withdrawMatchSlotReplacement,
  type MatchBookingCheckInGroup,
} from '../../api/matches';

type Props = {
  token?: string | null;
  matchId: number;
  group: MatchBookingCheckInGroup;
  canReview: boolean;
  isBusy: boolean;
  run: (action: () => Promise<unknown>) => Promise<void>;
};

const requestStatusLabel: Record<string, string> = {
  Pending: 'Đang chờ thành viên phòng duyệt',
  Approved: 'Đã được duyệt thay thế',
  Rejected: 'Đơn đã bị từ chối',
  Withdrawn: 'Đã rút đơn',
  Left: 'Đã rời nhóm thay thế',
  Removed: 'Đã bị đưa khỏi nhóm thay thế',
};

export const MatchSlotReplacementPanel = ({ token, matchId, group, canReview, isBusy, run }: Props) => {
  const reportUnavailable = () => {
    if (!token) return;
    const reason = window.prompt('Lý do bạn bận buổi này (có thể để trống):', '');
    if (reason === null) return;
    void run(() => reportMatchSlotUnavailable(token, matchId, group.bookingCheckInGroupId, reason));
  };
  const absences = group.absences ?? [];

  return (
    <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
      {group.canReportUnavailable && (
        <button
          className="w-full rounded-lg border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-[11px] font-extrabold text-amber-100 transition hover:bg-amber-300/20 disabled:opacity-50"
          disabled={isBusy || !token}
          onClick={reportUnavailable}
          type="button"
        >
          Tôi bận buổi này · Tuyển người thay thế
        </button>
      )}

      {absences.map((absence) => {
        const pendingMine = absence.myRequestStatus === 'Pending';
        const approvedMine = absence.myRequestStatus === 'Approved';
        const replacementRequests = absence.replacementRequests ?? [];
        const approvedRequest = replacementRequests.find((request) => request.status === 'Approved');
        const pendingRequests = replacementRequests.filter((request) => request.status === 'Pending');
        const canChangeApproved = new Date(group.startTime).getTime() > Date.now();
        return (
          <div className="rounded-lg border border-[#e2ff57]/25 bg-[#e2ff57]/10 p-2.5" key={absence.matchSlotAbsenceId}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-extrabold text-white">
                  {absence.unavailablePlayerName} bận · {absence.status === 'Filled' ? 'Đã có người thay' : 'Đang tuyển thay thế'}
                </p>
                {absence.reason && <p className="mt-0.5 text-[10px] text-white/70">Lý do: {absence.reason}</p>}
              </div>
              {absence.canCancel && token && (
                <button
                  className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold text-white hover:bg-white/20"
                  disabled={isBusy}
                  onClick={() => window.confirm('Hủy báo bận và dừng tuyển người thay thế cho buổi này?') && void run(() => withdrawMatchSlotAbsence(token, matchId, absence.matchSlotAbsenceId))}
                  type="button"
                >
                  Hủy báo bận
                </button>
              )}
            </div>

            {approvedRequest && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-emerald-300/15 px-2 py-1.5 text-[10px] font-bold text-emerald-100">
                <span><Check className="mr-1 inline h-3 w-3" /> {approvedRequest.playerName} sẽ chơi thay · Trình {approvedRequest.skillLevel}</span>
                {canReview && canChangeApproved && token && (
                  <button
                    className="flex shrink-0 items-center gap-1 rounded-md bg-rose-400/20 px-2 py-1 text-[9px] font-extrabold text-rose-100 hover:bg-rose-400/35"
                    disabled={isBusy}
                    onClick={() => window.confirm(`Đưa ${approvedRequest.playerName} khỏi nhóm thay thế và mở tuyển lại slot này?`) && void run(() => removeMatchSlotReplacement(token, matchId, absence.matchSlotAbsenceId, approvedRequest.matchSlotReplacementRequestId))}
                    type="button"
                  >
                    <UserMinus className="h-3 w-3" /> Đưa khỏi nhóm
                  </button>
                )}
              </div>
            )}

            {absence.canApply && token && (
              <button
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#e2ff57] px-3 py-2 text-[11px] font-black text-[#092129] hover:bg-white disabled:opacity-50"
                disabled={isBusy}
                onClick={() => void run(() => applyForMatchSlotReplacement(token, matchId, absence.matchSlotAbsenceId))}
                type="button"
              >
                <UserPlus className="h-3.5 w-3.5" /> Đăng ký chơi thay đúng buổi này
              </button>
            )}

            {absence.myRequestStatus && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-white/10 px-2 py-1.5">
                <span className="text-[10px] font-bold text-white">{requestStatusLabel[absence.myRequestStatus]}</span>
                {pendingMine && token && (
                  <button
                    className="text-[10px] font-extrabold text-amber-200 hover:text-white"
                    disabled={isBusy}
                    onClick={() => window.confirm('Rút đơn đăng ký thay thế cho buổi này?') && void run(() => withdrawMatchSlotReplacement(token, matchId, absence.matchSlotAbsenceId))}
                    type="button"
                  >
                    Rút đơn
                  </button>
                )}
                {approvedMine && canChangeApproved && token && (
                  <button
                    className="flex items-center gap-1 text-[10px] font-extrabold text-amber-200 hover:text-white"
                    disabled={isBusy}
                    onClick={() => window.confirm('Rời nhóm thay thế và mở tuyển lại slot này?') && void run(() => withdrawMatchSlotReplacement(token, matchId, absence.matchSlotAbsenceId))}
                    type="button"
                  >
                    <LogOut className="h-3 w-3" /> Rời nhóm
                  </button>
                )}
              </div>
            )}

            {canReview && pendingRequests.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/60">Ứng viên thay thế</p>
                {pendingRequests.map((request) => (
                  <div className="flex items-center justify-between gap-2 rounded-md bg-white/10 px-2 py-1.5" key={request.matchSlotReplacementRequestId}>
                    <span className="text-[10px] font-bold text-white">{request.playerName} · Trình {request.skillLevel}</span>
                    <div className="flex gap-1">
                      <button
                        aria-label={`Từ chối ${request.playerName}`}
                        className="rounded-md bg-rose-400/20 p-1.5 text-rose-100 hover:bg-rose-400/35"
                        disabled={isBusy || !token}
                        onClick={() => token && window.confirm(`Từ chối ${request.playerName} chơi thay slot này?`) && void run(() => rejectMatchSlotReplacement(token, matchId, absence.matchSlotAbsenceId, request.matchSlotReplacementRequestId))}
                        type="button"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        aria-label={`Duyệt ${request.playerName}`}
                        className="rounded-md bg-emerald-400/25 p-1.5 text-emerald-100 hover:bg-emerald-400/40"
                        disabled={isBusy || !token}
                        onClick={() => token && window.confirm(`Duyệt ${request.playerName} vào nhóm thay thế cho slot này?`) && void run(() => acceptMatchSlotReplacement(token, matchId, absence.matchSlotAbsenceId, request.matchSlotReplacementRequestId))}
                        type="button"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

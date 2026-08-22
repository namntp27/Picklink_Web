import { AlertCircle, CheckCircle2, Loader2, RefreshCw, ShieldAlert, Zap } from 'lucide-react';

export interface SePayAutoPollingToggleProps {
  hasSePayConfigured?: boolean;
  isChecking?: boolean;
  countdownSeconds: number;
  intervalSeconds?: number;
  onManualCheck?: () => void;
  transferContent?: string | null;
  className?: string;
}

export const SePayAutoPollingToggle = ({
  hasSePayConfigured = true,
  isChecking = false,
  countdownSeconds,
  intervalSeconds = 5,
  onManualCheck,
  transferContent,
  className = '',
}: SePayAutoPollingToggleProps) => {
  const isConfigured = Boolean(hasSePayConfigured);
  const isAutoActive = isConfigured;
  const progressPercent = Math.max(0, Math.min(100, (countdownSeconds / intervalSeconds) * 100));

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        !isConfigured
          ? 'border-amber-200 bg-amber-50/70 p-4 text-amber-900'
          : isAutoActive
          ? 'border-primary/30 bg-[#eef8e6] p-4 text-[#0b2228] shadow-[0_8px_20px_rgba(71,115,19,0.06)]'
          : 'border-[#dbe8d3] bg-[#f8fbf4] p-4 text-[#0b2228]'
      } ${className}`}
    >
      {/* Header & Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors ${
              !isConfigured
                ? 'bg-amber-100 text-amber-700'
                : isAutoActive
                ? 'bg-[#e2ff57] text-[#102414]'
                : 'bg-white text-[#66766d] border border-[#dbe8d3]'
            }`}
          >
            <Zap className={`h-4 w-4 ${isAutoActive ? 'fill-current' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-black tracking-tight">
                Ưu tiên tự động kiểm tra qua SePay
              </span>
              {!isConfigured ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-200/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-900">
                  Chưa cấu hình
                </span>
              ) : isAutoActive ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#477313] px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e2ff57] opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#e2ff57]" />
                  </span>
                  Đang bật
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-white border border-[#dbe8d3] px-2 py-0.5 text-[10px] font-bold text-[#66766d]">
                  Đang tắt
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-[#66766d]">
              {!isConfigured
                ? 'Sân chưa liên kết SePay API Token để tự động nhận tiền'
                : isAutoActive
                ? 'Hệ thống kiểm tra ngay khi mở trang và tiếp tục đối soát giao dịch định kỳ'
                : 'Chuyển sang chế độ thủ công (tải ảnh biên lai để gửi chủ sân)'}
            </p>
          </div>
        </div>
      </div>

      {/* State A: Owner not configured SePay token */}
      {!isConfigured && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-white/80 p-3 text-[12px] leading-5 text-amber-900">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <strong className="font-bold">Cần liên kết SePay:</strong> Chủ sân chưa thiết lập API Token SePay. Vui lòng liên hệ chủ sân để hoàn tất cấu hình trước khi thanh toán.
          </div>
        </div>
      )}

      {/* State B: SePay is configured and turned ON */}
      {isConfigured && isAutoActive && (
        <div className="mt-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/90 p-3 border border-[#dbe8d3]">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[#0b2228]">
              {isChecking ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#477313]" />
              ) : (
                <RefreshCw className="h-4 w-4 text-[#477313]" />
              )}
              <span>
                {isChecking ? (
                  <strong className="text-[#477313]">Đang đối soát danh sách giao dịch SePay...</strong>
                ) : (
                  <>
                    Tự động quét lại sau:{' '}
                    <strong className="font-mono text-[14px] text-[#477313]">{countdownSeconds}s</strong>
                  </>
                )}
              </span>
            </div>

            {onManualCheck && (
              <button
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#dbe8d3] bg-[#f8fbf4] px-2.5 text-[11px] font-bold text-[#477313] transition-colors hover:bg-[#eef8e6] active:scale-95 disabled:opacity-50"
                disabled={isChecking}
                onClick={onManualCheck}
                type="button"
              >
                <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
                Kiểm tra ngay
              </button>
            )}
          </div>

          {/* Progress Bar for countdown */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#dbe8d3]/60">
            <div
              className="h-full bg-[#477313] transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="flex items-center gap-1.5 text-[11px] text-[#66766d]">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#477313]" />
            <span>
              Chuyển đúng nội dung {transferContent ? <code className='font-bold text-[#0b2228]'>{transferContent}</code> : 'mã thanh toán'} và chờ hệ thống xác nhận tự động. Bạn chưa cần gửi biên lai.
            </span>
          </p>
          <p className='flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-900'>
            <AlertCircle className='mt-0.5 h-3.5 w-3.5 shrink-0' />
            <span>
              <strong>Chỉ gửi biên lai khi cần:</strong> Nếu bạn đã thanh toán nhưng sau vài lần kiểm tra vẫn chưa thấy phản hồi, hãy dùng mục gửi biên lai bên dưới.
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

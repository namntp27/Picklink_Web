import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Ticket,
  Users,
} from 'lucide-react';
import {
  getMySchedule,
  scheduleEntryPath,
  type PlayerScheduleEntry,
  type PlayerScheduleEntryType,
} from '../../api/playerSchedule';
import { useAuth } from '../../auth/AuthContext';
import { MyActivityTabs } from '../../components/layout/MyActivityTabs';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { addCalendarMonths, monthGridDays, toDateKey } from '../../utils/bookingDateRange';

const monthLabel = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' });
const dayLabel = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
const time = (value: string) => value.slice(11, 16);

const weekdayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const typeMeta: Record<PlayerScheduleEntryType, { label: string; icon: typeof CalendarDays; dot: string; chip: string }> = {
  Booking: {
    label: 'Đặt sân',
    icon: CalendarDays,
    dot: 'bg-[#081d24]',
    chip: 'border-[#081d24]/25 bg-[#081d24] text-[#e2ff57]',
  },
  Ticket: {
    label: 'Xé vé',
    icon: Ticket,
    dot: 'bg-[#c2410c]',
    chip: 'border-[#c2410c]/25 bg-[#fff1e7] text-[#9a3412]',
  },
  Match: {
    label: 'Ghép trận',
    icon: Users,
    dot: 'bg-[#1d4ed8]',
    chip: 'border-[#1d4ed8]/25 bg-[#eaf0ff] text-[#1e40af]',
  },
};

const statusLabels: Record<string, string> = {
  Holding: 'Đang giữ chỗ',
  MatchWaiting: 'Chờ ghép trận',
  Confirmed: 'Đã đặt',
  Completed: 'Hoàn thành',
  PendingPayment: 'Chờ thanh toán',
  Paid: 'Đã thanh toán',
  CheckedIn: 'Đã check-in',
};

const paymentLabels: Record<string, string> = {
  Pending: 'Chờ chuyển khoản',
  WaitingForConfirmation: 'Chờ Owner xác nhận',
  Paid: 'Đã thanh toán',
};

const firstOfCurrentMonth = () => `${toDateKey(new Date()).slice(0, 7)}-01`;

export const MySchedule = () => {
  const { token } = useAuth();
  const [monthKey, setMonthKey] = useState(firstOfCurrentMonth);
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));

  const grid = useMemo(() => monthGridDays(monthKey), [monthKey]);
  const from = grid[0].key;
  const to = grid[grid.length - 1].key;

  const { data, error, loading, refresh } = useApiQuery(
    ['player-schedule', token, from, to],
    () => getMySchedule(token!, from, to),
    { enabled: Boolean(token), errorMessage: 'Không thể tải lịch chơi.' },
  );

  useScheduleRealtime(() => { void refresh(); });
  usePaymentRealtime(() => { void refresh(); });

  const entriesByDate = useMemo(() => {
    const grouped = new Map<string, PlayerScheduleEntry[]>();
    for (const entry of data?.entries ?? []) {
      const bucket = grouped.get(entry.date);
      if (bucket) bucket.push(entry);
      else grouped.set(entry.date, [entry]);
    }
    return grouped;
  }, [data]);

  const selectedEntries = entriesByDate.get(selectedDate) ?? [];
  const todayKey = toDateKey(new Date());
  const monthDate = new Date(`${monthKey}T00:00:00`);
  // The grid overhangs into neighbouring months, so count only what the header actually claims.
  const pendingCount = (data?.entries ?? [])
    .filter((entry) => entry.needsAction && entry.date.startsWith(monthKey.slice(0, 7))).length;

  const changeMonth = (offset: number) => {
    const next = addCalendarMonths(monthKey, offset);
    if (!next) return;
    const nextMonth = `${next.slice(0, 7)}-01`;
    setMonthKey(nextMonth);
    // Keep the panel on a day the new grid shows: today when it lands in that month, else the 1st.
    setSelectedDate(todayKey.startsWith(next.slice(0, 7)) ? todayKey : nextMonth);
  };

  return (
    <div className="min-h-dvh bg-background pb-14 pt-[88px] text-on-surface">
      <main className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <MyActivityTabs />
        <header className="border-b border-outline-variant pb-6">
          <span className="inline-flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#081d24]">
            <CalendarDays aria-hidden="true" className="h-5 w-5" /> Lịch chơi
          </span>
          <h1 className="mt-2 text-[clamp(1.65rem,4vw,2.65rem)] font-bold leading-tight tracking-[-0.03em]">Lịch chơi của tôi</h1>
          <p className="mt-2 max-w-[65ch] text-[14px] leading-6 text-on-surface-variant">
            Tất cả sân đã đặt, vé đã mua và trận đã ghép, gom theo từng ngày. Chọn một ngày để xem chi tiết.
          </p>
        </header>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-error/25 bg-error-container p-4 text-[14px] font-bold text-error" role="alert">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
            <button className="ml-auto shrink-0 underline" onClick={() => void refresh()} type="button">Thử lại</button>
          </div>
        )}

        {pendingCount > 0 && (
          <p className="mt-4 flex items-center gap-2 rounded-xl border border-[#f59e0b]/40 bg-[#fff8e6] px-3.5 py-2.5 text-[13px] font-bold text-[#92400e]">
            <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0" />
            {pendingCount} hoạt động trong tháng này đang chờ bạn thanh toán.
          </p>
        )}

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section aria-label="Lịch tháng" className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-[0_8px_20px_rgba(25,29,20,0.05)] sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <button
                aria-label="Tháng trước"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-[#081d24] transition-colors hover:border-[#e2ff57] hover:bg-[#081d24] hover:text-[#e2ff57] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70"
                onClick={() => changeMonth(-1)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" className="h-5 w-5" />
              </button>
              <p className="text-[17px] font-extrabold capitalize">{monthLabel.format(monthDate)}</p>
              <button
                aria-label="Tháng sau"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-[#081d24] transition-colors hover:border-[#e2ff57] hover:bg-[#081d24] hover:text-[#e2ff57] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70"
                onClick={() => changeMonth(1)}
                type="button"
              >
                <ChevronRight aria-hidden="true" className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-on-surface-variant">
              {weekdayNames.map((name) => <span key={name}>{name}</span>)}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1" role="grid">
              {grid.map((cell) => {
                const dayEntries = entriesByDate.get(cell.key) ?? [];
                const isSelected = cell.key === selectedDate;
                const needsAction = dayEntries.some((entry) => entry.needsAction);

                return (
                  <button
                    aria-current={cell.key === todayKey ? 'date' : undefined}
                    aria-label={`${dayLabel.format(cell.date)}${dayEntries.length ? `, ${dayEntries.length} hoạt động` : ', không có hoạt động'}`}
                    aria-pressed={isSelected}
                    className={`flex min-h-[58px] flex-col items-center gap-1 rounded-lg border p-1.5 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 sm:min-h-[70px] ${
                      isSelected
                        ? 'border-[#e2ff57] bg-[#081d24] text-[#e2ff57]'
                        : cell.inMonth
                          ? 'border-outline-variant bg-surface-container-lowest hover:border-[#e2ff57]'
                          : 'border-transparent bg-transparent text-on-surface-variant/45'
                    }`}
                    key={cell.key}
                    onClick={() => setSelectedDate(cell.key)}
                    type="button"
                  >
                    <span className={`text-[13px] font-bold leading-none ${
                      cell.key === todayKey && !isSelected ? 'flex h-6 w-6 items-center justify-center rounded-full bg-[#e2ff57] text-[#081d24]' : ''
                    }`}
                    >
                      {cell.date.getDate()}
                    </span>
                    <span className="flex min-h-3 flex-wrap items-center justify-center gap-0.5">
                      {dayEntries.slice(0, 3).map((entry) => (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-[#e2ff57]' : typeMeta[entry.entryType].dot}`}
                          key={`${entry.entryType}-${entry.bookingId}-${entry.startTime}`}
                        />
                      ))}
                      {dayEntries.length > 3 && (
                        <span className={`text-[9px] font-bold leading-none ${isSelected ? 'text-[#e2ff57]' : 'text-on-surface-variant'}`}>
                          +{dayEntries.length - 3}
                        </span>
                      )}
                    </span>
                    {needsAction && <span className="h-1 w-4 rounded-full bg-[#f59e0b]" />}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-outline-variant pt-3 text-[11px] font-bold text-on-surface-variant">
              {(Object.keys(typeMeta) as PlayerScheduleEntryType[]).map((type) => (
                <span className="inline-flex items-center gap-1.5" key={type}>
                  <span className={`h-1.5 w-1.5 rounded-full ${typeMeta[type].dot}`} /> {typeMeta[type].label}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-4 rounded-full bg-[#f59e0b]" /> Cần thanh toán
              </span>
            </div>
          </section>

          <section aria-label="Chi tiết ngày" className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-[0_8px_20px_rgba(25,29,20,0.05)] sm:p-4 lg:sticky lg:top-[92px]">
            <h2 className="text-[15px] font-extrabold capitalize">{dayLabel.format(new Date(`${selectedDate}T00:00:00`))}</h2>

            {loading ? (
              <div aria-label="Đang tải lịch" className="mt-3 grid gap-2" role="status">
                {Array.from({ length: 2 }, (_, index) => (
                  <div className="h-28 animate-pulse rounded-lg border border-outline-variant bg-surface-container-low motion-reduce:animate-none" key={index} />
                ))}
              </div>
            ) : selectedEntries.length === 0 ? (
              <div className="mt-3 rounded-lg border border-dashed border-outline-variant px-4 py-10 text-center">
                <CalendarDays aria-hidden="true" className="mx-auto h-9 w-9 text-outline" />
                <p className="mt-3 text-[14px] font-bold">Ngày này bạn chưa có lịch</p>
                <Link className="mt-4 inline-flex min-h-10 items-center justify-center rounded-lg border border-[#e2ff57] bg-[#e2ff57] px-3.5 text-[13px] font-bold text-[#081d24] transition-transform hover:-translate-y-px" to="/book-court">
                  Đặt sân mới
                </Link>
              </div>
            ) : (
              <ul className="mt-3 grid gap-2">
                {selectedEntries.map((entry) => {
                  const meta = typeMeta[entry.entryType];
                  const Icon = meta.icon;

                  return (
                    <li key={`${entry.entryType}-${entry.bookingId}-${entry.startTime}`}>
                      <Link
                        className="block rounded-lg border border-outline-variant bg-surface-container-lowest p-3 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-[#e2ff57] hover:shadow-[0_10px_24px_rgba(25,29,20,0.08)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70"
                        to={scheduleEntryPath(entry)}
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${meta.chip}`}>
                            <Icon aria-hidden="true" className="h-3 w-3" /> {meta.label}
                          </span>
                          <span className="rounded-full border border-outline-variant bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                            {statusLabels[entry.status] ?? entry.status}
                          </span>
                          {entry.needsAction && (
                            <span className="rounded-full border border-[#f59e0b]/40 bg-[#fff8e6] px-2 py-0.5 text-[10px] font-bold text-[#92400e]">
                              {paymentLabels[entry.paymentStatus] ?? entry.paymentStatus}
                            </span>
                          )}
                        </div>

                        <p className="mt-2 flex items-center gap-1.5 text-[15px] font-extrabold leading-tight">
                          <Clock aria-hidden="true" className="h-4 w-4 shrink-0 text-[#081d24]" />
                          {time(entry.startTime)} – {time(entry.endTime)}
                        </p>
                        {entry.title && <p className="mt-1 break-words text-[13px] font-bold">{entry.title}</p>}
                        <p className="mt-1 flex items-start gap-1.5 break-words text-[12px] font-bold text-on-surface-variant">
                          <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#081d24]" />
                          {entry.venueName} · Sân {entry.courtNumber}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

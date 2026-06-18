import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Banknote,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  HelpCircle,
  LayoutDashboard,
  Lock,
  Map,
  Menu,
  Pencil,
  Plus,
  Settings,
  ShieldCheck,
  User,
  Users,
  X,
  XCircle,
} from 'lucide-react';

type ScheduleStatus = 'booked' | 'pending' | 'locked' | 'event';
type StatusFilter = 'all' | ScheduleStatus;

type SubCourt = {
  id: string;
  name: string;
};

type CourtGroup = {
  id: string;
  name: string;
  subCourts: SubCourt[];
};

type ScheduleBlock = {
  id: string;
  date: string;
  groupId: string;
  subCourtId: string;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
  customerName?: string;
  phone?: string;
  price?: number;
  paymentStatus?: 'paid' | 'unpaid' | 'deposit';
  note: string;
};

type SelectedSlot = {
  subCourtId: string;
  time: string;
};

const courtGroups: CourtGroup[] = [
  {
    id: 'pickleball',
    name: 'Pickleball',
    subCourts: [
      { id: 'pb-1', name: 'PB 1' },
      { id: 'pb-2', name: 'PB 2' },
      { id: 'pb-3', name: 'PB 3' },
      { id: 'pb-4', name: 'PB 4' },
      { id: 'pb-5', name: 'PB 5' },
      { id: 'pb-6', name: 'PB 6' },
    ],
  },
  {
    id: 'indoor',
    name: 'Trong nhà',
    subCourts: [
      { id: 'in-1', name: 'Indoor 1' },
      { id: 'in-2', name: 'Indoor 2' },
      { id: 'in-3', name: 'Indoor 3' },
    ],
  },
];

const initialBlocks: ScheduleBlock[] = [
  {
    id: 'booking-1',
    date: '2026-06-18',
    groupId: 'pickleball',
    subCourtId: 'pb-1',
    startTime: '07:00',
    endTime: '08:30',
    status: 'booked',
    customerName: 'Nguyễn Minh Anh',
    phone: '0912 345 678',
    price: 330000,
    paymentStatus: 'paid',
    note: 'Đặt đơn, đã thanh toán toàn bộ.',
  },
  {
    id: 'booking-2',
    date: '2026-06-18',
    groupId: 'pickleball',
    subCourtId: 'pb-2',
    startTime: '18:00',
    endTime: '20:00',
    status: 'pending',
    customerName: 'Trần Quốc Bảo',
    phone: '0937 294 949',
    price: 480000,
    paymentStatus: 'deposit',
    note: 'Ghép trận 2vs2, đang chờ đủ người cùng thanh toán.',
  },
  {
    id: 'booking-3',
    date: '2026-06-18',
    groupId: 'pickleball',
    subCourtId: 'pb-3',
    startTime: '17:00',
    endTime: '19:30',
    status: 'booked',
    customerName: 'Lê Tuyết Mai',
    phone: '0988 776 655',
    price: 600000,
    paymentStatus: 'paid',
    note: 'Nhóm 4 người, cần mượn 2 vợt.',
  },
  {
    id: 'booking-4',
    date: '2026-06-18',
    groupId: 'pickleball',
    subCourtId: 'pb-5',
    startTime: '19:30',
    endTime: '21:00',
    status: 'pending',
    customerName: 'Phạm Tuấn',
    phone: '0904 112 233',
    price: 360000,
    paymentStatus: 'unpaid',
    note: 'Chờ xác nhận từ chủ sân trước khi thanh toán.',
  },
  {
    id: 'locked-1',
    date: '2026-06-18',
    groupId: 'indoor',
    subCourtId: 'in-1',
    startTime: '09:00',
    endTime: '11:00',
    status: 'locked',
    note: 'Bảo trì mặt sân và kiểm tra lưới.',
  },
  {
    id: 'event-1',
    date: '2026-06-18',
    groupId: 'indoor',
    subCourtId: 'in-2',
    startTime: '13:00',
    endTime: '15:00',
    status: 'event',
    note: 'Lớp học pickleball cơ bản cho thành viên mới.',
  },
  {
    id: 'booking-5',
    date: '2026-06-19',
    groupId: 'pickleball',
    subCourtId: 'pb-1',
    startTime: '18:30',
    endTime: '20:30',
    status: 'booked',
    customerName: 'Hoàng Gia Huy',
    phone: '0977 555 222',
    price: 520000,
    paymentStatus: 'paid',
    note: 'Đặt sân cố định thứ sáu hằng tuần.',
  },
  {
    id: 'booking-6',
    date: '2026-06-19',
    groupId: 'pickleball',
    subCourtId: 'pb-4',
    startTime: '07:00',
    endTime: '08:00',
    status: 'pending',
    customerName: 'Đỗ Lan Anh',
    phone: '0919 858 563',
    price: 220000,
    paymentStatus: 'unpaid',
    note: 'Khách mới, cần gọi xác nhận trước giờ chơi.',
  },
];

const filterOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đã đặt', value: 'booked' },
  { label: 'Chờ xác nhận', value: 'pending' },
  { label: 'Khóa sân', value: 'locked' },
  { label: 'Sự kiện', value: 'event' },
];

const statusConfig: Record<
  ScheduleStatus,
  {
    label: string;
    className: string;
    cellClassName: string;
    icon: React.ElementType;
  }
> = {
  booked: {
    label: 'Đã đặt',
    className: 'bg-[#eaf7df] text-primary',
    cellClassName: 'border-[#39a85b] bg-[#58c978]',
    icon: CheckCircle2,
  },
  pending: {
    label: 'Chờ xác nhận',
    className: 'bg-[#fff4d8] text-[#755400]',
    cellClassName: 'border-[#eab526] bg-[#f6c642]',
    icon: AlertCircle,
  },
  locked: {
    label: 'Khóa sân',
    className: 'bg-[#eef0ef] text-[#57615b]',
    cellClassName: 'border-[#8f9892] bg-[#8f9892]',
    icon: Lock,
  },
  event: {
    label: 'Sự kiện',
    className: 'bg-[#fbe9f8] text-[#8c287e]',
    cellClassName: 'border-[#e869de] bg-[#e869de]',
    icon: ShieldCheck,
  },
};

const paymentLabels: Record<NonNullable<ScheduleBlock['paymentStatus']>, string> = {
  paid: 'Đã thanh toán',
  deposit: 'Đã cọc',
  unpaid: 'Chưa thanh toán',
};

const firstScheduleDate = '2026-06-18';
const timelineStartMinutes = 5 * 60;
const timelineEndMinutes = 22 * 60 + 30;
const timelineStepMinutes = 30;
const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + minutes;
};

const minutesToTime = (value: number) => {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

const timelineColumns = Array.from(
  { length: (timelineEndMinutes - timelineStartMinutes) / timelineStepMinutes },
  (_, index) => minutesToTime(timelineStartMinutes + index * timelineStepMinutes),
);

const toDateValue = (date: Date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')}`;

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${date}T00:00:00`));

const formatLongDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));

const formatCalendarDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));

const toMonthDate = (date: string) => {
  const parsedDate = new Date(`${date}T00:00:00`);

  return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
};

const formatMonthTitle = (date: Date) => `tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;

const getCalendarMonthCells = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyCells = (firstDay.getDay() + 6) % 7;
  const cells: Array<string | null> = Array.from({ length: leadingEmptyCells }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toDateValue(new Date(year, month, day)));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const getBlockForCell = (blocks: ScheduleBlock[], subCourtId: string, time: string) =>
  blocks.find((block) => {
    const cellStart = timeToMinutes(time);

    return block.subCourtId === subCourtId && cellStart >= timeToMinutes(block.startTime) && cellStart < timeToMinutes(block.endTime);
  });

const getBlockDurationHours = (block: ScheduleBlock) => (timeToMinutes(block.endTime) - timeToMinutes(block.startTime)) / 60;

export const OwnerDashboard = () => {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>(initialBlocks);
  const [selectedDate, setSelectedDate] = useState(firstScheduleDate);
  const [activeGroupId, setActiveGroupId] = useState('all');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all');
  const [selectedBlockId, setSelectedBlockId] = useState(initialBlocks[0].id);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(firstScheduleDate);
  const [calendarMonthDate, setCalendarMonthDate] = useState(() => toMonthDate(firstScheduleDate));

  const visibleGroups = useMemo(
    () => (activeGroupId === 'all' ? courtGroups : courtGroups.filter((group) => group.id === activeGroupId)),
    [activeGroupId],
  );
  const calendarCells = useMemo(() => getCalendarMonthCells(calendarMonthDate), [calendarMonthDate]);
  const dateBlocks = useMemo(() => blocks.filter((block) => block.date === selectedDate), [blocks, selectedDate]);
  const filteredDateBlocks = useMemo(
    () => (activeFilter === 'all' ? dateBlocks : dateBlocks.filter((block) => block.status === activeFilter)),
    [activeFilter, dateBlocks],
  );
  const selectedBlock = blocks.find((block) => block.id === selectedBlockId);
  const pendingBlocks = dateBlocks.filter((block) => block.status === 'pending');
  const bookedBlocks = dateBlocks.filter((block) => block.status === 'booked');
  const lockedBlocks = dateBlocks.filter((block) => block.status === 'locked' || block.status === 'event');
  const totalRevenue = bookedBlocks.reduce((total, block) => total + (block.price ?? 0), 0);
  const totalCourtHours = courtGroups.flatMap((group) => group.subCourts).length * timelineColumns.length * 0.5;
  const usedHours = dateBlocks.reduce((total, block) => total + getBlockDurationHours(block), 0);
  const occupancyRate = Math.round((usedHours / totalCourtHours) * 100);
  const timelineGridStyle = { gridTemplateColumns: `repeat(${timelineColumns.length}, minmax(40px, 1fr))` };

  const counts = useMemo(
    () =>
      dateBlocks.reduce(
        (currentCounts, block) => ({
          ...currentCounts,
          all: currentCounts.all + 1,
          [block.status]: currentCounts[block.status] + 1,
        }),
        { all: 0, booked: 0, pending: 0, locked: 0, event: 0 } as Record<StatusFilter, number>,
      ),
    [dateBlocks],
  );

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    const nextBlock = blocks.find((block) => block.date === date);
    setSelectedBlockId(nextBlock?.id ?? '');
  };

  const openCalendar = () => {
    setDraftDate(selectedDate);
    setCalendarMonthDate(toMonthDate(selectedDate));
    setIsCalendarOpen(true);
  };

  const confirmCalendarDate = () => {
    handleDateChange(draftDate);
    setIsCalendarOpen(false);
  };

  const handleBlockClick = (block: ScheduleBlock) => {
    setSelectedBlockId(block.id);
    setSelectedSlot(null);
  };

  const handleAvailableCellClick = (subCourtId: string, time: string) => {
    setSelectedBlockId('');
    setSelectedSlot({ subCourtId, time });
  };

  const confirmPendingBlock = (blockId: string) => {
    setBlocks((current) =>
      current.map((block) =>
        block.id === blockId ? { ...block, status: 'booked', paymentStatus: block.paymentStatus === 'unpaid' ? 'deposit' : block.paymentStatus } : block,
      ),
    );
  };

  const cancelBlock = (blockId: string) => {
    setBlocks((current) => current.filter((block) => block.id !== blockId));
    setSelectedBlockId('');
  };

  const lockSelectedSlot = () => {
    if (!selectedSlot) {
      return;
    }

    const subCourtGroup = courtGroups.find((group) => group.subCourts.some((subCourt) => subCourt.id === selectedSlot.subCourtId));
    const newBlock: ScheduleBlock = {
      id: `locked-${selectedDate}-${selectedSlot.subCourtId}-${selectedSlot.time}`,
      date: selectedDate,
      groupId: subCourtGroup?.id ?? 'pickleball',
      subCourtId: selectedSlot.subCourtId,
      startTime: selectedSlot.time,
      endTime: minutesToTime(timeToMinutes(selectedSlot.time) + timelineStepMinutes),
      status: 'locked',
      note: 'Chủ sân khóa nhanh khung giờ này.',
    };

    setBlocks((current) => [...current, newBlock]);
    setSelectedBlockId(newBlock.id);
    setSelectedSlot(null);
  };

  const selectedSlotCourt = courtGroups.flatMap((group) => group.subCourts).find((subCourt) => subCourt.id === selectedSlot?.subCourtId);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-on-surface">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-primary px-4 text-white shadow-md md:px-margin-desktop">
        <div className="flex items-center gap-4">
          <Link className="text-[24px] font-bold tracking-tight" to="/">
            Picklink
          </Link>
          <span className="hidden rounded-lg border border-white/20 px-3 py-1 text-[12px] font-bold text-white/86 md:inline-flex">
            Chủ sân
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link className="hidden rounded-lg bg-white/10 px-4 py-2 text-[14px] font-bold hover:bg-white/16 md:inline-flex" to="/owner">
            Lịch đặt sân
          </Link>
          <button aria-label="Thông báo chủ sân" className="rounded-lg p-2 hover:bg-white/10" type="button">
            <Bell className="h-5 w-5" />
          </button>
          <button aria-label="Trợ giúp" className="hidden rounded-lg p-2 hover:bg-white/10 sm:inline-flex" type="button">
            <HelpCircle className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/30 bg-white/12">
            <User className="h-5 w-5" />
          </div>
        </div>
      </header>

      <div className="flex min-w-0">
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-64 shrink-0 border-r border-outline-variant bg-white p-4 md:block">
          <div className="mb-6 px-2 pt-2">
            <h2 className="text-[20px] font-bold text-primary">Picklink Admin</h2>
            <p className="mt-1 text-[12px] font-medium text-on-surface-variant">Quản lý vận hành sân</p>
          </div>

          <nav className="space-y-1">
            {[
              { label: 'Lịch đặt sân', icon: CalendarDays, to: '/owner', active: true },
              { label: 'Sân & court', icon: Map, to: '/owner/courts' },
              { label: 'Doanh thu', icon: Banknote, to: '/owner' },
              { label: 'Cài đặt', icon: Settings, to: '/owner' },
            ].map((item) => (
              <Link
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-[14px] font-bold transition-colors ${
                  item.active ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                }`}
                key={item.label}
                to={item.to}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
          <div className="mx-auto max-w-[1280px] space-y-6">
            <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-[13px] font-bold text-primary">
                  <Clock className="h-4 w-4" />
                  Lịch vận hành theo thời gian thực
                </p>
                <h1 className="mt-3 text-[30px] font-bold leading-tight md:text-[40px]">Quản lý lịch sân</h1>
                <p className="mt-2 max-w-2xl text-[15px] leading-6 text-on-surface-variant">
                  Theo dõi toàn bộ sân con, xác nhận booking đang chờ và khóa nhanh các khung giờ cần bảo trì hoặc tổ chức sự kiện.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-[14px] font-bold text-primary hover:bg-primary/10" type="button">
                  <Pencil className="h-5 w-5" />
                  Sửa giá giờ
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90" type="button">
                  <Plus className="h-5 w-5" />
                  Tạo lịch khóa
                </button>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Đơn đã đặt', value: bookedBlocks.length, icon: CheckCircle2, helper: formatCurrency(totalRevenue) },
                { label: 'Chờ xác nhận', value: pendingBlocks.length, icon: AlertCircle, helper: 'Cần xử lý trong ngày' },
                { label: 'Khóa / sự kiện', value: lockedBlocks.length, icon: Lock, helper: 'Không nhận đặt mới' },
                { label: 'Tỷ lệ lấp đầy', value: `${occupancyRate}%`, icon: Users, helper: `${usedHours.toFixed(1)} giờ đã sử dụng` },
              ].map((stat) => (
                <div className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm" key={stat.label}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-bold text-on-surface-variant">{stat.label}</p>
                      <p className="mt-2 text-[30px] font-bold text-on-surface">{stat.value}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-[12px] font-medium text-on-surface-variant">{stat.helper}</p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0 space-y-4">
                <div className="rounded-lg border border-outline-variant bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="relative">
                      <button
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90 sm:w-auto"
                        onClick={openCalendar}
                        type="button"
                      >
                        <CalendarDays className="h-5 w-5" />
                        {formatCalendarDate(selectedDate)}
                      </button>

                      {isCalendarOpen && (
                        <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/35 px-3 pt-20">
                          <div className="w-full max-w-[356px] rounded-lg bg-white p-6 text-on-surface shadow-2xl ring-1 ring-black/10">
                            <div className="flex items-center justify-between">
                              <button
                                aria-label="Tháng trước"
                                className="rounded-lg p-2 text-primary hover:bg-primary/10"
                                onClick={() =>
                                  setCalendarMonthDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                                }
                                type="button"
                              >
                                <ChevronLeft className="h-5 w-5" />
                              </button>
                              <p className="text-[16px] font-bold">{formatMonthTitle(calendarMonthDate)}</p>
                              <button
                                aria-label="Tháng sau"
                                className="rounded-lg p-2 text-primary hover:bg-primary/10"
                                onClick={() =>
                                  setCalendarMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                                }
                                type="button"
                              >
                                <ChevronRight className="h-5 w-5" />
                              </button>
                            </div>

                            <div className="mt-6 grid grid-cols-7 gap-1 text-center text-[13px] font-bold text-on-surface-variant">
                              {weekdayLabels.map((label) => (
                                <span className="py-2" key={label}>
                                  {label}
                                </span>
                              ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                              {calendarCells.map((date, index) => {
                                if (!date) {
                                  return <span className="h-11" key={`empty-${index}`} />;
                                }

                                const day = new Date(`${date}T00:00:00`).getDate();
                                const isSelected = draftDate === date;
                                const isPast = date < firstScheduleDate;

                                return (
                                  <button
                                    className={`h-11 rounded-lg text-[16px] font-bold transition-colors ${
                                      isSelected
                                        ? 'bg-primary text-white'
                                        : isPast
                                          ? 'cursor-not-allowed text-on-surface-variant/35'
                                          : 'text-on-surface hover:bg-primary/10 hover:text-primary'
                                    }`}
                                    disabled={isPast}
                                    key={date}
                                    onClick={() => setDraftDate(date)}
                                    type="button"
                                  >
                                    {day}
                                  </button>
                                );
                              })}
                            </div>

                            <div className="mt-9 flex items-center justify-end gap-3">
                              <button
                                aria-label="Hủy chọn ngày"
                                className="rounded-lg px-4 py-2 text-[14px] font-bold text-primary hover:bg-primary/10"
                                onClick={() => setIsCalendarOpen(false)}
                                type="button"
                              >
                                Hủy
                              </button>
                              <button
                                aria-label="Xác nhận ngày"
                                className="rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                                onClick={confirmCalendarDate}
                                type="button"
                              >
                                Xác nhận
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:w-[360px]">
                      <select
                        className="rounded-lg border border-outline-variant bg-white px-4 py-3 text-[14px] font-bold outline-none focus:border-primary"
                        onChange={(event) => setActiveGroupId(event.target.value)}
                        value={activeGroupId}
                      >
                        <option value="all">Tất cả cụm sân</option>
                        {courtGroups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                      <select
                        className="rounded-lg border border-outline-variant bg-white px-4 py-3 text-[14px] font-bold outline-none focus:border-primary"
                        onChange={(event) => setActiveFilter(event.target.value as StatusFilter)}
                        value={activeFilter}
                      >
                        {filterOptions.map((filter) => (
                          <option key={filter.value} value={filter.value}>
                            {filter.label} ({counts[filter.value]})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] font-bold text-on-surface-variant">
                    <span>{formatLongDate(selectedDate)}</span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 rounded bg-white ring-1 ring-[#c9d2c9]" />
                      Trống
                    </span>
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <span className="inline-flex items-center gap-2" key={status}>
                        <span className={`h-4 w-4 rounded ${config.cellClassName}`} />
                        {config.label}
                      </span>
                    ))}
                  </div>
                </div>

                <section className="rounded-lg border border-outline-variant bg-white shadow-sm">
                  <div className="flex items-center justify-between rounded-t-lg bg-primary px-4 py-3 text-white">
                    <div>
                      <h2 className="text-[20px] font-bold">Bảng lịch sân con</h2>
                      <p className="mt-1 text-[12px] font-medium text-white/75">Bấm vào ô có màu để xem booking, bấm ô trắng để chọn khóa nhanh.</p>
                    </div>
                    <Menu className="h-5 w-5 text-white/80 md:hidden" />
                  </div>

                  <div className="overflow-x-auto">
                    <div className="min-w-[1500px]">
                      <div className="grid grid-cols-[86px_112px_auto] bg-[#b7eef2] text-[12px] font-medium text-[#356058]">
                        <div className="sticky left-0 z-30 col-span-2 border-r border-[#93cfc4] bg-[#b7eef2] px-3 py-3 font-bold">
                          Cụm sân / sân con
                        </div>
                        <div className="grid" style={timelineGridStyle}>
                          {timelineColumns.map((time) => (
                            <span className="border-r border-[#93cfc4] px-1 py-3 text-center" key={time}>
                              {time}
                            </span>
                          ))}
                        </div>
                      </div>

                      {visibleGroups.map((group) => (
                        <div
                          className="grid grid-cols-[86px_112px_auto] border-b border-[#c5d7cd]"
                          key={group.id}
                          style={{ gridTemplateRows: `repeat(${group.subCourts.length}, 56px)` }}
                        >
                          <div
                            className="sticky left-0 z-30 flex items-center justify-center border-r border-[#a7d9c1] bg-[#d9f7e8] px-2 text-center"
                            style={{ gridRow: `1 / span ${group.subCourts.length}` }}
                          >
                            <span className="line-clamp-3 text-[12px] font-bold leading-5 text-[#226143]">{group.name}</span>
                          </div>

                          {group.subCourts.map((subCourt, rowIndex) => (
                            <React.Fragment key={subCourt.id}>
                              <div
                                className="sticky left-[86px] z-20 flex items-center border-r border-b border-[#b9d8ca] bg-[#dff7ea] px-3"
                                style={{ gridColumn: 2, gridRow: rowIndex + 1 }}
                              >
                                <span className="text-[13px] font-bold text-[#226143]">{subCourt.name}</span>
                              </div>

                              <div className="relative border-b border-[#c5d7cd]" style={{ gridColumn: 3, gridRow: rowIndex + 1 }}>
                                <div className="grid h-full" style={timelineGridStyle}>
                                  {timelineColumns.map((time) => {
                                    const block = getBlockForCell(dateBlocks, subCourt.id, time);
                                    const shouldHideByFilter = block && activeFilter !== 'all' && block.status !== activeFilter;
                                    const isSelectedSlot = selectedSlot?.subCourtId === subCourt.id && selectedSlot.time === time;

                                    if (shouldHideByFilter) {
                                      return (
                                        <div
                                          className="h-14 border-r border-[#aeb7b0] bg-white opacity-45 last:border-r-0"
                                          key={`${subCourt.id}-${time}-hidden`}
                                        />
                                      );
                                    }

                                    return (
                                      <button
                                        aria-label={
                                          block
                                            ? `${subCourt.name} ${time} ${statusConfig[block.status].label}`
                                            : `${subCourt.name} ${time} trống`
                                        }
                                        className={`h-14 border-r border-[#aeb7b0] transition-colors last:border-r-0 ${
                                          block
                                            ? `${statusConfig[block.status].cellClassName} hover:brightness-95`
                                            : isSelectedSlot
                                              ? 'border-[#4c9b62] bg-[#c7f0d8] hover:bg-[#a9e7c3]'
                                              : 'bg-white hover:bg-[#eefbf4]'
                                        }`}
                                        key={`${subCourt.id}-${time}`}
                                        onClick={() => (block ? handleBlockClick(block) : handleAvailableCellClick(subCourt.id, time))}
                                        title={
                                          block
                                            ? `${statusConfig[block.status].label}: ${block.startTime} - ${block.endTime}`
                                            : `${subCourt.name} - ${time} đến ${minutesToTime(timeToMinutes(time) + timelineStepMinutes)}`
                                        }
                                        type="button"
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-[20px] font-bold">Booking cần xử lý</h2>
                      <p className="mt-1 text-[13px] text-on-surface-variant">Các đơn chờ xác nhận trong ngày đang chọn.</p>
                    </div>
                    <span className="w-fit rounded-full bg-[#fff4d8] px-3 py-1 text-[12px] font-bold text-[#755400]">
                      {pendingBlocks.length} đơn
                    </span>
                  </div>

                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left">
                      <thead>
                        <tr className="border-b border-outline-variant bg-surface-container-low">
                          <th className="px-4 py-3 text-[13px] font-bold text-on-surface-variant">Khách</th>
                          <th className="px-4 py-3 text-[13px] font-bold text-on-surface-variant">Sân</th>
                          <th className="px-4 py-3 text-[13px] font-bold text-on-surface-variant">Giờ</th>
                          <th className="px-4 py-3 text-[13px] font-bold text-on-surface-variant">Thanh toán</th>
                          <th className="px-4 py-3 text-[13px] font-bold text-on-surface-variant text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {pendingBlocks.map((block) => {
                          const subCourt = courtGroups.flatMap((group) => group.subCourts).find((court) => court.id === block.subCourtId);

                          return (
                            <tr className="bg-white hover:bg-surface-container-low" key={block.id}>
                              <td className="px-4 py-3">
                                <p className="text-[14px] font-bold">{block.customerName}</p>
                                <p className="text-[12px] text-on-surface-variant">{block.phone}</p>
                              </td>
                              <td className="px-4 py-3 text-[14px] font-bold">{subCourt?.name}</td>
                              <td className="px-4 py-3 text-[14px] font-medium">
                                {block.startTime} - {block.endTime}
                              </td>
                              <td className="px-4 py-3 text-[14px] font-bold">
                                {block.paymentStatus ? paymentLabels[block.paymentStatus] : 'Không có'}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-end gap-2">
                                  <button
                                    aria-label={`Xem ${block.customerName}`}
                                    className="rounded-lg border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-low"
                                    onClick={() => handleBlockClick(block)}
                                    type="button"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <button
                                    className="rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary/90"
                                    onClick={() => confirmPendingBlock(block.id)}
                                    type="button"
                                  >
                                    Xác nhận
                                  </button>
                                  <button
                                    className="rounded-lg border border-outline-variant px-3 py-2 text-[12px] font-bold text-on-surface-variant hover:bg-[#ffe8e8] hover:text-[#a33535]"
                                    onClick={() => cancelBlock(block.id)}
                                    type="button"
                                  >
                                    Từ chối
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {pendingBlocks.length === 0 && (
                          <tr>
                            <td className="px-4 py-8 text-center text-[14px] font-bold text-on-surface-variant" colSpan={5}>
                              Không có đơn chờ xác nhận trong ngày này.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
                <section className="rounded-lg border border-primary bg-white p-5 shadow-sm">
                  <h2 className="flex items-center gap-2 text-[20px] font-bold">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Chi tiết lịch
                  </h2>

                  {selectedBlock ? (
                    <div className="mt-5 space-y-4">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-bold ${statusConfig[selectedBlock.status].className}`}>
                        {React.createElement(statusConfig[selectedBlock.status].icon, { className: 'h-4 w-4' })}
                        {statusConfig[selectedBlock.status].label}
                      </span>

                      <div>
                        <p className="text-[13px] font-bold text-on-surface-variant">Khung giờ</p>
                        <p className="mt-1 text-[18px] font-bold">
                          {selectedBlock.startTime} - {selectedBlock.endTime}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-surface-container-low p-3">
                          <p className="text-[12px] font-bold text-on-surface-variant">Khách hàng</p>
                          <p className="mt-1 text-[14px] font-bold">{selectedBlock.customerName ?? 'Nội bộ'}</p>
                        </div>
                        <div className="rounded-lg bg-surface-container-low p-3">
                          <p className="text-[12px] font-bold text-on-surface-variant">Liên hệ</p>
                          <p className="mt-1 text-[14px] font-bold">{selectedBlock.phone ?? 'Không có'}</p>
                        </div>
                        <div className="rounded-lg bg-surface-container-low p-3">
                          <p className="text-[12px] font-bold text-on-surface-variant">Thanh toán</p>
                          <p className="mt-1 text-[14px] font-bold">
                            {selectedBlock.paymentStatus ? paymentLabels[selectedBlock.paymentStatus] : 'Không áp dụng'}
                          </p>
                        </div>
                        <div className="rounded-lg bg-surface-container-low p-3">
                          <p className="text-[12px] font-bold text-on-surface-variant">Giá trị</p>
                          <p className="mt-1 text-[14px] font-bold">{formatCurrency(selectedBlock.price ?? 0)}</p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-outline-variant p-4">
                        <p className="text-[13px] font-bold text-on-surface-variant">Ghi chú</p>
                        <p className="mt-2 text-[14px] leading-6">{selectedBlock.note}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
                        {selectedBlock.status === 'pending' && (
                          <button
                            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                            onClick={() => confirmPendingBlock(selectedBlock.id)}
                            type="button"
                          >
                            <CheckCircle2 className="h-5 w-5" />
                            Xác nhận booking
                          </button>
                        )}
                        <button
                          className="flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-[14px] font-bold text-on-surface-variant hover:bg-[#ffe8e8] hover:text-[#a33535]"
                          onClick={() => cancelBlock(selectedBlock.id)}
                          type="button"
                        >
                          <XCircle className="h-5 w-5" />
                          Hủy / mở khung giờ
                        </button>
                      </div>
                    </div>
                  ) : selectedSlot ? (
                    <div className="mt-5 space-y-4">
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#eaf7df] px-3 py-1 text-[12px] font-bold text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                        Ô trống
                      </span>
                      <div>
                        <p className="text-[13px] font-bold text-on-surface-variant">Sân con</p>
                        <p className="mt-1 text-[18px] font-bold">{selectedSlotCourt?.name}</p>
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-on-surface-variant">Khung giờ</p>
                        <p className="mt-1 text-[18px] font-bold">
                          {selectedSlot.time} - {minutesToTime(timeToMinutes(selectedSlot.time) + timelineStepMinutes)}
                        </p>
                      </div>
                      <button
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                        onClick={lockSelectedSlot}
                        type="button"
                      >
                        <Lock className="h-5 w-5" />
                        Khóa khung giờ này
                      </button>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-lg bg-surface-container-low p-4 text-[14px] font-bold text-on-surface-variant">
                      Chọn một ô lịch để xem chi tiết hoặc khóa nhanh khung giờ.
                    </div>
                  )}
                </section>

                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                  <h2 className="flex items-center gap-2 text-[20px] font-bold">
                    <Clock className="h-5 w-5 text-primary" />
                    Gợi ý vận hành
                  </h2>
                  <div className="mt-4 space-y-3 text-[13px] font-medium text-on-surface-variant">
                    <p className="flex gap-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#755400]" />
                      Xử lý booking chờ xác nhận trước giờ chơi ít nhất 30 phút.
                    </p>
                    <p className="flex gap-2">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      Khóa trước các khung bảo trì để người chơi không đặt nhầm.
                    </p>
                    <p className="flex gap-2">
                      <Banknote className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      Theo dõi tỷ lệ lấp đầy giờ cao điểm để điều chỉnh giá linh hoạt.
                    </p>
                  </div>
                </section>
              </aside>
            </section>
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 grid h-16 grid-cols-4 border-t border-outline-variant bg-white md:hidden">
        <Link className="flex flex-col items-center justify-center gap-1 text-primary" to="/owner">
          <CalendarDays className="h-5 w-5" />
          <span className="text-[10px] font-bold">Lịch sân</span>
        </Link>
        <Link className="flex flex-col items-center justify-center gap-1 text-on-surface-variant" to="/owner/courts">
          <Map className="h-5 w-5" />
          <span className="text-[10px] font-bold">Sân</span>
        </Link>
        <Link className="flex flex-col items-center justify-center gap-1 text-on-surface-variant" to="/owner">
          <Banknote className="h-5 w-5" />
          <span className="text-[10px] font-bold">Doanh thu</span>
        </Link>
        <Link className="flex flex-col items-center justify-center gap-1 text-on-surface-variant" to="/owner">
          <Settings className="h-5 w-5" />
          <span className="text-[10px] font-bold">Cài đặt</span>
        </Link>
      </nav>
    </div>
  );
};

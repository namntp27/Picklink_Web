import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  LandPlot,
  ListChecks,
  MapPin,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';

type MatchFormat = '1vs1' | '2vs2';

export type AvailabilitySlot = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
};

export type SubCourt = {
  id: string;
  name: string;
};

export type Court = {
  id: string;
  province: string;
  ward: string;
  name: string;
  address: string;
  pricePerHour: number;
  subCourts?: SubCourt[];
  slots: AvailabilitySlot[];
};

type MatchInvite = {
  id: number;
  host: string;
  level: string;
  province: string;
  ward: string;
  court: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  format: MatchFormat;
  note: string;
  price: number;
  joined: number;
  needed: number;
};

type InviteForm = {
  level: string;
  province: string;
  ward: string;
  courtId: string;
  subCourtId: string;
  bookingDate: string;
  format: MatchFormat;
  note: string;
};

type ScheduleBlockStatus = 'booked' | 'locked' | 'event';

type ScheduleBlock = AvailabilitySlot & {
  courtId: string;
  subCourtId: string;
  status: ScheduleBlockStatus;
};

export const provinceOptions = [
  'Hà Nội',
  'Huế',
  'Lai Châu',
  'Điện Biên',
  'Sơn La',
  'Lạng Sơn',
  'Quảng Ninh',
  'Thanh Hóa',
  'Nghệ An',
  'Hà Tĩnh',
  'Cao Bằng',
  'Tuyên Quang',
  'Lào Cai',
  'Thái Nguyên',
  'Phú Thọ',
  'Bắc Ninh',
  'Hưng Yên',
  'Hải Phòng',
  'Ninh Bình',
  'Quảng Trị',
  'Đà Nẵng',
  'Quảng Ngãi',
  'Gia Lai',
  'Khánh Hòa',
  'Lâm Đồng',
  'Đắk Lắk',
  'Hồ Chí Minh',
  'Đồng Nai',
  'Tây Ninh',
  'Cần Thơ',
  'Vĩnh Long',
  'Đồng Tháp',
  'Cà Mau',
  'An Giang',
];

const defaultSlots: AvailabilitySlot[] = [
  { id: 'morning-1', date: '2026-06-20', startTime: '07:00', endTime: '08:30' },
  { id: 'evening-1', date: '2026-06-20', startTime: '18:00', endTime: '19:30' },
  { id: 'evening-2', date: '2026-06-21', startTime: '19:30', endTime: '21:00' },
];

const featuredCourts: Court[] = [
  {
    id: 'hn-cau-giay-duy-tan',
    province: 'Hà Nội',
    ward: 'Phường Cầu Giấy',
    name: 'Pickleball Pro Duy Tân',
    address: 'Số 1 Duy Tân, Phường Cầu Giấy',
    pricePerHour: 240000,
    subCourts: [
      { id: 'hn-dt-sub-1', name: 'C.Lông 1' },
      { id: 'hn-dt-sub-2', name: 'C.Lông 2' },
      { id: 'hn-dt-sub-3', name: 'C.Lông 3' },
      { id: 'hn-dt-sub-4', name: 'C.Lông 4' },
      { id: 'hn-dt-sub-5', name: 'C.Lông 5' },
    ],
    slots: [
      { id: 'hn-dt-0', date: '2026-06-18', startTime: '18:00', endTime: '19:30' },
      { id: 'hn-dt-1', date: '2026-06-20', startTime: '18:00', endTime: '19:30' },
      { id: 'hn-dt-2', date: '2026-06-20', startTime: '19:30', endTime: '21:00' },
      { id: 'hn-dt-3', date: '2026-06-21', startTime: '07:00', endTime: '08:30' },
    ],
  },
  {
    id: 'hn-cau-giay-green-court',
    province: 'Hà Nội',
    ward: 'Phường Cầu Giấy',
    name: 'Green Court Cầu Giấy',
    address: 'Ngõ 92 Trần Thái Tông, Phường Cầu Giấy',
    pricePerHour: 230000,
    subCourts: [
      { id: 'hn-gc-sub-1', name: 'PB 1' },
      { id: 'hn-gc-sub-2', name: 'PB 2' },
      { id: 'hn-gc-sub-3', name: 'PB 3' },
      { id: 'hn-gc-sub-4', name: 'PB 4' },
    ],
    slots: [
      { id: 'hn-gc-0', date: '2026-06-18', startTime: '08:00', endTime: '09:30' },
      { id: 'hn-gc-1', date: '2026-06-20', startTime: '08:00', endTime: '09:30' },
      { id: 'hn-gc-2', date: '2026-06-20', startTime: '16:00', endTime: '17:30' },
      { id: 'hn-gc-3', date: '2026-06-21', startTime: '18:30', endTime: '20:00' },
    ],
  },
  {
    id: 'hn-cau-giay-indoor',
    province: 'Hà Nội',
    ward: 'Phường Cầu Giấy',
    name: 'Cầu Giấy Indoor Pickleball',
    address: 'Khu thể thao Nghĩa Tân, Phường Cầu Giấy',
    pricePerHour: 250000,
    subCourts: [
      { id: 'hn-in-sub-1', name: 'Sân trong nhà 1' },
      { id: 'hn-in-sub-2', name: 'Sân trong nhà 2' },
      { id: 'hn-in-sub-3', name: 'Sân trong nhà 3' },
    ],
    slots: [
      { id: 'hn-in-0', date: '2026-06-18', startTime: '10:00', endTime: '11:30' },
      { id: 'hn-in-1', date: '2026-06-20', startTime: '10:00', endTime: '11:30' },
      { id: 'hn-in-2', date: '2026-06-20', startTime: '20:00', endTime: '21:30' },
      { id: 'hn-in-3', date: '2026-06-22', startTime: '07:00', endTime: '08:30' },
    ],
  },
  {
    id: 'hn-my-dinh-picklehub',
    province: 'Hà Nội',
    ward: 'Phường Từ Liêm',
    name: 'PickleHub Mỹ Đình',
    address: 'Mỹ Đình, Phường Từ Liêm',
    pricePerHour: 260000,
    slots: [
      { id: 'hn-md-1', date: '2026-06-22', startTime: '19:30', endTime: '21:00' },
      { id: 'hn-md-2', date: '2026-06-23', startTime: '06:30', endTime: '08:00' },
    ],
  },
  {
    id: 'hcm-ky-hoa',
    province: 'Hồ Chí Minh',
    ward: 'Phường Hòa Hưng',
    name: 'Sân Kỳ Hòa Pickleball',
    address: 'Cụm sân Kỳ Hòa, Phường Hòa Hưng',
    pricePerHour: 220000,
    slots: [
      { id: 'hcm-kh-1', date: '2026-06-21', startTime: '07:00', endTime: '08:30' },
      { id: 'hcm-kh-2', date: '2026-06-21', startTime: '17:30', endTime: '19:00' },
      { id: 'hcm-kh-3', date: '2026-06-22', startTime: '20:00', endTime: '21:30' },
    ],
  },
  {
    id: 'hcm-thu-duc',
    province: 'Hồ Chí Minh',
    ward: 'Phường Thủ Đức',
    name: 'Thủ Đức Pickleball Center',
    address: 'Đường số 8, Phường Thủ Đức',
    pricePerHour: 250000,
    subCourts: [
      { id: 'hcm-td-sub-1', name: 'Pickleball 1' },
      { id: 'hcm-td-sub-2', name: 'Pickleball 2' },
      { id: 'hcm-td-sub-3', name: 'Pickleball 3' },
      { id: 'hcm-td-sub-4', name: 'Pickleball 4' },
    ],
    slots: [
      { id: 'hcm-td-1', date: '2026-06-22', startTime: '18:00', endTime: '19:30' },
      { id: 'hcm-td-2', date: '2026-06-23', startTime: '19:30', endTime: '21:00' },
    ],
  },
  {
    id: 'hcm-thu-duc-rally',
    province: 'Hồ Chí Minh',
    ward: 'Phường Thủ Đức',
    name: 'Rally House Thủ Đức',
    address: 'Khu dân cư Vạn Phúc, Phường Thủ Đức',
    pricePerHour: 240000,
    slots: [
      { id: 'hcm-rh-1', date: '2026-06-22', startTime: '06:30', endTime: '08:00' },
      { id: 'hcm-rh-2', date: '2026-06-22', startTime: '17:30', endTime: '19:00' },
      { id: 'hcm-rh-3', date: '2026-06-23', startTime: '18:00', endTime: '19:30' },
    ],
  },
  {
    id: 'hcm-thu-duc-zone',
    province: 'Hồ Chí Minh',
    ward: 'Phường Thủ Đức',
    name: 'PickleZone Thủ Đức',
    address: 'Đường Linh Đông, Phường Thủ Đức',
    pricePerHour: 260000,
    slots: [
      { id: 'hcm-pz-1', date: '2026-06-22', startTime: '09:00', endTime: '10:30' },
      { id: 'hcm-pz-2', date: '2026-06-22', startTime: '19:30', endTime: '21:00' },
      { id: 'hcm-pz-3', date: '2026-06-24', startTime: '18:30', endTime: '20:00' },
    ],
  },
  {
    id: 'dn-hai-chau',
    province: 'Đà Nẵng',
    ward: 'Phường Hải Châu',
    name: 'Đà Nẵng Pro Picklers',
    address: 'Trung tâm thể thao Hải Châu',
    pricePerHour: 210000,
    slots: [
      { id: 'dn-hc-1', date: '2026-06-20', startTime: '16:30', endTime: '18:00' },
      { id: 'dn-hc-2', date: '2026-06-21', startTime: '06:30', endTime: '08:00' },
    ],
  },
  {
    id: 'ct-ninh-kieu',
    province: 'Cần Thơ',
    ward: 'Phường Ninh Kiều',
    name: 'Cần Thơ Rally Court',
    address: 'Khu thể thao Ninh Kiều',
    pricePerHour: 190000,
    slots: [
      { id: 'ct-nk-1', date: '2026-06-20', startTime: '18:30', endTime: '20:00' },
      { id: 'ct-nk-2', date: '2026-06-22', startTime: '07:00', endTime: '08:30' },
    ],
  },
  {
    id: 'kh-nha-trang',
    province: 'Khánh Hòa',
    ward: 'Phường Nha Trang',
    name: 'Nha Trang Pickleball Club',
    address: 'Đường Trần Phú, Phường Nha Trang',
    pricePerHour: 230000,
    slots: [
      { id: 'kh-nt-1', date: '2026-06-21', startTime: '17:00', endTime: '18:30' },
      { id: 'kh-nt-2', date: '2026-06-22', startTime: '18:30', endTime: '20:00' },
    ],
  },
];

const generatedCourts: Court[] = provinceOptions
  .filter((province) => !featuredCourts.some((court) => court.province === province))
  .map((province, index) => ({
    id: `sample-${index}`,
    province,
    ward: index % 2 === 0 ? 'Phường Trung tâm' : 'Xã Trung tâm',
    name: `Sân Pickleball ${province}`,
    address: `${index % 2 === 0 ? 'Phường Trung tâm' : 'Xã Trung tâm'}, ${province}`,
    pricePerHour: 180000 + (index % 4) * 20000,
    slots: defaultSlots.map((slot, slotIndex) => ({
      ...slot,
      id: `${province.toLowerCase().replace(/\s+/g, '-')}-${slotIndex}`,
    })),
  }));

export const courtCatalog = [...featuredCourts, ...generatedCourts];

export const getCourtsByProvince = (province: string) => courtCatalog.filter((court) => court.province === province);

export const getWardsByProvince = (province: string) =>
  Array.from(new Set(getCourtsByProvince(province).map((court) => court.ward)));

export const getCourtsByWard = (province: string, ward: string) =>
  getCourtsByProvince(province).filter((court) => court.ward === ward);

const getSubCourtsForCourt = (court?: Court): SubCourt[] => {
  if (!court) {
    return [];
  }

  return (
    court.subCourts ??
    Array.from({ length: 5 }, (_, index) => ({
      id: `${court.id}-sub-${index + 1}`,
      name: `Sân con ${index + 1}`,
    }))
  );
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const formatMatchDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${date}T00:00:00`));

const timelineStartMinutes = 5 * 60;
const timelineEndMinutes = 22 * 60;
const timelineStepMinutes = 30;

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

const getSelectedTimeRange = (date: string, cellTimes: string[]): AvailabilitySlot | undefined => {
  if (cellTimes.length === 0) {
    return undefined;
  }

  const sortedCellTimes = [...cellTimes].sort((first, second) => timeToMinutes(first) - timeToMinutes(second));
  const lastCellStart = sortedCellTimes[sortedCellTimes.length - 1];

  return {
    id: `${date}-${sortedCellTimes.join('-')}`,
    date,
    startTime: sortedCellTimes[0],
    endTime: minutesToTime(timeToMinutes(lastCellStart) + timelineStepMinutes),
  };
};

const getContiguousTimeCells = (cellTimes: string[]) => {
  if (cellTimes.length === 0) {
    return [];
  }

  const selectedMinutes = cellTimes.map(timeToMinutes);
  const startMinute = Math.min(...selectedMinutes);
  const endMinute = Math.max(...selectedMinutes);

  return timelineColumns.filter((cellTime) => {
    const cellMinute = timeToMinutes(cellTime);

    return cellMinute >= startMinute && cellMinute <= endMinute;
  });
};

const formatDuration = (hours: number) => {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const durationHours = Math.floor(totalMinutes / 60);
  const durationMinutes = totalMinutes % 60;

  return `${durationHours}h${durationMinutes.toString().padStart(2, '0')}`;
};

const formatCalendarDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));

const toDateValue = (date: Date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')}`;

const toMonthDate = (date: string) => {
  const parsedDate = new Date(`${date}T00:00:00`);

  return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
};

const formatMonthTitle = (date: Date) => `tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;

const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

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

const getMockScheduleBlocks = (court: Court, subCourt: SubCourt, date: string, index: number): ScheduleBlock[] => [
  {
    id: `${court.id}-${subCourt.id}-${date}-booked-morning`,
    courtId: court.id,
    subCourtId: subCourt.id,
    date,
    startTime: index % 2 === 0 ? '05:30' : '06:00',
    endTime: index % 2 === 0 ? '06:30' : '07:00',
    status: 'booked',
  },
  {
    id: `${court.id}-${subCourt.id}-${date}-booked-evening`,
    courtId: court.id,
    subCourtId: subCourt.id,
    date,
    startTime: index % 3 === 0 ? '17:00' : '18:30',
    endTime: index % 3 === 0 ? '18:00' : '20:00',
    status: 'booked',
  },
  {
    id: `${court.id}-${subCourt.id}-${date}-locked`,
    courtId: court.id,
    subCourtId: subCourt.id,
    date,
    startTime: index % 2 === 0 ? '21:00' : '13:00',
    endTime: index % 2 === 0 ? '22:00' : '13:30',
    status: index % 2 === 0 ? 'locked' : 'event',
  },
];

const getCellBlockedStatus = (blocks: ScheduleBlock[], time: string) =>
  blocks.find((block) => {
    const cellStart = timeToMinutes(time);

    return cellStart >= timeToMinutes(block.startTime) && cellStart < timeToMinutes(block.endTime);
  })?.status;

const scheduleBlockClassNames: Record<ScheduleBlockStatus, string> = {
  booked: 'border-[#ff5a5f] bg-[#ff5a5f]',
  locked: 'border-[#8f9892] bg-[#8f9892]',
  event: 'border-[#e869de] bg-[#e869de]',
};

const scheduleBlockLabels: Record<ScheduleBlockStatus, string> = {
  booked: 'Đã đặt',
  locked: 'Khóa',
  event: 'Sự kiện',
};

const initialInvites: MatchInvite[] = [
  {
    id: 1,
    host: 'Trần Quốc Bảo',
    level: '3.5 - 4.0',
    province: 'Hà Nội',
    ward: 'Phường Cầu Giấy',
    court: 'Pickleball Pro Duy Tân',
    address: 'Số 1 Duy Tân, Phường Cầu Giấy',
    date: '2026-06-20',
    startTime: '18:00',
    endTime: '19:30',
    format: '2vs2',
    note: 'Đã đặt sân 90 phút, cần thêm người chơi ổn định nhịp đôi.',
    price: 360000,
    joined: 2,
    needed: 4,
  },
  {
    id: 2,
    host: 'Lê Tuyết Mai',
    level: '2.5 - 3.0',
    province: 'Hồ Chí Minh',
    ward: 'Phường Hòa Hưng',
    court: 'Sân Kỳ Hòa Pickleball',
    address: 'Cụm sân Kỳ Hòa, Phường Hòa Hưng',
    date: '2026-06-21',
    startTime: '07:00',
    endTime: '08:30',
    format: '1vs1',
    note: 'Ưu tiên giao lưu nhẹ, phù hợp người mới tập đánh đều bóng.',
    price: 330000,
    joined: 1,
    needed: 2,
  },
  {
    id: 3,
    host: 'Minh Tuấn',
    level: '3.0 - 3.5',
    province: 'Hà Nội',
    ward: 'Phường Từ Liêm',
    court: 'PickleHub Mỹ Đình',
    address: 'Mỹ Đình, Phường Từ Liêm',
    date: '2026-06-22',
    startTime: '19:30',
    endTime: '21:00',
    format: '2vs2',
    note: 'Tìm thêm 1 bạn đánh đôi nam nữ, chia tiền sân sau khi đủ người.',
    price: 390000,
    joined: 3,
    needed: 4,
  },
];

const defaultProvince = 'Hà Nội';
const defaultWard = getWardsByProvince(defaultProvince)[0];
const defaultCourt = getCourtsByWard(defaultProvince, defaultWard)[0];
const defaultSubCourt = getSubCourtsForCourt(defaultCourt)[0];
const defaultSlot = defaultCourt.slots[0];

export const Opponents = () => {
  const [invites, setInvites] = useState<MatchInvite[]>(initialInvites);
  const [selectedInvite, setSelectedInvite] = useState<MatchInvite | null>(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [draftBookingDate, setDraftBookingDate] = useState(defaultSlot.date);
  const [calendarMonthDate, setCalendarMonthDate] = useState(() => toMonthDate(defaultSlot.date));
  const [selectedTimeCells, setSelectedTimeCells] = useState<string[]>([]);
  const [form, setForm] = useState<InviteForm>({
    level: '3.0 - 3.5',
    province: defaultProvince,
    ward: defaultWard,
    courtId: defaultCourt.id,
    subCourtId: defaultSubCourt.id,
    bookingDate: defaultSlot.date,
    format: '2vs2',
    note: '',
  });

  const wardOptions = useMemo(() => getWardsByProvince(form.province), [form.province]);
  const courtOptions = useMemo(() => getCourtsByWard(form.province, form.ward), [form.province, form.ward]);
  const availableDates = useMemo(
    () => Array.from(new Set(courtOptions.flatMap((court) => court.slots.map((slot) => slot.date)))).sort(),
    [courtOptions],
  );
  const selectedCourt = courtCatalog.find((court) => court.id === form.courtId) ?? courtOptions[0];
  const selectedSubCourts = useMemo(() => getSubCourtsForCourt(selectedCourt), [selectedCourt]);
  const selectedSubCourt = selectedSubCourts.find((subCourt) => subCourt.id === form.subCourtId) ?? selectedSubCourts[0];
  const selectedSlot = getSelectedTimeRange(form.bookingDate, selectedTimeCells);
  const selectedDurationHours = selectedTimeCells.length * (timelineStepMinutes / 60);
  const selectedTotalPrice = selectedCourt ? Math.round(selectedCourt.pricePerHour * selectedDurationHours) : 0;
  const selectedNeededPlayers = form.format === '1vs1' ? 2 : 4;
  const selectedPerPlayerPrice = selectedNeededPlayers > 0 ? Math.ceil(selectedTotalPrice / selectedNeededPlayers) : 0;
  const activeBookingDate = form.bookingDate;
  const calendarCells = useMemo(() => getCalendarMonthCells(calendarMonthDate), [calendarMonthDate]);
  const availableDateSet = useMemo(() => new Set(availableDates), [availableDates]);
  const todayDateValue = toDateValue(new Date());
  const timelineGridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${timelineColumns.length}, 38px)`,
  };

  const waitingSlots = useMemo(
    () => invites.reduce((total, invite) => total + Math.max(invite.needed - invite.joined, 0), 0),
    [invites],
  );

  const updateForm = (field: keyof InviteForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const getFirstAvailableSelection = (court: Court, preferredDate?: string) => {
    const nextSlot = court.slots.find((slot) => slot.date === preferredDate) ?? court.slots[0];
    const nextSubCourt = getSubCourtsForCourt(court)[0];

    return {
      bookingDate: nextSlot.date,
      courtId: court.id,
      subCourtId: nextSubCourt.id,
      timeCells: [],
    };
  };

  const handleProvinceChange = (province: string) => {
    const nextWard = getWardsByProvince(province)[0];
    const nextCourt = getCourtsByWard(province, nextWard)[0];
    const nextSelection = getFirstAvailableSelection(nextCourt);

    setForm((current) => ({
      ...current,
      province,
      ward: nextWard,
      bookingDate: nextSelection.bookingDate,
      courtId: nextSelection.courtId,
      subCourtId: nextSelection.subCourtId,
    }));
    setSelectedTimeCells(nextSelection.timeCells);
  };

  const handleWardChange = (ward: string) => {
    const nextCourt = getCourtsByWard(form.province, ward)[0];
    const nextSelection = getFirstAvailableSelection(nextCourt);

    setForm((current) => ({
      ...current,
      ward,
      bookingDate: nextSelection.bookingDate,
      courtId: nextSelection.courtId,
      subCourtId: nextSelection.subCourtId,
    }));
    setSelectedTimeCells(nextSelection.timeCells);
  };

  const handleCourtChange = (courtId: string) => {
    const nextCourt = courtCatalog.find((court) => court.id === courtId);

    if (!nextCourt) {
      return;
    }

    const nextSelection = getFirstAvailableSelection(nextCourt, form.bookingDate);

    setForm((current) => ({
      ...current,
      bookingDate: nextSelection.bookingDate,
      courtId: nextSelection.courtId,
      subCourtId: nextSelection.subCourtId,
    }));
    setSelectedTimeCells(nextSelection.timeCells);
  };

  const applyBookingDate = (bookingDate: string) => {
    setForm((current) => ({
      ...current,
      bookingDate,
    }));
    setSelectedTimeCells([]);
  };

  const openDatePicker = () => {
    setDraftBookingDate(form.bookingDate);
    setCalendarMonthDate(toMonthDate(form.bookingDate));
    setIsDatePickerOpen(true);
  };

  const moveCalendarMonth = (offset: number) => {
    setCalendarMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  };

  const confirmDatePicker = () => {
    applyBookingDate(draftBookingDate);
    setIsDatePickerOpen(false);
  };

  const handleScheduleCellSelect = (subCourt: SubCourt, time: string) => {
    const currentSubCourtId = form.subCourtId;

    setForm((current) => ({
      ...current,
      subCourtId: subCourt.id,
    }));

    setSelectedTimeCells((current) => {
      const isSameSubCourt = currentSubCourtId === subCourt.id;

      if (!isSameSubCourt || current.length === 0) {
        return [time];
      }

      if (current.includes(time)) {
        if (current.length === 1) {
          return [];
        }

        const sortedTimeCells = [...current].sort((first, second) => timeToMinutes(first) - timeToMinutes(second));
        const clickedMinute = timeToMinutes(time);
        const firstMinute = timeToMinutes(sortedTimeCells[0]);
        const lastMinute = timeToMinutes(sortedTimeCells[sortedTimeCells.length - 1]);

        if (clickedMinute === firstMinute) {
          return sortedTimeCells.slice(1);
        }

        if (clickedMinute === lastMinute) {
          return sortedTimeCells.slice(0, -1);
        }

        return [time];
      }

      return getContiguousTimeCells([...current, time]);
    });
  };

  const createInvite = () => {
    if (!selectedCourt || !selectedSubCourt || !selectedSlot) {
      return;
    }

    const newInvite: MatchInvite = {
      id: Date.now(),
      host: 'Bạn',
      level: form.level,
      province: form.province,
      ward: form.ward,
      court: `${selectedCourt.name} - ${selectedSubCourt.name}`,
      address: selectedCourt.address,
      date: selectedSlot.date,
      startTime: selectedSlot.startTime,
      endTime: selectedSlot.endTime,
      format: form.format,
      note: form.note || 'Đang chờ người chơi phù hợp tham gia.',
      price: selectedTotalPrice,
      joined: 1,
      needed: selectedNeededPlayers,
    };

    setInvites((current) => [newInvite, ...current]);
    setSelectedInvite(null);
    setForm((current) => ({ ...current, note: '' }));
  };

  const handleCreateInvite = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createInvite();
  };

  const handleJoinInvite = (invite: MatchInvite) => {
    const updatedInvite = {
      ...invite,
      joined: Math.min(invite.joined + 1, invite.needed),
    };

    setInvites((current) => current.map((item) => (item.id === invite.id ? updatedInvite : item)));
    setSelectedInvite(updatedInvite);
  };

  return (
    <div className="flex w-full flex-1 flex-col overflow-x-hidden bg-[#f9f9ff] font-body-md text-on-surface">
      <section className="bg-primary pt-[72px]">
        <div className="mx-auto max-w-[1200px] px-4 py-10 text-white md:px-margin-desktop md:py-14">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[13px] font-bold backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Chọn khu vực, sân và khung giờ còn trống
              </span>
              <h1 className="max-w-3xl text-[32px] font-bold leading-tight md:text-[44px]">
                Tạo lời mời chơi pickleball và chia tiền sân khi có người tham gia
              </h1>
              <p className="mt-4 max-w-2xl text-[17px] leading-7 text-white/88">
                Người chơi chọn tỉnh/thành, xã/phường, sân và khung giờ trống. Lời mời sẽ xuất hiện trong danh sách đang chờ để người khác tham gia, sau đó cả hai bên cùng xác nhận thanh toán tiền sân.
              </p>
              <Link
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-[14px] font-bold text-primary transition-colors hover:bg-white/90"
                to="/my-matches"
              >
                <Trophy className="h-5 w-5" />
                Xem trận của tôi
              </Link>
              <Link
                className="ml-0 mt-3 inline-flex items-center gap-2 rounded-lg border border-white/40 px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-white/10 sm:ml-3 sm:mt-5"
                to="/opponents/pending"
              >
                <ListChecks className="h-5 w-5" />
                Lời mời đang chờ
              </Link>
            </div>
            <div className="rounded-xl border border-white/18 bg-white/10 p-5 backdrop-blur">
              <p className="text-[13px] font-bold uppercase tracking-wide text-white/75">Tổng quan hôm nay</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/12 p-4">
                  <p className="text-[28px] font-bold">{invites.length}</p>
                  <p className="text-[13px] font-medium text-white/78">Lời mời chờ</p>
                </div>
                <div className="rounded-lg bg-white/12 p-4">
                  <p className="text-[28px] font-bold">{waitingSlots}</p>
                  <p className="text-[13px] font-medium text-white/78">Vị trí trống</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-gutter px-4 py-8 md:px-margin-desktop lg:grid-cols-[390px_minmax(0,1fr)]">
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white">
                <PlusCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-[20px] font-bold">Tạo lời mời ghép trận</h2>
                <p className="text-[13px] font-medium text-on-surface-variant">Chọn sân theo khu vực và lịch trống</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleCreateInvite}>
              <div>
                <label className="mb-1 block text-[14px] font-bold text-on-surface-variant" htmlFor="province">
                  Tỉnh/thành
                </label>
                <select
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-3 text-[15px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  id="province"
                  onChange={(event) => handleProvinceChange(event.target.value)}
                  value={form.province}
                >
                  {provinceOptions.map((province) => (
                    <option key={province}>{province}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[14px] font-bold text-on-surface-variant" htmlFor="ward">
                  Xã/phường
                </label>
                <select
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-3 text-[15px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  id="ward"
                  onChange={(event) => handleWardChange(event.target.value)}
                  value={form.ward}
                >
                  {wardOptions.map((ward) => (
                    <option key={ward}>{ward}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[14px] font-bold text-on-surface-variant" htmlFor="court">
                  Cụm sân trong khu vực
                </label>
                <select
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-3 text-[15px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  id="court"
                  onChange={(event) => handleCourtChange(event.target.value)}
                  value={form.courtId}
                >
                  {courtOptions.map((court) => (
                    <option key={court.id} value={court.id}>
                      {court.name}
                    </option>
                  ))}
                </select>
                {selectedCourt && (
                  <p className="mt-2 flex items-start gap-2 text-[12px] font-medium leading-5 text-on-surface-variant">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {selectedCourt.address} · {formatCurrency(selectedCourt.pricePerHour)}/giờ
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-primary/25 bg-[#f3f9eb] p-4">
                <p className="text-[13px] font-bold text-on-surface-variant">Lịch đang chọn</p>
                <p className="mt-2 text-[15px] font-bold text-on-surface">
                  {selectedCourt?.name}
                  {selectedSubCourt ? ` - ${selectedSubCourt.name}` : ''}
                </p>
                <p className="mt-1 text-[13px] font-medium leading-5 text-on-surface-variant">
                  {selectedSlot
                    ? `${formatCalendarDate(selectedSlot.date)} · ${selectedSlot.startTime} - ${selectedSlot.endTime}`
                    : 'Bấm vào ô trắng ở sân con bên phải để chọn giờ chơi'}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                  <div className="rounded-lg bg-white p-3">
                    <p className="font-bold text-on-surface-variant">Tổng giờ</p>
                    <p className="mt-1 font-bold text-primary">{formatDuration(selectedDurationHours)}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <p className="font-bold text-on-surface-variant">Mỗi người</p>
                    <p className="mt-1 font-bold text-primary">{formatCurrency(selectedPerPlayerPrice)}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[14px] font-bold text-on-surface-variant" htmlFor="level">
                  Trình độ
                </label>
                <select
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-3 text-[15px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  id="level"
                  onChange={(event) => updateForm('level', event.target.value)}
                  value={form.level}
                >
                  <option>2.0 - 2.5</option>
                  <option>3.0 - 3.5</option>
                  <option>3.5 - 4.0</option>
                  <option>4.0 - 4.5</option>
                  <option>5.0+</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-bold text-on-surface-variant">Hình thức</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['1vs1', '2vs2'] as const).map((format) => (
                    <button
                      className={`rounded-lg border px-3 py-3 text-[14px] font-bold transition-colors ${
                        form.format === format
                          ? 'border-primary bg-primary text-white'
                          : 'border-outline-variant bg-white text-on-surface hover:bg-surface-container-low'
                      }`}
                      key={format}
                      onClick={() => updateForm('format', format)}
                      type="button"
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[14px] font-bold text-on-surface-variant" htmlFor="note">
                  Ghi chú
                </label>
                <textarea
                  className="min-h-24 w-full resize-none rounded-lg border border-outline-variant bg-white px-3 py-3 text-[15px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  id="note"
                  onChange={(event) => updateForm('note', event.target.value)}
                  placeholder="VD: cần người đánh đôi vui vẻ, chia sân sau khi đủ người..."
                  value={form.note}
                />
              </div>

              <button
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[15px] font-bold text-white transition-colors ${
                  selectedSlot ? 'bg-primary hover:bg-primary/90' : 'cursor-not-allowed bg-[#9aa58e]'
                }`}
                disabled={!selectedSlot}
                type="submit"
              >
                <PlusCircle className="h-5 w-5" />
                Đăng lời mời
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-primary/20 bg-[#f0f3ff] p-5">
            <h3 className="flex items-center gap-2 text-[18px] font-bold text-primary">
              <ListChecks className="h-5 w-5" />
              Luồng ghép trận
            </h3>
            <ol className="mt-4 space-y-3 text-[14px] font-medium text-on-surface-variant">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white">1</span>
                Chọn tỉnh/thành, xã/phường, sân và khung giờ còn trống.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white">2</span>
                Lời mời xuất hiện trong danh sách đang chờ.
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white">3</span>
                Người khác tham gia và cả hai cùng thanh toán tiền sân.
              </li>
            </ol>
            <p className="mt-4 rounded-lg bg-white/70 p-3 text-[12px] font-medium leading-5 text-on-surface-variant">
              Dữ liệu sân hiện là mẫu front-end. Khi có backend, phần này nên lấy từ API sân và API lịch trống theo thời gian thực.
            </p>
          </section>
        </aside>

        <div className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
            <div className="bg-primary p-4 text-white">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-[22px] font-bold">Đặt lịch ngày trực quan</h2>
                  <p className="mt-1 text-[13px] font-medium text-white/78">
                    {selectedCourt?.name} · {form.ward}, {form.province}
                  </p>
                </div>
                <div className="relative">
                  <button
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-white/25 bg-white px-4 py-3 text-[14px] font-bold text-primary shadow-sm transition-colors hover:bg-white/92 sm:w-44"
                    onClick={openDatePicker}
                    type="button"
                  >
                    {formatCalendarDate(activeBookingDate)}
                    <CalendarDays className="h-5 w-5" />
                  </button>

                  {isDatePickerOpen && (
                    <>
                      <button
                        aria-label="Đóng chọn ngày"
                        className="fixed inset-0 z-40 cursor-default bg-black/35"
                        onClick={() => setIsDatePickerOpen(false)}
                        type="button"
                      />
                      <div
                        aria-modal="true"
                        className="fixed left-1/2 top-24 z-50 w-[min(356px,calc(100vw-24px))] -translate-x-1/2 rounded-lg bg-white p-5 text-on-surface shadow-2xl"
                        role="dialog"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            aria-label="Tháng trước"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10"
                            onClick={() => moveCalendarMonth(-1)}
                            type="button"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                          <p className="text-[16px] font-medium">{formatMonthTitle(calendarMonthDate)}</p>
                          <button
                            aria-label="Tháng sau"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-primary/10"
                            onClick={() => moveCalendarMonth(1)}
                            type="button"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        </div>

                        <div className="mt-6 grid grid-cols-7 gap-y-2 text-center text-[13px] font-medium text-on-surface-variant/70">
                          {weekdayLabels.map((label) => (
                            <span key={label}>{label}</span>
                          ))}
                        </div>

                        <div className="mt-4 grid grid-cols-7 gap-y-2 text-center">
                          {calendarCells.map((date, index) => {
                            if (!date) {
                              return <span aria-hidden="true" className="h-10" key={`empty-${index}`} />;
                            }

                            const day = Number(date.slice(-2));
                            const isSelected = draftBookingDate === date;
                            const isPastDate = date < todayDateValue;
                            const hasAvailableSlot = availableDateSet.has(date);

                            return (
                              <button
                                aria-pressed={isSelected}
                                className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg text-[14px] transition-colors ${
                                  isSelected
                                    ? 'bg-primary font-bold text-white'
                                    : isPastDate
                                      ? 'cursor-not-allowed text-[#b9b9b9]'
                                      : hasAvailableSlot
                                        ? 'font-bold text-on-surface hover:bg-primary/10'
                                        : 'font-medium text-on-surface hover:bg-primary/10'
                                }`}
                                disabled={isPastDate}
                                key={date}
                                onClick={() => setDraftBookingDate(date)}
                                type="button"
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-8 flex justify-end gap-5">
                          <button
                            className="rounded-lg px-2 py-2 text-[14px] font-medium text-primary hover:bg-primary/10"
                            onClick={() => setIsDatePickerOpen(false)}
                            type="button"
                          >
                            Hủy
                          </button>
                          <button
                            className="rounded-lg bg-primary px-4 py-2 text-[14px] font-bold text-white hover:bg-primary/90"
                            onClick={confirmDatePicker}
                            type="button"
                          >
                            Xác nhận
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px] font-bold">
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-white ring-1 ring-[#d8dfda]" />
                  Trống
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-[#c7f0d8] ring-1 ring-[#56a36c]" />
                  Đang chọn
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-[#ff5a5f]" />
                  Đã đặt
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-[#8f9892]" />
                  Khóa
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-[#e869de]" />
                  Sự kiện
                </span>
              </div>
            </div>

            <p className="border-b border-[#b8e4cf] bg-[#eefbf4] px-4 py-3 text-center text-[13px] font-medium text-on-surface-variant">
              <span className="font-bold text-[#d77a00]">Lưu ý:</span> Bấm vào ô trắng trong từng sân con để chọn giờ; bấm lại ô xanh ở đầu/cuối để thu ngắn lịch.
            </p>

            <div className="overflow-x-auto">
              <div className="min-w-[1440px]">
                <div className="grid grid-cols-[86px_110px_auto] bg-[#b7eef2] text-[12px] font-medium text-[#356058]">
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

                {selectedCourt && (
                  <div
                    className="grid grid-cols-[86px_110px_auto] border-b border-[#c5d7cd]"
                    style={{ gridTemplateRows: `repeat(${Math.max(selectedSubCourts.length, 1)}, 56px)` }}
                  >
                    <div
                      className="sticky left-0 z-30 flex items-center justify-center border-r border-[#a7d9c1] bg-[#d9f7e8] px-2 text-center"
                      style={{ gridRow: `1 / span ${Math.max(selectedSubCourts.length, 1)}` }}
                    >
                      <span className="line-clamp-3 text-[12px] font-bold leading-5 text-[#226143]">{selectedCourt.name}</span>
                    </div>

                    {selectedSubCourts.map((subCourt, subCourtIndex) => {
                      const blockedSlots = getMockScheduleBlocks(selectedCourt, subCourt, activeBookingDate, subCourtIndex);

                      return (
                        <React.Fragment key={subCourt.id}>
                          <div
                            className="sticky left-[86px] z-20 flex items-center border-r border-b border-[#b9d8ca] bg-[#dff7ea] px-3"
                            style={{ gridColumn: 2, gridRow: subCourtIndex + 1 }}
                          >
                            <span className="text-[13px] font-bold text-[#226143]">{subCourt.name}</span>
                          </div>

                          <div className="relative border-b border-[#c5d7cd]" style={{ gridColumn: 3, gridRow: subCourtIndex + 1 }}>
                            <div className="grid h-full" style={timelineGridStyle}>
                              {timelineColumns.map((time) => {
                                const blockedStatus = getCellBlockedStatus(blockedSlots, time);
                                const isSelected =
                                  form.subCourtId === subCourt.id &&
                                  activeBookingDate === form.bookingDate &&
                                  selectedTimeCells.includes(time);

                                return (
                                  <button
                                    aria-label={`${subCourt.name} ${time}`}
                                    aria-pressed={isSelected}
                                    className={`h-14 border-r border-[#aeb7b0] transition-colors last:border-r-0 ${
                                      blockedStatus
                                        ? `${scheduleBlockClassNames[blockedStatus]} cursor-not-allowed`
                                        : isSelected
                                          ? 'border-[#4c9b62] bg-[#c7f0d8] hover:bg-[#a9e7c3]'
                                          : 'bg-white hover:bg-[#eefbf4]'
                                    }`}
                                    disabled={!!blockedStatus}
                                    key={`${subCourt.id}-${time}`}
                                    onClick={() => handleScheduleCellSelect(subCourt, time)}
                                    style={isSelected ? { backgroundColor: '#c7f0d8' } : undefined}
                                    title={
                                      blockedStatus
                                        ? `${scheduleBlockLabels[blockedStatus]} ${time} - ${minutesToTime(timeToMinutes(time) + timelineStepMinutes)}`
                                        : `${subCourt.name} · ${time} - ${minutesToTime(timeToMinutes(time) + timelineStepMinutes)}`
                                    }
                                    type="button"
                                  >
                                    <span className="sr-only">{time}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-primary p-4 text-white">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="grid grid-cols-2 gap-4 text-[15px] font-bold md:flex md:items-center">
                  <span>Tổng giờ: {formatDuration(selectedDurationHours)}</span>
                  <span>Tổng tiền: {formatCurrency(selectedTotalPrice)}</span>
                  <span className="col-span-2 text-[13px] text-white/78 md:col-span-1">
                    Mỗi người: {formatCurrency(selectedPerPlayerPrice)}
                  </span>
                </div>
                <button
                  className={`rounded-lg px-5 py-3 text-[14px] font-bold text-white transition-colors ${
                    selectedSlot ? 'bg-[#eab526] hover:bg-[#d6a51f]' : 'cursor-not-allowed bg-[#a7ad9a]'
                  }`}
                  disabled={!selectedSlot}
                  onClick={createInvite}
                  type="button"
                >
                  TIẾP THEO
                </button>
              </div>
            </div>
          </section>

          {selectedInvite && (
            <section className="rounded-xl border border-primary bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary-container px-3 py-1 text-[12px] font-bold text-on-primary-container">
                    <ShieldCheck className="h-4 w-4" />
                    Đã có người đồng ý tham gia
                  </span>
                  <h2 className="mt-3 text-[22px] font-bold text-on-surface">Bước tiếp theo: cả hai cùng thanh toán tiền sân</h2>
                  <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">
                    Trận tại {selectedInvite.court} lúc {selectedInvite.startTime} - {selectedInvite.endTime}, {formatMatchDate(selectedInvite.date)} đã được ghép. Hệ thống giữ chỗ sau khi hai bên thanh toán phần của mình.
                  </p>
                </div>
                <div className="rounded-lg bg-surface-container-low p-4 lg:w-72">
                  <div className="flex items-center justify-between text-[14px]">
                    <span className="font-bold text-on-surface-variant">Tổng tiền sân</span>
                    <span className="font-bold">{formatCurrency(selectedInvite.price)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[14px]">
                    <span className="font-bold text-on-surface-variant">Mỗi người</span>
                    <span className="text-[20px] font-bold text-primary">
                      {formatCurrency(Math.ceil(selectedInvite.price / selectedInvite.needed))}
                    </span>
                  </div>
                  <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90" type="button">
                    <CreditCard className="h-5 w-5" />
                    Thanh toán phần của tôi
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-outline-variant p-4">
                  <p className="text-[13px] font-bold text-on-surface-variant">Người tạo lời mời</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold">{selectedInvite.host}</span>
                    <span className="rounded-full bg-[#fff4d8] px-3 py-1 text-[12px] font-bold text-[#6f4d00]">Chờ thanh toán</span>
                  </div>
                </div>
                <div className="rounded-lg border border-outline-variant p-4">
                  <p className="text-[13px] font-bold text-on-surface-variant">Người tham gia</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-bold">Bạn</span>
                    <span className="rounded-full bg-[#fff4d8] px-3 py-1 text-[12px] font-bold text-[#6f4d00]">Chờ thanh toán</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-xl border border-primary bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-[22px] font-bold text-on-surface">Lời mời đang chờ đã chuyển sang trang riêng</h2>
                <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">
                  Mở trang lời mời đang chờ để xem danh sách, tham gia trận và theo dõi trạng thái ghép trận.
                </p>
              </div>
              <Link
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                to="/opponents/pending"
              >
                <ListChecks className="h-5 w-5" />
                Xem lời mời đang chờ
              </Link>
            </div>
          </section>

          <section className="hidden rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-[24px] font-bold text-on-surface">Lời mời đang chờ</h2>
                <p className="mt-1 text-[14px] font-medium text-on-surface-variant">
                  Người chơi khác sẽ thấy những lời mời này và có thể bấm tham gia.
                </p>
              </div>
              <span className="w-fit rounded-full bg-surface-container-low px-4 py-2 text-[13px] font-bold text-primary">
                {waitingSlots} vị trí còn trống
              </span>
            </div>

            <div className="space-y-4">
              {invites.map((invite) => {
                const availableSlots = Math.max(invite.needed - invite.joined, 0);
                const perPlayerPrice = Math.ceil(invite.price / invite.needed);

                return (
                  <article className="rounded-xl border border-outline-variant p-4 transition-colors hover:border-primary" key={invite.id}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary">
                            {invite.format}
                          </span>
                          <span className="rounded-full bg-surface-container-low px-3 py-1 text-[12px] font-bold text-on-surface-variant">
                            Level {invite.level}
                          </span>
                          {availableSlots === 0 && (
                            <span className="rounded-full bg-[#eaf7df] px-3 py-1 text-[12px] font-bold text-primary">
                              Đủ người
                            </span>
                          )}
                        </div>
                        <Link to={`/matches/${invite.id}`}>
                          <h3 className="mt-3 text-[20px] font-bold text-on-surface transition-colors hover:text-primary">
                            {invite.host === 'Bạn' ? 'Lời mời của bạn' : `${invite.host} đang tìm người chơi`}
                          </h3>
                        </Link>
                        <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">{invite.note}</p>
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
                        <Link
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-5 py-3 text-[14px] font-bold text-primary transition-colors hover:bg-primary/10 lg:w-auto"
                          to={`/matches/${invite.id}`}
                        >
                          <Eye className="h-5 w-5" />
                          Xem chi tiết
                        </Link>
                        <button
                          className={`flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-[14px] font-bold transition-colors lg:w-auto ${
                            availableSlots === 0
                              ? 'cursor-not-allowed bg-surface-container-low text-on-surface-variant'
                              : 'bg-primary text-white hover:bg-primary/90'
                          }`}
                          disabled={availableSlots === 0}
                          onClick={() => handleJoinInvite(invite)}
                          type="button"
                        >
                          {availableSlots === 0 ? <CheckCircle2 className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                          {availableSlots === 0 ? 'Đã đủ người' : 'Tham gia'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-lg bg-surface-container-low p-3">
                        <p className="flex items-center gap-2 text-[13px] font-bold text-on-surface-variant">
                          <LandPlot className="h-4 w-4 text-primary" />
                          Sân chơi
                        </p>
                        <p className="mt-1 text-[14px] font-bold">{invite.court}</p>
                      </div>
                      <div className="rounded-lg bg-surface-container-low p-3">
                        <p className="flex items-center gap-2 text-[13px] font-bold text-on-surface-variant">
                          <MapPin className="h-4 w-4 text-primary" />
                          Khu vực
                        </p>
                        <p className="mt-1 text-[14px] font-bold">
                          {invite.ward}, {invite.province}
                        </p>
                      </div>
                      <div className="rounded-lg bg-surface-container-low p-3">
                        <p className="flex items-center gap-2 text-[13px] font-bold text-on-surface-variant">
                          <CalendarClock className="h-4 w-4 text-primary" />
                          Thời gian
                        </p>
                        <p className="mt-1 text-[14px] font-bold">
                          {invite.startTime} - {invite.endTime} · {formatMatchDate(invite.date)}
                        </p>
                      </div>
                      <div className="rounded-lg bg-surface-container-low p-3">
                        <p className="flex items-center gap-2 text-[13px] font-bold text-on-surface-variant">
                          <CreditCard className="h-4 w-4 text-primary" />
                          Chia tiền sân
                        </p>
                        <p className="mt-1 text-[14px] font-bold">{formatCurrency(perPlayerPrice)}/người</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-[13px] font-bold text-on-surface-variant">
                      <Users className="h-4 w-4 text-primary" />
                      {invite.joined}/{invite.needed} người · còn {availableSlots} vị trí
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="text-[22px] font-bold text-on-surface">Trạng thái sau khi ghép trận</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { icon: Trophy, title: 'Đủ người chơi', text: 'Lời mời chuyển sang trạng thái chờ thanh toán.' },
                { icon: CreditCard, title: 'Cùng thanh toán', text: 'Mỗi người trả phần tiền sân tương ứng.' },
                { icon: Clock, title: 'Giữ sân', text: 'Khi cả hai bên hoàn tất, lịch chơi được xác nhận.' },
              ].map((item) => (
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4" key={item.title}>
                  <item.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-3 text-[16px] font-bold">{item.title}</h3>
                  <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">{item.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

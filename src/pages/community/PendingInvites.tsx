import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Filter,
  LandPlot,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { getCourtsByProvince, getWardsByProvince, provinceOptions } from './Opponents';

type MatchFormat = '1vs1' | '2vs2';

type MatchInvite = {
  id: number;
  ownerType: 'mine' | 'other';
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

type InviteFilters = {
  ownerType: 'all' | 'mine' | 'other';
  format: 'all' | MatchFormat;
  level: string;
  province: string;
  ward: string;
  court: string;
  date: string;
};

const defaultFilters: InviteFilters = {
  ownerType: 'all',
  format: 'all',
  level: 'all',
  province: 'all',
  ward: 'all',
  court: 'all',
  date: '',
};

const initialInvites: MatchInvite[] = [
  {
    id: 1,
    ownerType: 'other',
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
    ownerType: 'other',
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
    ownerType: 'mine',
    host: 'Bạn',
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

export const PendingInvites = () => {
  const [invites, setInvites] = useState<MatchInvite[]>(initialInvites);
  const [selectedInvite, setSelectedInvite] = useState<MatchInvite | null>(null);
  const [filters, setFilters] = useState<InviteFilters>(defaultFilters);

  const waitingSlots = useMemo(
    () => invites.reduce((total, invite) => total + Math.max(invite.needed - invite.joined, 0), 0),
    [invites],
  );

  const levelOptions = useMemo(() => Array.from(new Set(invites.map((invite) => invite.level))).sort(), [invites]);
  const wardOptions = useMemo(
    () => {
      const wards =
        filters.province === 'all'
          ? provinceOptions.flatMap((province) => getWardsByProvince(province))
          : getWardsByProvince(filters.province);

      return Array.from(new Set(wards)).sort();
    },
    [filters.province],
  );
  const courtOptions = useMemo(
    () => {
      const courts =
        filters.province === 'all'
          ? provinceOptions.flatMap((province) => getCourtsByProvince(province))
          : getCourtsByProvince(filters.province);

      return Array.from(
        new Set(
          courts
            .filter((court) => filters.ward === 'all' || court.ward === filters.ward)
            .map((court) => court.name),
        ),
      ).sort();
    },
    [filters.province, filters.ward],
  );

  const filteredInvites = useMemo(
    () =>
      invites.filter((invite) => {
        const matchesOwnerType = filters.ownerType === 'all' || invite.ownerType === filters.ownerType;
        const matchesFormat = filters.format === 'all' || invite.format === filters.format;
        const matchesLevel = filters.level === 'all' || invite.level === filters.level;
        const matchesProvince = filters.province === 'all' || invite.province === filters.province;
        const matchesWard = filters.ward === 'all' || invite.ward === filters.ward;
        const matchesCourt = filters.court === 'all' || invite.court === filters.court;
        const matchesDate = !filters.date || invite.date === filters.date;

        return matchesOwnerType && matchesFormat && matchesLevel && matchesProvince && matchesWard && matchesCourt && matchesDate;
      }),
    [filters, invites],
  );

  const filteredWaitingSlots = useMemo(
    () => filteredInvites.reduce((total, invite) => total + Math.max(invite.needed - invite.joined, 0), 0),
    [filteredInvites],
  );

  const updateFilter = (field: keyof InviteFilters, value: string) => {
    setFilters((current): InviteFilters => {
      if (field === 'province') {
        return { ...current, province: value, ward: 'all', court: 'all' };
      }

      if (field === 'ward') {
        return { ...current, ward: value, court: 'all' };
      }

      return { ...current, [field]: value } as InviteFilters;
    });
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
    <div className="flex w-full flex-1 flex-col overflow-x-hidden bg-[#f9f9ff] pt-[72px] font-body-md text-on-surface">
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-margin-desktop md:py-10">
          <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-white/86 hover:text-white" to="/opponents">
            <ArrowLeft className="h-4 w-4" />
            Quay lại tạo lời mời
          </Link>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[13px] font-bold">
                <Users className="h-4 w-4" />
                Danh sách ghép trận
              </span>
              <h1 className="mt-4 text-[32px] font-bold leading-tight md:text-[44px]">Lời mời đang chờ</h1>
              <p className="mt-4 max-w-2xl text-[16px] leading-7 text-white/85">
                Xem các lời mời đang mở, tham gia trận phù hợp và cùng thanh toán phần tiền sân sau khi ghép đủ người.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-[14px] font-bold text-primary hover:bg-white/90"
                  to="/opponents"
                >
                  <UserPlus className="h-5 w-5" />
                  Tạo lời mời mới
                </Link>
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/40 px-4 py-3 text-[14px] font-bold text-white hover:bg-white/10"
                  to="/my-matches"
                >
                  <Trophy className="h-5 w-5" />
                  Xem trận của tôi
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-white/18 bg-white/10 p-5 backdrop-blur">
              <p className="text-[13px] font-bold uppercase tracking-wide text-white/75">Tổng quan</p>
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

      <main className="mx-auto w-full max-w-[1200px] space-y-6 px-4 py-8 md:px-margin-desktop">
        <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-[22px] font-bold text-on-surface">
                <Filter className="h-5 w-5 text-primary" />
                Bộ lọc lời mời
              </h2>
              <p className="mt-1 text-[14px] text-on-surface-variant">
                Lọc nhanh theo loại lời mời, hình thức, trình độ, khu vực, sân và ngày chơi.
              </p>
            </div>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-[14px] font-bold text-on-surface hover:bg-surface-container-low"
              onClick={() => setFilters(defaultFilters)}
              type="button"
            >
              <RotateCcw className="h-5 w-5" />
              Xóa lọc
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-7">
            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Loại lời mời</span>
              <select
                className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => updateFilter('ownerType', event.target.value)}
                value={filters.ownerType}
              >
                <option value="all">Tất cả</option>
                <option value="other">Lời mời đang chờ</option>
                <option value="mine">Lời mời của tôi</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Hình thức</span>
              <select
                className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => updateFilter('format', event.target.value)}
                value={filters.format}
              >
                <option value="all">Tất cả</option>
                <option value="1vs1">1vs1</option>
                <option value="2vs2">2vs2</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Trình độ</span>
              <select
                className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => updateFilter('level', event.target.value)}
                value={filters.level}
              >
                <option value="all">Tất cả</option>
                {levelOptions.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Tỉnh/thành</span>
              <select
                className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => updateFilter('province', event.target.value)}
                value={filters.province}
              >
                <option value="all">Tất cả</option>
                {provinceOptions.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Xã/phường</span>
              <select
                className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => updateFilter('ward', event.target.value)}
                value={filters.ward}
              >
                <option value="all">Tất cả</option>
                {wardOptions.map((ward) => (
                  <option key={ward} value={ward}>
                    {ward}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Sân</span>
              <select
                className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => updateFilter('court', event.target.value)}
                value={filters.court}
              >
                <option value="all">Tất cả</option>
                {courtOptions.map((court) => (
                  <option key={court} value={court}>
                    {court}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Thời gian</span>
              <input
                className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => updateFilter('date', event.target.value)}
                type="date"
                value={filters.date}
              />
            </label>
          </div>

          <p className="mt-4 text-[13px] font-bold text-on-surface-variant">
            Đang hiển thị {filteredInvites.length}/{invites.length} lời mời, còn {filteredWaitingSlots} vị trí trống.
          </p>
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
                  Trận tại {selectedInvite.court} lúc {selectedInvite.startTime} - {selectedInvite.endTime},{' '}
                  {formatMatchDate(selectedInvite.date)} đã được ghép. Hệ thống giữ chỗ sau khi hai bên thanh toán phần của mình.
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
          </section>
        )}

        <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[24px] font-bold text-on-surface">Lời mời đang chờ</h2>
              <p className="mt-1 text-[14px] font-medium text-on-surface-variant">
                Người chơi khác sẽ thấy những lời mời này và có thể bấm tham gia.
              </p>
            </div>
            <span className="w-fit rounded-full bg-surface-container-low px-4 py-2 text-[13px] font-bold text-primary">
              {filteredWaitingSlots} vị trí còn trống
            </span>
          </div>

          <div className="space-y-4">
            {filteredInvites.map((invite) => {
              const availableSlots = Math.max(invite.needed - invite.joined, 0);
              const perPlayerPrice = Math.ceil(invite.price / invite.needed);
              const isMyInvite = invite.ownerType === 'mine';

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
                        {isMyInvite && (
                          <span className="rounded-full bg-[#fff4d8] px-3 py-1 text-[12px] font-bold text-[#755400]">
                            Của tôi
                          </span>
                        )}
                        {availableSlots === 0 && (
                          <span className="rounded-full bg-[#eaf7df] px-3 py-1 text-[12px] font-bold text-primary">
                            Đủ người
                          </span>
                        )}
                      </div>
                      <Link to={`/matches/${invite.id}`}>
                        <h3 className="mt-3 text-[20px] font-bold text-on-surface transition-colors hover:text-primary">
                          {isMyInvite ? 'Lời mời của bạn' : `${invite.host} đang tìm người chơi`}
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
                      {isMyInvite ? (
                        <Link
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-low px-5 py-3 text-[14px] font-bold text-on-surface-variant transition-colors hover:bg-primary/10 hover:text-primary lg:w-auto"
                          to={`/matches/${invite.id}`}
                        >
                          <ShieldCheck className="h-5 w-5" />
                          Quản lý
                        </Link>
                      ) : (
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
                      )}
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
            {filteredInvites.length === 0 && (
              <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-8 text-center">
                <h3 className="text-[18px] font-bold text-on-surface">Không có lời mời phù hợp</h3>
                <p className="mx-auto mt-2 max-w-xl text-[14px] leading-6 text-on-surface-variant">
                  Hãy đổi bộ lọc hoặc xóa lọc để xem thêm các lời mời đang chờ người chơi.
                </p>
                <button
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                  onClick={() => setFilters(defaultFilters)}
                  type="button"
                >
                  <RotateCcw className="h-5 w-5" />
                  Xóa lọc
                </button>
              </div>
            )}
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
      </main>
    </div>
  );
};

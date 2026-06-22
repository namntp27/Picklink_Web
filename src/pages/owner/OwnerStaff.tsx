import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, History, ShieldCheck, UserMinus, UserPlus, UsersRound, XCircle } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  assignOwnerStaff,
  createOwnerStaffAccount,
  getOwnerCheckInHistory,
  getOwnerStaff,
  getOwnerVenues,
  updateOwnerStaff,
  type OwnerCheckInHistory,
  type OwnerStaffAssignment,
  type OwnerVenue,
  type StaffPermission,
} from '../../api/owner';
import { OwnerShell } from './components/OwnerShell';

const permissions: Array<{ value: StaffPermission; label: string }> = [
  { value: 'ViewBookings', label: 'Xem booking' },
  { value: 'VerifyBooking', label: 'Xác minh mã' },
  { value: 'ConfirmPayment', label: 'Xác nhận thanh toán' },
  { value: 'CheckIn', label: 'Check-in' },
  { value: 'MarkNoShow', label: 'Đánh dấu no-show' },
];

const inputClass = 'h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';

export const OwnerStaff = () => {
  const { token } = useAuth();
  const [staff, setStaff] = useState<OwnerStaffAssignment[]>([]);
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [history, setHistory] = useState<OwnerCheckInHistory[]>([]);
  const [email, setEmail] = useState('');
  const [accountMode, setAccountMode] = useState<'create' | 'assign'>('create');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('Nhân viên vận hành');
  const [venueId, setVenueId] = useState(0);
  const [selectedPermissions, setSelectedPermissions] = useState<StaffPermission[]>(permissions.map((item) => item.value));
  const [historyVenueId, setHistoryVenueId] = useState(0);
  const [historyDate, setHistoryDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const [staffResult, venueResult, historyResult] = await Promise.all([
        getOwnerStaff(token),
        getOwnerVenues(token),
        getOwnerCheckInHistory(token, { venueId: historyVenueId || undefined, date: historyDate || undefined }),
      ]);
      setStaff(staffResult);
      setVenues(venueResult);
      setHistory(historyResult);
      if (!venueId && venueResult[0]) setVenueId(venueResult[0].venueId);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu nhân viên.');
    } finally {
      setIsLoading(false);
    }
  }, [historyDate, historyVenueId, token, venueId]);

  useEffect(() => { void load(); }, [load]);

  const activeCount = useMemo(() => staff.filter((item) => item.isActive).length, [staff]);
  const checkedInCount = useMemo(() => history.filter((item) => item.checkInStatus === 'CheckedIn').length, [history]);
  const noShowCount = useMemo(() => history.filter((item) => item.checkInStatus === 'NoShow').length, [history]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !venueId) return;
    setIsBusy(true); setError(''); setSuccess('');
    try {
      if (accountMode === 'create') {
        if (password !== confirmPassword) throw new Error('Mật khẩu xác nhận không khớp.');
        await createOwnerStaffAccount(token, { venueId, username, email, password, role, permissions: selectedPermissions });
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setSuccess('Đã tạo tài khoản Staff và phân công vào cụm sân. Hãy gửi thông tin đăng nhập cho nhân viên qua kênh an toàn.');
      } else {
        await assignOwnerStaff(token, { venueId, email, role, permissions: selectedPermissions });
        setSuccess('Đã gán tài khoản Staff có sẵn vào cụm sân.');
      }
      setEmail('');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể gán Staff.');
    } finally { setIsBusy(false); }
  };

  const saveAssignment = async (assignment: OwnerStaffAssignment, next: Partial<Pick<OwnerStaffAssignment, 'isActive' | 'permissions'>>) => {
    if (!token) return;
    setIsBusy(true); setError(''); setSuccess('');
    try {
      await updateOwnerStaff(token, assignment.staffId, {
        role: assignment.role,
        permissions: next.permissions ?? assignment.permissions,
        isActive: next.isActive ?? assignment.isActive,
      });
      setSuccess(next.isActive === false ? 'Đã thu hồi phân công Staff.' : 'Đã cập nhật quyền Staff.');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật Staff.');
    } finally { setIsBusy(false); }
  };

  const toggleDraftPermission = (permission: StaffPermission) => setSelectedPermissions((current) =>
    current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]);

  const generateTemporaryPassword = () => {
    const random = Array.from(crypto.getRandomValues(new Uint8Array(6)), (value) => value.toString(16).padStart(2, '0')).join('');
    const nextPassword = `Pk!7${random}`;
    setPassword(nextPassword);
    setConfirmPassword(nextPassword);
    setShowPassword(true);
  };

  return (
    <OwnerShell activeId="staff">
      <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-[13px] font-bold text-primary"><UsersRound className="h-4 w-4" /> Đội ngũ vận hành</p>
          <h1 className="mt-3 text-[32px] font-bold">Nhân viên & lịch sử check-in</h1>
          <p className="mt-2 text-[14px] text-on-surface-variant">Gán đúng cụm sân, cấp quyền tối thiểu cần thiết và theo dõi mọi thao tác tại quầy.</p>
        </div>
      </section>

      {(error || success) && <div className={`rounded-lg border px-4 py-3 text-[13px] font-bold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{error || success}</div>}

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Staff đang hoạt động', value: activeCount, icon: ShieldCheck },
          { label: 'Đã check-in', value: checkedInCount, icon: CheckCircle2 },
          { label: 'No-show', value: noShowCount, icon: XCircle },
        ].map((item) => <div className="rounded-xl border border-outline-variant bg-white p-5" key={item.label}><item.icon className="h-5 w-5 text-primary" /><p className="mt-3 text-[28px] font-bold">{item.value}</p><p className="text-[13px] text-on-surface-variant">{item.label}</p></div>)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form className="h-fit rounded-xl border border-outline-variant bg-white p-5 shadow-sm" onSubmit={submit}>
          <h2 className="flex items-center gap-2 text-[19px] font-bold"><UserPlus className="h-5 w-5 text-primary" /> Cấp tài khoản Staff</h2>
          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-2 rounded-lg bg-surface-container-low p-1">
              <button className={`rounded-md px-3 py-2 text-[12px] font-bold ${accountMode === 'create' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`} onClick={() => setAccountMode('create')} type="button">Tạo tài khoản mới</button>
              <button className={`rounded-md px-3 py-2 text-[12px] font-bold ${accountMode === 'assign' ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant'}`} onClick={() => setAccountMode('assign')} type="button">Gán tài khoản có sẵn</button>
            </div>
            {accountMode === 'create' && <label className="block"><span className="mb-1.5 block text-[12px] font-bold">Tên đăng nhập</span><input autoComplete="off" className={inputClass} maxLength={100} minLength={3} onChange={(event) => setUsername(event.target.value)} required value={username} /></label>}
            <label className="block"><span className="mb-1.5 block text-[12px] font-bold">Email tài khoản Staff</span><input autoComplete="off" className={inputClass} maxLength={255} onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
            {accountMode === 'create' && <>
              <div className="flex items-center justify-between gap-2"><span className="text-[12px] font-bold">Mật khẩu tạm</span><button className="text-[11px] font-bold text-primary" onClick={generateTemporaryPassword} type="button">Tạo mật khẩu mạnh</button></div>
              <input autoComplete="new-password" className={inputClass} minLength={8} onChange={(event) => setPassword(event.target.value)} placeholder="Chữ hoa, thường, số và ký tự đặc biệt" required type={showPassword ? 'text' : 'password'} value={password} />
              <label className="block"><span className="mb-1.5 block text-[12px] font-bold">Xác nhận mật khẩu</span><input autoComplete="new-password" className={inputClass} minLength={8} onChange={(event) => setConfirmPassword(event.target.value)} required type={showPassword ? 'text' : 'password'} value={confirmPassword} /></label>
              <label className="flex items-center gap-2 text-[11px] font-bold text-on-surface-variant"><input checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} type="checkbox" /> Hiện mật khẩu để bàn giao</label>
            </>}
            <label className="block"><span className="mb-1.5 block text-[12px] font-bold">Cụm sân</span><select className={inputClass} onChange={(event) => setVenueId(Number(event.target.value))} required value={venueId}>{!venues.length && <option value={0}>Chưa có cụm sân</option>}{venues.map((venue) => <option key={venue.venueId} value={venue.venueId}>{venue.venueName}</option>)}</select></label>
            <label className="block"><span className="mb-1.5 block text-[12px] font-bold">Chức danh</span><input className={inputClass} maxLength={100} onChange={(event) => setRole(event.target.value)} value={role} /></label>
            <fieldset><legend className="mb-2 text-[12px] font-bold">Quyền vận hành</legend><div className="space-y-2">{permissions.map((permission) => <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-outline-variant p-3 text-[13px] font-bold" key={permission.value}><input checked={selectedPermissions.includes(permission.value)} onChange={() => toggleDraftPermission(permission.value)} type="checkbox" />{permission.label}</label>)}</div></fieldset>
            <button className="w-full rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white disabled:opacity-50" disabled={isBusy || !venues.length || !selectedPermissions.length} type="submit">{accountMode === 'create' ? 'Tạo tài khoản & phân công' : 'Gán vào cụm sân'}</button>
          </div>
        </form>

        <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
          <div className="border-b border-outline-variant p-5"><h2 className="text-[19px] font-bold">Danh sách phân công</h2><p className="mt-1 text-[13px] text-on-surface-variant">Một tài khoản có thể được phân công vào nhiều cụm sân.</p></div>
          {isLoading ? <p className="p-8 text-center text-[13px] font-bold text-on-surface-variant">Đang tải...</p> : !staff.length ? <p className="p-8 text-center text-[13px] text-on-surface-variant">Chưa có Staff.</p> : <div className="divide-y divide-outline-variant">{staff.map((assignment) => (
            <article className="p-5" key={assignment.staffId}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div><div className="flex flex-wrap items-center gap-2"><h3 className="text-[16px] font-bold">{assignment.username}</h3><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${assignment.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{assignment.isActive ? 'Đang hoạt động' : 'Đã thu hồi'}</span></div><p className="mt-1 text-[13px] text-on-surface-variant">{assignment.email} · {assignment.role}</p><p className="mt-1 text-[13px] font-bold text-primary">{assignment.venueName}</p></div>
                <button className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-bold ${assignment.isActive ? 'border-red-200 text-red-600' : 'border-primary text-primary'}`} disabled={isBusy} onClick={() => void saveAssignment(assignment, { isActive: !assignment.isActive })} type="button">{assignment.isActive ? <><UserMinus className="h-4 w-4" /> Thu hồi</> : <><UserPlus className="h-4 w-4" /> Cấp lại</>}</button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">{permissions.map((permission) => { const enabled = assignment.permissions.includes(permission.value); return <button className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${enabled ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant text-on-surface-variant'}`} disabled={isBusy || !assignment.isActive} key={permission.value} onClick={() => void saveAssignment(assignment, { permissions: enabled ? assignment.permissions.filter((item) => item !== permission.value) : [...assignment.permissions, permission.value] })} type="button">{permission.label}</button>; })}</div>
            </article>
          ))}</div>}
        </section>
      </section>

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-outline-variant p-5 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="flex items-center gap-2 text-[19px] font-bold"><History className="h-5 w-5 text-primary" /> Lịch sử vận hành của Staff</h2><p className="mt-1 text-[13px] text-on-surface-variant">Mã, thanh toán, check-in và no-show đều lưu người thực hiện cùng thời gian.</p></div><div className="grid gap-2 sm:grid-cols-2"><select className={inputClass} onChange={(event) => setHistoryVenueId(Number(event.target.value))} value={historyVenueId}><option value={0}>Tất cả cụm sân</option>{venues.map((venue) => <option key={venue.venueId} value={venue.venueId}>{venue.venueName}</option>)}</select><input className={inputClass} onChange={(event) => setHistoryDate(event.target.value)} type="date" value={historyDate} /></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-surface-container-low text-[11px] uppercase text-on-surface-variant"><tr><th className="px-5 py-3">Booking</th><th className="px-5 py-3">Lịch sân</th><th className="px-5 py-3">Xác minh mã</th><th className="px-5 py-3">Thanh toán</th><th className="px-5 py-3">Kết quả</th></tr></thead><tbody className="divide-y divide-outline-variant">{history.map((item) => <tr key={item.bookingId}><td className="px-5 py-4"><p className="font-bold text-primary">{item.bookingCode}</p><p className="text-[12px] text-on-surface-variant">{item.playerName}</p></td><td className="px-5 py-4 text-[13px]"><p className="font-bold">{item.venueName} · Sân {item.courtNumber}</p><p className="text-on-surface-variant">{dateTime(item.startTime)}</p></td><td className="px-5 py-4 text-[12px]"><p className="font-bold">{item.codeVerifiedBy || '—'}</p><p className="text-on-surface-variant">{dateTime(item.codeVerifiedAt)}</p></td><td className="px-5 py-4 text-[12px]"><p className="font-bold">{item.paymentConfirmedBy || '—'}</p><p className="text-on-surface-variant">{dateTime(item.paymentConfirmedAt)}</p></td><td className="px-5 py-4 text-[12px]"><span className={`rounded-full px-2.5 py-1 font-bold ${item.checkInStatus === 'CheckedIn' ? 'bg-green-100 text-green-700' : item.checkInStatus === 'NoShow' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{item.checkInStatus}</span><p className="mt-2 font-bold">{item.checkedInBy || item.noShowBy || '—'}</p><p className="text-on-surface-variant">{dateTime(item.checkedInAt || item.noShowAt)}</p></td></tr>)}</tbody></table>{!history.length && !isLoading && <p className="p-8 text-center text-[13px] text-on-surface-variant"><Clock3 className="mx-auto mb-2 h-5 w-5" />Chưa có lịch sử phù hợp.</p>}</div>
      </section>
    </OwnerShell>
  );
};

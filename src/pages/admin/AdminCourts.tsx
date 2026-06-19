import { useEffect, useState } from 'react';
import { CheckCircle2, Eye, Search, ShieldAlert, XCircle } from 'lucide-react';
import { ApiError, toMediaUrl } from '../../api/client';
import { adminVenueApi } from '../../api/venues';
import type { VenueDetail, VenueListItem, VenueStatus } from '../../types/venue';
import { AdminShell } from './components/AdminShell';

const labels: Record<VenueStatus, string> = {
  Draft: 'Bản nháp', PendingApproval: 'Chờ duyệt', Published: 'Đã công khai', Rejected: 'Từ chối', Suspended: 'Đình chỉ',
};

export const AdminCourts = () => {
  const [venues, setVenues] = useState<VenueListItem[]>([]);
  const [selected, setSelected] = useState<VenueDetail | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('PendingApproval');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try { setVenues(await adminVenueApi.venues({ search, status, pageSize: 100 })); }
    catch (value) { setError(value instanceof ApiError ? value.message : 'Không thể tải danh sách cơ sở.'); }
  };

  useEffect(() => { void load(); }, [search, status]);

  const view = async (id: string) => {
    try { setSelected(await adminVenueApi.venue(id)); setReason(''); }
    catch (value) { setError(value instanceof ApiError ? value.message : 'Không thể tải chi tiết.'); }
  };

  const act = async (action: 'approve' | 'reject' | 'suspend') => {
    if (!selected) return;
    if (action !== 'approve' && !reason.trim()) { setError('Vui lòng nhập lý do.'); return; }
    try {
      if (action === 'approve') await adminVenueApi.approve(selected.id);
      if (action === 'reject') await adminVenueApi.reject(selected.id, reason);
      if (action === 'suspend') await adminVenueApi.suspend(selected.id, reason);
      setSelected(null); setReason(''); await load();
    } catch (value) { setError(value instanceof ApiError ? value.message : 'Thao tác thất bại.'); }
  };

  return (
    <AdminShell activeId="courts">
      <section className="mb-6"><p className="text-[12px] font-bold uppercase text-primary">Kiểm duyệt cơ sở</p><h1 className="text-[32px] font-bold">Sân Pickleball</h1><p className="mt-1 text-[14px] text-secondary">Duyệt thông tin cơ sở, vị trí, giờ hoạt động và danh sách sân trước khi công khai.</p></section>
      {error && <p className="mb-4 rounded-lg bg-error-container p-3 text-[13px] font-bold text-error">{error}</p>}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm">
          <div className="grid grid-cols-1 gap-3 border-b border-outline-variant p-4 md:grid-cols-[1fr_220px]"><label className="relative"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm tên hoặc địa chỉ" className="w-full rounded-lg border border-outline-variant py-2.5 pl-10 pr-3 text-[13px]" /></label><select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-outline-variant px-3 py-2.5 text-[13px]"><option value="">Tất cả trạng thái</option>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[13px]"><thead className="bg-surface text-secondary"><tr><th className="px-4 py-3">Cơ sở</th><th>Khu vực</th><th>Số sân</th><th>Trạng thái</th><th className="px-4 text-right">Chi tiết</th></tr></thead><tbody className="divide-y divide-outline-variant">{venues.map((venue) => <tr key={venue.id}><td className="px-4 py-3"><div className="flex items-center gap-3"><img src={toMediaUrl(venue.imageUrl)} alt="" className="h-10 w-14 rounded object-cover" /><strong>{venue.name}</strong></div></td><td>{venue.wardName}, {venue.provinceName}</td><td>{venue.courtCount}</td><td><span className="rounded-md bg-surface px-2 py-1 text-[11px] font-bold text-primary">{labels[venue.status]}</span></td><td className="px-4 text-right"><button onClick={() => void view(venue.id)} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-white"><Eye className="h-4 w-4" />Xem</button></td></tr>)}</tbody></table></div>
          {!venues.length && <p className="p-10 text-center text-secondary">Không có cơ sở trong bộ lọc này.</p>}
        </section>

        <aside className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm xl:sticky xl:top-20 xl:self-start">
          {!selected ? <div className="py-12 text-center text-secondary"><ShieldAlert className="mx-auto mb-3 h-8 w-8" /><p>Chọn một cơ sở để kiểm duyệt.</p></div> : <div><img src={toMediaUrl(selected.images[0]?.url)} alt={selected.name} className="h-44 w-full rounded-lg object-cover" /><p className="mt-4 text-[11px] font-bold uppercase text-primary">{labels[selected.status]}</p><h2 className="mt-1 text-[22px] font-bold">{selected.name}</h2><p className="mt-2 text-[13px] text-secondary">{selected.streetAddress}, {selected.wardName}, {selected.provinceName}</p><div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-surface p-3 text-[12px]"><span>{selected.courts.length} sân</span><span>{selected.images.length} ảnh</span><span>{selected.amenities.length} tiện ích</span><span>{selected.openingHours.length}/7 ngày</span></div>{selected.rejectionReason && <p className="mt-3 rounded-lg bg-error-container p-3 text-[12px] text-error">{selected.rejectionReason}</p>}<textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Lý do từ chối hoặc đình chỉ" rows={3} className="mt-4 w-full resize-none rounded-lg border border-outline-variant p-3 text-[13px]" /><div className="mt-3 grid grid-cols-2 gap-2">{selected.status === 'PendingApproval' && <><button onClick={() => void act('approve')} className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2.5 text-[12px] font-bold text-white"><CheckCircle2 className="h-4 w-4" />Duyệt</button><button onClick={() => void act('reject')} className="inline-flex items-center justify-center gap-1 rounded-lg border border-error text-[12px] font-bold text-error"><XCircle className="h-4 w-4" />Từ chối</button></>}{selected.status === 'Published' && <button onClick={() => void act('suspend')} className="col-span-2 rounded-lg border border-error px-3 py-2.5 text-[12px] font-bold text-error">Đình chỉ cơ sở</button>}</div></div>}
        </aside>
      </div>
    </AdminShell>
  );
};

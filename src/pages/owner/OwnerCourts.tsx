import { useCallback, useEffect, useState } from 'react';
import { Building2, Edit3, Plus, Send, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError, toMediaUrl } from '../../api/client';
import { ownerVenueApi } from '../../api/venues';
import type { CourtListItem, VenueListItem, VenueStatus } from '../../types/venue';
import { OwnerShell } from './components/OwnerShell';

const statusLabels: Record<VenueStatus, string> = {
  Draft: 'Bản nháp', PendingApproval: 'Chờ duyệt', Published: 'Đã công khai', Rejected: 'Bị từ chối', Suspended: 'Tạm đình chỉ',
};

const courtStatusLabels = {
  Available: 'Sẵn sàng',
  Maintenance: 'Bảo trì',
  Inactive: 'Ngừng hoạt động',
};

export const OwnerCourts = () => {
  const [venues, setVenues] = useState<VenueListItem[]>([]);
  const [courts, setCourts] = useState<CourtListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [venueItems, courtItems] = await Promise.all([ownerVenueApi.venues(), ownerVenueApi.courts()]);
      setVenues(venueItems); setCourts(courtItems);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Không thể tải dữ liệu sân.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const runAction = async (action: () => Promise<unknown>) => {
    setError('');
    try { await action(); await loadData(); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : 'Thao tác thất bại.'); }
  };

  return (
    <OwnerShell activeId="courts">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div><p className="text-[12px] font-bold uppercase text-primary">Vận hành sân</p><h1 className="text-[30px] font-bold">Cơ sở và sân Pickleball</h1><p className="mt-1 text-[14px] text-secondary">Quản lý nhiều cơ sở, cấu hình sân và gửi Admin duyệt.</p></div>
        <div className="flex gap-2"><Link to="/owner/venues/create" className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-[13px] font-bold text-primary"><Building2 className="h-4 w-4" />Tạo cơ sở</Link><Link to="/owner/courts/create" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-white"><Plus className="h-4 w-4" />Thêm sân</Link></div>
      </section>
      {error && <p className="rounded-lg bg-error-container p-3 text-[13px] font-bold text-error">{error}</p>}
      {loading ? <p>Đang tải dữ liệu...</p> : (
        <>
          <section>
            <h2 className="mb-3 text-[20px] font-bold">Cơ sở ({venues.length})</h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {venues.map((venue) => <article key={venue.id} className="flex overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm">
                <img src={toMediaUrl(venue.imageUrl) || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80'} alt={venue.name} className="h-40 w-40 shrink-0 object-cover" />
                <div className="min-w-0 flex-1 p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="truncate text-[17px] font-bold">{venue.name}</h3><p className="mt-1 text-[12px] text-secondary">{venue.wardName}, {venue.provinceName}</p></div><span className="rounded-md bg-surface px-2 py-1 text-[11px] font-bold text-primary">{statusLabels[venue.status]}</span></div><p className="mt-3 text-[13px] text-secondary">{venue.courtCount} sân · {venue.streetAddress}</p><div className="mt-4 flex flex-wrap gap-2"><Link to={`/owner/venues/${venue.id}/edit`} className="inline-flex items-center gap-1 rounded-md border border-outline-variant px-2.5 py-1.5 text-[12px] font-bold"><Edit3 className="h-3.5 w-3.5" />Sửa</Link>{(venue.status === 'Draft' || venue.status === 'Rejected') && <button onClick={() => void runAction(() => ownerVenueApi.submitVenue(venue.id))} className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-[12px] font-bold text-white"><Send className="h-3.5 w-3.5" />Gửi duyệt</button>}<button aria-label="Xóa cơ sở" onClick={() => void runAction(() => ownerVenueApi.deleteVenue(venue.id))} className="rounded-md border border-error/30 p-1.5 text-error"><Trash2 className="h-4 w-4" /></button></div></div>
              </article>)}
              {!venues.length && <p className="rounded-lg border border-dashed border-outline-variant p-8 text-center text-secondary lg:col-span-2">Chưa có cơ sở. Hãy tạo cơ sở đầu tiên.</p>}
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm">
            <div className="border-b border-outline-variant p-4"><h2 className="text-[20px] font-bold">Danh sách sân ({courts.length})</h2></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-[13px]"><thead className="bg-surface text-secondary"><tr><th className="px-4 py-3">Sân</th><th>Cơ sở</th><th>Giá/giờ</th><th>Slot</th><th>Trạng thái</th><th className="px-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-outline-variant">{courts.map((court) => <tr key={court.id}><td className="px-4 py-3 font-bold">{court.name}<span className="ml-2 text-[11px] text-secondary">{court.code}</span></td><td>{court.venueName}</td><td>{court.pricePerHour.toLocaleString('vi-VN')}đ</td><td>{court.slotDurationMinutes} phút</td><td>{courtStatusLabels[court.status]}</td><td className="px-4 text-right"><Link aria-label="Sửa sân" to={`/owner/courts/${court.id}/edit`} className="mr-2 inline-flex rounded-md border border-outline-variant p-2 text-primary"><Edit3 className="h-4 w-4" /></Link><button aria-label="Xóa sân" onClick={() => void runAction(() => ownerVenueApi.deleteCourt(court.id))} className="rounded-md border border-error/30 p-2 text-error"><Trash2 className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>
          </section>
        </>
      )}
    </OwnerShell>
  );
};

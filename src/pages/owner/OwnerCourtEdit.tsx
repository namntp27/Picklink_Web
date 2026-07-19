import { useEffect, useState } from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { getOwnerVenue, updateOwnerVenue, type OwnerVenue, type OwnerVenueInput } from '../../api/owner';
import { useAuth } from '../../auth/AuthContext';
import { OwnerShell } from './components/OwnerShell';
import { OwnerVenueForm } from './components/OwnerVenueForm';

export const OwnerCourtEdit = () => {
  const { token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const venueId = Number(id);
  const [venue, setVenue] = useState<OwnerVenue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !Number.isInteger(venueId)) return;
    getOwnerVenue(token, venueId)
      .then(setVenue)
      .catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải cụm sân.'))
      .finally(() => setIsLoading(false));
  }, [token, venueId]);

  const handleSubmit = async (input: OwnerVenueInput) => {
    if (!token) return;
    setError('');
    setIsSaving(true);
    try {
      await updateOwnerVenue(token, venueId, input);
      navigate(`/owner/courts/${venueId}`, { replace: true });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật cụm sân.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OwnerShell activeId="courts" innerClassName="max-w-4xl">
      <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-primary hover:underline" to={`/owner/courts/${venueId}`}>
        <ArrowLeft className="h-4 w-4" /> Quay lại chi tiết sân
      </Link>
      <section className="owner-panel p-5 md:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="rounded-lg bg-primary/10 p-2.5 text-primary"><Building2 className="h-5 w-5" /></span>
          <div><h1 className="font-bold">Chỉnh sửa cụm sân</h1><p className="text-[14px] text-on-surface-variant">Cập nhật địa chỉ, giờ hoạt động, tiện ích và giá cơ bản.</p></div>
        </div>
        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-700">{error}</div>}
        {isLoading && <p className="py-10 text-center text-[14px] font-bold text-on-surface-variant">Đang tải...</p>}
        {!isLoading && venue && (
          <OwnerVenueForm
            initial={{
              venueName: venue.venueName,
              address: venue.address,
              openTime: venue.openTime,
              closeTime: venue.closeTime,
              phoneNumber: venue.phoneNumber ?? '',
              latitude: venue.latitude?.toString() ?? '',
              longitude: venue.longitude?.toString() ?? '',
              basePrice: venue.basePrice.toString(),
              amenities: venue.amenities,
            }}
            isSaving={isSaving}
            onSubmit={handleSubmit}
          />
        )}
      </section>
    </OwnerShell>
  );
};

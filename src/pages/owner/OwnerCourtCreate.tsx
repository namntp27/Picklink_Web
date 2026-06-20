import { useState } from 'react';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { createOwnerVenue, type OwnerVenueInput } from '../../api/owner';
import { useAuth } from '../../auth/AuthContext';
import { OwnerShell } from './components/OwnerShell';
import { OwnerVenueForm } from './components/OwnerVenueForm';

export const OwnerCourtCreate = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (input: OwnerVenueInput) => {
    if (!token) return;
    setError('');
    setIsSaving(true);
    try {
      await createOwnerVenue(token, input);
      navigate('/owner/courts', { replace: true });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tạo cụm sân.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OwnerShell activeId="courts" innerClassName="max-w-4xl">
      <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-primary hover:underline" to="/owner/courts">
        <ArrowLeft className="h-4 w-4" /> Quay lại danh sách sân
      </Link>
      <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="rounded-lg bg-primary/10 p-3 text-primary"><Building2 className="h-6 w-6" /></span>
          <div><h1 className="text-[28px] font-bold">Tạo cụm sân</h1><p className="text-[14px] text-on-surface-variant">Thêm thông tin vận hành và tạo các sân con ban đầu.</p></div>
        </div>
        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-700">{error}</div>}
        <OwnerVenueForm isCreate isSaving={isSaving} onSubmit={handleSubmit} />
      </section>
    </OwnerShell>
  );
};

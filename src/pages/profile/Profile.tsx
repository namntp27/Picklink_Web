import { useEffect, useState } from 'react';
import { Camera, CheckCircle2, Heart, Loader2, MapPin, Save, Trophy, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { getMyProfile, updateMyProfile, uploadMyAvatar, type PlayerProfile } from '../../api/profile';
import { useAuth } from '../../auth/AuthContext';

const emptyProfile: PlayerProfile = {
  userId: 0,
  username: '',
  email: '',
  userType: 'Player',
  skillLevel: 0,
  matchesPlayed: 0,
};

const inputClass = 'h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

export const Profile = () => {
  const { token, refreshUser } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    getMyProfile(token)
      .then(setProfile)
      .catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải hồ sơ.'))
      .finally(() => setLoading(false));
  }, [token]);

  const setField = <Key extends keyof PlayerProfile>(key: Key, value: PlayerProfile[Key]) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setMessage('');
  };

  const save = async () => {
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateMyProfile(token, {
        username: profile.username,
        city: profile.city,
        commune: profile.commune,
        profileImageUrl: profile.profileImageUrl,
        skillLevel: profile.skillLevel ?? 0,
        playerSubType: profile.playerSubType,
        playFrequency: profile.playFrequency,
        preferredTimeSlot: profile.preferredTimeSlot,
        bio: profile.bio,
        birthDate: profile.birthDate,
        gender: profile.gender,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
      });
      setProfile(updated);
      await refreshUser();
      setMessage('Đã lưu hồ sơ cá nhân.');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật hồ sơ.');
    } finally { setSaving(false); }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!token || !file) return;
    setSaving(true);
    setError('');
    try {
      setProfile(await uploadMyAvatar(token, file));
      await refreshUser();
      setMessage('Đã cập nhật ảnh đại diện.');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải ảnh đại diện.');
    } finally {
      setSaving(false);
      event.target.value = '';
    }
  };

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return <div className="min-h-screen bg-surface-container-low pt-[72px] text-on-surface">
    <section className="border-b border-outline-variant bg-white"><div className="mx-auto flex max-w-[1100px] flex-col gap-5 px-4 py-8 md:flex-row md:items-end md:justify-between"><div><span className="inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-[13px] font-bold"><UserRound className="h-4 w-4" /> Hồ sơ Player</span><h1 className="mt-4 text-[34px] font-bold">Hồ sơ cá nhân</h1><p className="mt-2 text-[14px] text-on-surface-variant">Cập nhật avatar, trình độ, khu vực và hình thức chơi.</p></div><button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white disabled:opacity-50" disabled={saving} onClick={() => void save()} type="button">{saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Lưu thay đổi</button></div></section>

    <main className="mx-auto grid max-w-[1100px] gap-6 px-4 py-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-5"><section className="rounded-2xl border border-outline-variant bg-white p-6 text-center shadow-sm"><div className="relative mx-auto h-32 w-32"><div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-4 border-primary-container bg-surface-container-low">{profile.profileImageUrl ? <img alt={profile.username} className="h-full w-full object-cover" src={profile.profileImageUrl} /> : <UserRound className="h-14 w-14 text-primary/50" />}</div><label className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow"><Camera className="h-5 w-5" /><input accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={saving} onChange={(event) => void uploadAvatar(event)} type="file" /></label></div><h2 className="mt-4 text-[22px] font-bold">{profile.username}</h2><p className="mt-1 text-[13px] text-on-surface-variant">{profile.email}</p><span className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[13px] font-bold text-primary"><Trophy className="h-4 w-4" /> Level {(profile.skillLevel ?? 0).toFixed(1)}</span><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-lg bg-surface-container-low p-3"><p className="text-[22px] font-bold text-primary">{profile.matchesPlayed}</p><p className="text-[11px] font-bold text-on-surface-variant">Trận</p></div><div className="rounded-lg bg-surface-container-low p-3"><p className="text-[22px] font-bold text-primary">{profile.prestige ?? 0}</p><p className="text-[11px] font-bold text-on-surface-variant">Uy tín</p></div></div></section><Link className="flex items-center justify-center gap-2 rounded-xl border border-primary bg-white px-4 py-3 text-[14px] font-bold text-primary" to="/book-court?favorites=true"><Heart className="h-5 w-5" /> Xem sân yêu thích</Link></aside>

      <div className="space-y-5">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[14px] font-bold text-red-700">{error}</div>}
        {message && <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-[14px] font-bold text-emerald-700"><CheckCircle2 className="h-5 w-5" />{message}</div>}

        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm"><h2 className="text-[21px] font-bold">Thông tin người chơi</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><label><span className="mb-1 block text-[12px] font-bold text-on-surface-variant">Tên hiển thị</span><input className={inputClass} maxLength={100} onChange={(event) => setField('username', event.target.value)} value={profile.username} /></label><label><span className="mb-1 block text-[12px] font-bold text-on-surface-variant">Email</span><input className={`${inputClass} bg-surface-container-low text-on-surface-variant`} disabled value={profile.email} /></label><label><span className="mb-1 block text-[12px] font-bold text-on-surface-variant">Trình độ (0–5)</span><input className={inputClass} max="5" min="0" onChange={(event) => setField('skillLevel', Number(event.target.value))} step="0.5" type="number" value={profile.skillLevel ?? 0} /></label><label><span className="mb-1 block text-[12px] font-bold text-on-surface-variant">Hình thức chơi</span><select className={inputClass} onChange={(event) => setField('playerSubType', event.target.value)} value={profile.playerSubType ?? ''}><option value="">Chưa chọn</option><option value="Singles">Đánh đơn (1vs1)</option><option value="Doubles">Đánh đôi (2vs2)</option><option value="Both">Cả hai</option></select></label><label><span className="mb-1 block text-[12px] font-bold text-on-surface-variant">Tần suất chơi</span><select className={inputClass} onChange={(event) => setField('playFrequency', event.target.value)} value={profile.playFrequency ?? ''}><option value="">Chưa chọn</option><option value="Occasional">Thỉnh thoảng</option><option value="Weekly">Hàng tuần</option><option value="Frequent">Thường xuyên</option></select></label><label><span className="mb-1 block text-[12px] font-bold text-on-surface-variant">Khung giờ yêu thích</span><select className={inputClass} onChange={(event) => setField('preferredTimeSlot', event.target.value)} value={profile.preferredTimeSlot ?? ''}><option value="">Chưa chọn</option><option value="Morning">Buổi sáng</option><option value="Afternoon">Buổi chiều</option><option value="Evening">Buổi tối</option></select></label></div><label className="mt-4 block"><span className="mb-1 block text-[12px] font-bold text-on-surface-variant">Giới thiệu</span><textarea className="min-h-24 w-full rounded-lg border border-outline-variant p-3 text-[14px] outline-none focus:border-primary" maxLength={500} onChange={(event) => setField('bio', event.target.value)} value={profile.bio ?? ''} /></label></section>

        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm"><h2 className="flex items-center gap-2 text-[21px] font-bold"><MapPin className="h-5 w-5 text-primary" /> Khu vực</h2><div className="mt-5 grid gap-4 md:grid-cols-2"><label><span className="mb-1 block text-[12px] font-bold text-on-surface-variant">Tỉnh/thành phố</span><input className={inputClass} maxLength={100} onChange={(event) => setField('city', event.target.value)} placeholder="Ví dụ: Hà Nội" value={profile.city ?? ''} /></label><label><span className="mb-1 block text-[12px] font-bold text-on-surface-variant">Xã/phường</span><input className={inputClass} maxLength={150} onChange={(event) => setField('commune', event.target.value)} placeholder="Ví dụ: Cầu Giấy" value={profile.commune ?? ''} /></label></div></section>
      </div>
    </main>
  </div>;
};

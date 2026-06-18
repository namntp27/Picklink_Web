import React, { useMemo, useState } from 'react';
import {
  BadgeCheck,
  Camera,
  CheckCircle2,
  Heart,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Trophy,
  UserRound,
  X,
} from 'lucide-react';
import { getCourtsByWard, getWardsByProvince, provinceOptions } from '../community/Opponents';

type PlayerProfile = {
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
  level: string;
  province: string;
  ward: string;
  preferredFormat: '1vs1' | '2vs2' | 'both';
  favoritePlaces: string[];
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const levelOptions = ['Mới bắt đầu', '2.0 - 2.5', '2.5 - 3.0', '3.0 - 3.5', '3.5 - 4.0', '4.0+'];

const defaultProvince = provinceOptions[0] ?? '';
const defaultWard = getWardsByProvince(defaultProvince)[0] ?? '';

const initialProfile: PlayerProfile = {
  fullName: 'Nguyễn Minh Anh',
  email: 'minhanh@picklink.vn',
  phone: '0912 345 678',
  avatar: 'https://i.pravatar.cc/240?img=32',
  level: '3.5 - 4.0',
  province: defaultProvince,
  ward: defaultWard,
  preferredFormat: '2vs2',
  favoritePlaces: ['Pickleball Pro Duy Tân', 'Green Court Cầu Giấy'],
};

const defaultPasswordForm: PasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export const Profile = () => {
  const [profile, setProfile] = useState<PlayerProfile>(initialProfile);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>(defaultPasswordForm);
  const [favoriteCourtId, setFavoriteCourtId] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  const wardOptions = useMemo(() => getWardsByProvince(profile.province), [profile.province]);
  const favoriteCourtOptions = useMemo(
    () => getCourtsByWard(profile.province, profile.ward),
    [profile.province, profile.ward],
  );

  const selectedFavoriteCourtId = favoriteCourtOptions.some((court) => court.id === favoriteCourtId)
    ? favoriteCourtId
    : favoriteCourtOptions[0]?.id ?? '';

  const updateProfile = <Field extends keyof PlayerProfile>(field: Field, value: PlayerProfile[Field]) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setSaveMessage('');
  };

  const handleProvinceChange = (province: string) => {
    const nextWard = getWardsByProvince(province)[0] ?? '';

    setProfile((current) => ({
      ...current,
      province,
      ward: nextWard,
      favoritePlaces: [],
    }));
    setFavoriteCourtId('');
    setSaveMessage('');
  };

  const handleWardChange = (ward: string) => {
    setProfile((current) => ({
      ...current,
      ward,
      favoritePlaces: [],
    }));
    setFavoriteCourtId('');
    setSaveMessage('');
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    updateProfile('avatar', URL.createObjectURL(file));
  };

  const handleAddFavoritePlace = () => {
    const selectedCourt = favoriteCourtOptions.find((court) => court.id === selectedFavoriteCourtId);

    if (!selectedCourt || profile.favoritePlaces.includes(selectedCourt.name)) {
      return;
    }

    updateProfile('favoritePlaces', [...profile.favoritePlaces, selectedCourt.name]);
  };

  const handleRemoveFavoritePlace = (place: string) => {
    updateProfile(
      'favoritePlaces',
      profile.favoritePlaces.filter((favoritePlace) => favoritePlace !== place),
    );
  };

  const updatePasswordForm = (field: keyof PasswordForm, value: string) => {
    setPasswordForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveProfile = () => {
    setSaveMessage('Đã lưu hồ sơ cá nhân.');
  };

  const handleChangePassword = () => {
    setPasswordForm(defaultPasswordForm);
    setSaveMessage('Đã gửi yêu cầu đổi mật khẩu.');
  };

  return (
    <div className="flex w-full flex-1 flex-col overflow-x-hidden bg-[#f9f9ff] pt-[72px] font-body-md text-on-surface">
      <section className="border-b border-outline-variant bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-8 md:px-margin-desktop lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-[13px] font-bold text-on-primary-container">
              <UserRound className="h-4 w-4" />
              Hồ sơ người chơi
            </span>
            <h1 className="mt-4 text-[32px] font-bold leading-tight text-on-surface md:text-[42px]">Hồ sơ cá nhân</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-on-surface-variant">
              Quản lý thông tin tài khoản, trình độ chơi, nơi sống và các sân yêu thích.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            {saveMessage && (
              <span className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#eaf7df] px-4 py-3 text-[14px] font-bold text-primary">
                <CheckCircle2 className="h-5 w-5" />
                {saveMessage}
              </span>
            )}
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
              onClick={handleSaveProfile}
              type="button"
            >
              <Save className="h-5 w-5" />
              Lưu thay đổi
            </button>
          </div>
        </div>
      </section>

      <main className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-6 px-4 py-8 md:px-margin-desktop lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <img
                  alt={profile.fullName}
                  className="h-32 w-32 rounded-full border-4 border-primary-container object-cover"
                  src={profile.avatar}
                />
                <label
                  className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary/90"
                  title="Đổi ảnh đại diện"
                >
                  <Camera className="h-5 w-5" />
                  <input accept="image/*" className="hidden" onChange={handleAvatarChange} type="file" />
                </label>
              </div>
              <h2 className="mt-4 text-[22px] font-bold text-on-surface">{profile.fullName}</h2>
              <p className="mt-1 text-[14px] font-medium text-on-surface-variant">{profile.email}</p>
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[13px] font-bold text-primary">
                <Trophy className="h-4 w-4" />
                Level {profile.level}
              </span>
            </div>
          </section>

          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[18px] font-bold text-on-surface">
              <BadgeCheck className="h-5 w-5 text-primary" />
              Tổng quan
            </h2>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-surface-container-low p-3">
                <p className="text-[22px] font-bold text-primary">28</p>
                <p className="mt-1 text-[12px] font-bold text-on-surface-variant">Trận</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-3">
                <p className="text-[22px] font-bold text-primary">92%</p>
                <p className="mt-1 text-[12px] font-bold text-on-surface-variant">Check-in</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-3">
                <p className="text-[22px] font-bold text-primary">4.8</p>
                <p className="mt-1 text-[12px] font-bold text-on-surface-variant">Uy tín</p>
              </div>
            </div>
          </section>
        </aside>

        <div className="space-y-6">
          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[22px] font-bold text-on-surface">
              <UserRound className="h-5 w-5 text-primary" />
              Thông tin người dùng
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Họ và tên</span>
                <input
                  className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => updateProfile('fullName', event.target.value)}
                  value={profile.fullName}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Email</span>
                <span className="relative block">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <input
                    className="h-11 w-full rounded-lg border border-outline-variant bg-white pl-10 pr-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => updateProfile('email', event.target.value)}
                    type="email"
                    value={profile.email}
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Số điện thoại</span>
                <span className="relative block">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <input
                    className="h-11 w-full rounded-lg border border-outline-variant bg-white pl-10 pr-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => updateProfile('phone', event.target.value)}
                    value={profile.phone}
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Trình độ chơi</span>
                <select
                  className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => updateProfile('level', event.target.value)}
                  value={profile.level}
                >
                  {levelOptions.map((level) => (
                    <option key={level}>{level}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-[13px] font-bold text-on-surface-variant">Hình thức yêu thích</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '1vs1', value: '1vs1' },
                  { label: '2vs2', value: '2vs2' },
                  { label: 'Cả hai', value: 'both' },
                ].map((option) => (
                  <button
                    className={`rounded-lg border px-3 py-3 text-[14px] font-bold transition-colors ${
                      profile.preferredFormat === option.value
                        ? 'border-primary bg-primary text-white'
                        : 'border-outline-variant text-on-surface hover:bg-surface-container-low'
                    }`}
                    key={option.value}
                    onClick={() => updateProfile('preferredFormat', option.value as PlayerProfile['preferredFormat'])}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[22px] font-bold text-on-surface">
              <MapPin className="h-5 w-5 text-primary" />
              Nơi sống
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Tỉnh/thành</span>
                <select
                  className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => handleProvinceChange(event.target.value)}
                  value={profile.province}
                >
                  {provinceOptions.map((province) => (
                    <option key={province}>{province}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Xã/phường</span>
                <select
                  className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => handleWardChange(event.target.value)}
                  value={profile.ward}
                >
                  {wardOptions.map((ward) => (
                    <option key={ward}>{ward}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[22px] font-bold text-on-surface">
              <Heart className="h-5 w-5 text-primary" />
              Địa điểm yêu thích
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <select
                className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => setFavoriteCourtId(event.target.value)}
                value={selectedFavoriteCourtId}
              >
                {favoriteCourtOptions.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.name}
                  </option>
                ))}
              </select>
              <button
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-primary px-4 text-[14px] font-bold text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:border-outline-variant disabled:text-on-surface-variant"
                disabled={!selectedFavoriteCourtId}
                onClick={handleAddFavoritePlace}
                type="button"
              >
                <Heart className="h-5 w-5" />
                Thêm
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {profile.favoritePlaces.length > 0 ? (
                profile.favoritePlaces.map((place) => (
                  <span
                    className="inline-flex items-center gap-2 rounded-full bg-primary-container px-3 py-2 text-[13px] font-bold text-on-primary-container"
                    key={place}
                  >
                    {place}
                    <button
                      aria-label={`Xóa ${place}`}
                      className="rounded-full p-0.5 hover:bg-white/40"
                      onClick={() => handleRemoveFavoritePlace(place)}
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-[14px] font-medium text-on-surface-variant">Chưa có địa điểm yêu thích.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[22px] font-bold text-on-surface">
              <KeyRound className="h-5 w-5 text-primary" />
              Đổi mật khẩu
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Mật khẩu hiện tại</span>
                <span className="relative block">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <input
                    className="h-11 w-full rounded-lg border border-outline-variant bg-white pl-10 pr-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => updatePasswordForm('currentPassword', event.target.value)}
                    type="password"
                    value={passwordForm.currentPassword}
                  />
                </span>
              </label>

              <label className="block">
                <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Mật khẩu mới</span>
                <input
                  className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => updatePasswordForm('newPassword', event.target.value)}
                  type="password"
                  value={passwordForm.newPassword}
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Nhập lại mật khẩu</span>
                <input
                  className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => updatePasswordForm('confirmPassword', event.target.value)}
                  type="password"
                  value={passwordForm.confirmPassword}
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="inline-flex items-center gap-2 text-[13px] font-bold text-on-surface-variant">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Bảo mật tài khoản Picklink
              </span>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                onClick={handleChangePassword}
                type="button"
              >
                <KeyRound className="h-5 w-5" />
                Cập nhật mật khẩu
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Activity,
  CalendarDays,
  Camera,
  CheckCircle2,
  Clock3,
  Heart,
  Loader2,
  MapPin,
  Ruler,
  Save,
  Trophy,
  UserRound,
  Weight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { uploadToCloudinary } from '../../api/cloudinary';
import { getMyProfile, updateMyProfile, uploadMyAvatar, type PlayerProfile } from '../../api/profile';
import { useAuth } from '../../auth/AuthContext';
import { AdministrativeAreaSelects } from '../../components/location/AdministrativeAreaSelects';
import './profile.css';

const emptyProfile: PlayerProfile = {
  userId: 0,
  username: '',
  email: '',
  userType: 'Player',
  skillLevel: 0,
  matchesPlayed: 0,
};

const toOptionalNumber = (value: string) => value === '' ? null : Number(value);

export const Profile = () => {
  const { token, refreshUser } = useAuth();
  const shouldReduceMotion = useReducedMotion();
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
    setError('');
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
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!token || !file) return;
    setSaving(true);
    setError('');
    try {
      const { url } = await uploadToCloudinary(token, file, undefined, 'picklink_avatars');
      const updated = await updateMyProfile(token, {
        username: profile.username,
        city: profile.city,
        commune: profile.commune,
        profileImageUrl: url,
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
      setMessage('Đã cập nhật ảnh đại diện.');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải ảnh đại diện.');
    } finally {
      setSaving(false);
      event.target.value = '';
    }
  };

  if (loading) {
    return (
      <div aria-busy="true" aria-label="Đang tải hồ sơ" className="profile-root" role="status">
        <div className="profile-skeleton">
          <div className="profile-skeleton__inner">
            <div className="profile-skeleton__line" />
            <div className="grid gap-[18px] min-[900px]:grid-cols-[280px_minmax(0,1fr)]">
              <div className="profile-skeleton__block" />
              <div className="profile-skeleton__block min-[900px]:min-h-[560px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="profile-root"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 7 }}
      transition={{ duration: shouldReduceMotion ? 0.01 : 0.24, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="profile-shell">
        <header className="profile-page-header">
          <div>
            <p className="profile-kicker">
              <UserRound aria-hidden="true" className="h-4 w-4" />
              Hồ sơ người chơi
            </p>
            <h1 className="profile-page-title">Thông tin của bạn trên sân</h1>
            <p className="profile-page-description">
              Cập nhật trình độ, lịch chơi và khu vực để Picklink đề xuất sân, trận đấu phù hợp hơn.
            </p>
          </div>
          <button
            aria-busy={saving}
            className="profile-save-button"
            disabled={saving}
            form="player-profile-form"
            type="submit"
          >
            {saving ? <Loader2 aria-hidden="true" className="h-[18px] w-[18px] animate-spin motion-reduce:animate-none" /> : <Save aria-hidden="true" className="h-[18px] w-[18px]" />}
            {saving ? 'Đang lưu' : 'Lưu thay đổi'}
          </button>
        </header>

        <div className="profile-workspace">
          <aside className="profile-sidebar">
            <section className="profile-identity">
              <div className="profile-avatar-wrap">
                <div className="profile-avatar">
                  {profile.profileImageUrl ? (
                    <img
                      alt={`Ảnh đại diện của ${profile.username}`}
                      className="h-full w-full object-cover"
                      src={profile.profileImageUrl}
                    />
                  ) : (
                    <UserRound aria-hidden="true" className="h-11 w-11 text-white/48" />
                  )}
                </div>
                <label
                  className={`profile-avatar-action ${saving ? 'is-disabled' : ''}`}
                  title="Đổi ảnh đại diện"
                >
                  <Camera aria-hidden="true" className="h-[18px] w-[18px]" />
                  <span className="sr-only">Đổi ảnh đại diện</span>
                  <input
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    aria-label="Chọn ảnh đại diện mới"
                    className="sr-only"
                    disabled={saving}
                    onChange={(event) => void uploadAvatar(event)}
                    type="file"
                  />
                </label>
              </div>

              <h2 className="mt-5 break-words text-[19px] font-extrabold tracking-[-0.02em] text-white">
                {profile.username || 'Người chơi Picklink'}
              </h2>
              <p className="mt-1 break-all text-[12px] font-medium text-white/60">{profile.email}</p>
              <div className="mt-4">
                <span className="profile-level">
                  <Trophy aria-hidden="true" className="h-4 w-4" />
                  Trình độ {(profile.skillLevel ?? 0).toFixed(1)}
                </span>
              </div>

              <div className="profile-metrics">
                <div className="profile-metric">
                  <strong>{profile.matchesPlayed}</strong>
                  <span>Trận đã chơi</span>
                </div>
                <div className="profile-metric">
                  <strong>{profile.prestige ?? 0}</strong>
                  <span>Điểm uy tín</span>
                </div>
              </div>
            </section>

            <p className="px-1 text-[11px] leading-5 text-[#718077]">
              Ảnh JPG, PNG, WEBP hoặc GIF, dung lượng tối đa 2MB.
            </p>

            <Link className="profile-secondary-link" to="/book-court?favorites=true">
              <Heart aria-hidden="true" className="h-[18px] w-[18px]" />
              Sân yêu thích
            </Link>
          </aside>

          <div className="min-w-0">
            <div aria-live="polite" className="mb-3 grid gap-3">
              {error && (
                <div className="profile-status profile-status--error" role="alert">
                  <Activity aria-hidden="true" className="mt-0.5 h-[18px] w-[18px] shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {message && (
                <div className="profile-status profile-status--success">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 h-[18px] w-[18px] shrink-0" />
                  <span>{message}</span>
                </div>
              )}
            </div>

            <form
              className="profile-form-surface"
              id="player-profile-form"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <section className="profile-form-section">
                <div className="profile-section-heading">
                  <span className="profile-section-icon">
                    <UserRound aria-hidden="true" className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <h2>Thông tin cá nhân</h2>
                    <p>Tên hiển thị và thông tin cơ bản được dùng trong cộng đồng Picklink.</p>
                  </div>
                </div>

                <div className="profile-fields">
                  <label className="profile-field">
                    <span className="profile-field-label">Tên hiển thị</span>
                    <input
                      autoComplete="nickname"
                      className="profile-control"
                      maxLength={100}
                      minLength={3}
                      onChange={(event) => setField('username', event.target.value)}
                      required
                      value={profile.username}
                    />
                  </label>
                  <label className="profile-field">
                    <span className="profile-field-label">Email</span>
                    <input
                      autoComplete="email"
                      className="profile-control"
                      disabled
                      type="email"
                      value={profile.email}
                    />
                    <span className="profile-field-helper">Email đăng nhập không thể chỉnh sửa tại đây.</span>
                  </label>
                  <label className="profile-field">
                    <span className="profile-field-label">Ngày sinh</span>
                    <input
                      className="profile-control"
                      onChange={(event) => setField('birthDate', event.target.value || null)}
                      type="date"
                      value={profile.birthDate?.slice(0, 10) ?? ''}
                    />
                  </label>
                  <label className="profile-field">
                    <span className="profile-field-label">Giới tính</span>
                    <select
                      className="profile-control"
                      onChange={(event) => setField('gender', event.target.value)}
                      value={profile.gender ?? ''}
                    >
                      <option value="">Chưa chọn</option>
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                      <option value="Other">Khác</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="profile-form-section">
                <div className="profile-section-heading">
                  <span className="profile-section-icon">
                    <Trophy aria-hidden="true" className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <h2>Hồ sơ thi đấu</h2>
                    <p>Các lựa chọn này giúp hệ thống tìm người chơi và khung giờ phù hợp.</p>
                  </div>
                </div>

                <div className="profile-fields">
                  <label className="profile-field">
                    <span className="profile-field-label">Trình độ (0-5)</span>
                    <input
                      className="profile-control"
                      max="5"
                      min="0"
                      onChange={(event) => setField('skillLevel', Number(event.target.value))}
                      step="0.5"
                      type="number"
                      value={profile.skillLevel ?? 0}
                    />
                  </label>
                  <label className="profile-field">
                    <span className="profile-field-label">Hình thức chơi</span>
                    <select
                      className="profile-control"
                      onChange={(event) => setField('playerSubType', event.target.value)}
                      value={profile.playerSubType ?? ''}
                    >
                      <option value="">Chưa chọn</option>
                      <option value="Singles">Đánh đơn (1vs1)</option>
                      <option value="Doubles">Đánh đôi (2vs2)</option>
                      <option value="Both">Cả hai</option>
                    </select>
                  </label>
                  <label className="profile-field">
                    <span className="profile-field-label">Tần suất chơi</span>
                    <select
                      className="profile-control"
                      onChange={(event) => setField('playFrequency', event.target.value)}
                      value={profile.playFrequency ?? ''}
                    >
                      <option value="">Chưa chọn</option>
                      <option value="Occasional">Thỉnh thoảng</option>
                      <option value="Weekly">Hàng tuần</option>
                      <option value="Frequent">Thường xuyên</option>
                    </select>
                  </label>
                  <label className="profile-field">
                    <span className="profile-field-label">Khung giờ yêu thích</span>
                    <select
                      className="profile-control"
                      onChange={(event) => setField('preferredTimeSlot', event.target.value)}
                      value={profile.preferredTimeSlot ?? ''}
                    >
                      <option value="">Chưa chọn</option>
                      <option value="Morning">Buổi sáng</option>
                      <option value="Afternoon">Buổi chiều</option>
                      <option value="Evening">Buổi tối</option>
                    </select>
                  </label>
                </div>
              </section>

              <section className="profile-form-section">
                <div className="profile-section-heading">
                  <span className="profile-section-icon">
                    <Ruler aria-hidden="true" className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <h2>Thể chất và giới thiệu</h2>
                    <p>Bổ sung thông tin vừa đủ để đồng đội hiểu rõ hơn về bạn.</p>
                  </div>
                </div>

                <div className="profile-fields">
                  <label className="profile-field">
                    <span className="profile-field-label">Chiều cao (cm)</span>
                    <span className="relative">
                      <input
                        className="profile-control pr-10"
                        max="250"
                        min="50"
                        onChange={(event) => setField('heightCm', toOptionalNumber(event.target.value))}
                        placeholder="170"
                        step="0.1"
                        type="number"
                        value={profile.heightCm ?? ''}
                      />
                      <Ruler aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718077]" />
                    </span>
                  </label>
                  <label className="profile-field">
                    <span className="profile-field-label">Cân nặng (kg)</span>
                    <span className="relative">
                      <input
                        className="profile-control pr-10"
                        max="250"
                        min="20"
                        onChange={(event) => setField('weightKg', toOptionalNumber(event.target.value))}
                        placeholder="65"
                        step="0.1"
                        type="number"
                        value={profile.weightKg ?? ''}
                      />
                      <Weight aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718077]" />
                    </span>
                  </label>
                  <label className="profile-field profile-field--wide">
                    <span className="flex items-center justify-between gap-3">
                      <span className="profile-field-label">Giới thiệu</span>
                      <span className="text-[10px] font-semibold tabular-nums text-[#718077]">
                        {profile.bio?.length ?? 0}/500
                      </span>
                    </span>
                    <textarea
                      className="profile-control"
                      maxLength={500}
                      onChange={(event) => setField('bio', event.target.value)}
                      placeholder="Phong cách thi đấu, mục tiêu hoặc lịch chơi thường xuyên của bạn."
                      value={profile.bio ?? ''}
                    />
                  </label>
                </div>
              </section>

              <section className="profile-form-section">
                <div className="profile-section-heading">
                  <span className="profile-section-icon">
                    <MapPin aria-hidden="true" className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <h2>Khu vực hoạt động</h2>
                    <p>Thông tin khu vực giúp ưu tiên sân và cộng đồng ở gần bạn.</p>
                  </div>
                </div>

                <div className="profile-fields">
                  <AdministrativeAreaSelects
                    fieldClassName="profile-field"
                    labelClassName="profile-field-label"
                    onProvinceChange={(value) => {
                      setField('city', value);
                      setField('commune', null);
                    }}
                    onWardChange={(value) => setField('commune', value)}
                    province={profile.city}
                    selectClassName="profile-control"
                    ward={profile.commune}
                  />
                </div>
              </section>

              <div className="flex flex-wrap items-center gap-2 border-t border-[#d8e4d4] bg-[#f8fbf6] px-5 py-3 text-[11px] font-semibold text-[#627168]">
                <CalendarDays aria-hidden="true" className="h-4 w-4 text-[#477313]" />
                <span>Thông tin được dùng để cá nhân hóa gợi ý.</span>
                <Clock3 aria-hidden="true" className="ml-auto h-4 w-4 text-[#477313]" />
                <span>Có thể cập nhật bất cứ lúc nào.</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
